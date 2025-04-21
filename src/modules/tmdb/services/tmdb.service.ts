import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from '../../../modules/movies/entities/genre.entity';
import { Movie } from '../../../modules/movies/entities/movie.entity';
import { In, Repository } from 'typeorm';
import { TmdbApiService } from './tmdb-api.service';
import { TmdbTransformerService } from './tmdb-transformer.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);

  constructor(
    private readonly tmdbApiService: TmdbApiService,
    private readonly transformer: TmdbTransformerService,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly configService: ConfigService,
  ) {}

  onApplicationBootstrap() {
    this.logger.log('Running cron once to sync tmdb');
    this.syncData();
  }

  async syncGenres(): Promise<void> {
    try {
      const genres = await this.tmdbApiService.getGenres();
      if (!genres.length) return;
      const genreEntities = this.transformer.transformGenres(genres);

      await this.genreRepository.upsert(genreEntities, {
        conflictPaths: ['tmdbId'],
        skipUpdateIfNoValuesChanged: true,
      });
    } catch (err) {
      this.logger.error('Error syncing genres', err.stack ?? err.message);
      throw new InternalServerErrorException('Failed to sync genres');
    }
  }

  async syncPopularMovies(): Promise<void> {
    try {
      const genreMap = await this.getGenreMap();
      const allMovies: Partial<Movie>[] = [];

      const firstPage = await this.tmdbApiService.getPopularMovies(1);
      const numSyncPages = this.configService.get<number>('SYNC_PAGE_COUNT');
      const totalPages: number = numSyncPages ?? firstPage.total_pages;

      allMovies.push(
        ...this.transformer.transformMovies(firstPage.results, genreMap),
      );

      const concurrency = 5;
      const remainingPages = Array.from(
        { length: totalPages - 1 },
        (_, i) => i + 2,
      );

      for (let i = 0; i < remainingPages.length; i += concurrency) {
        const chunk = remainingPages.slice(i, i + concurrency);
        const results = await Promise.allSettled(
          chunk.map((page) => this.tmdbApiService.getPopularMovies(page)),
        );

        for (const [j, result] of results.entries()) {
          const page = chunk[j];
          if (result.status === 'fulfilled') {
            allMovies.push(
              ...this.transformer.transformMovies(
                result.value.results,
                genreMap,
              ),
            );
          } else {
            this.logger.warn(`Failed to fetch page ${page}: ${result.reason}`);
          }
        }
      }

      if (allMovies.length > 0) {
        await this.deduplicateAndUpdateMovies(allMovies);
      }
    } catch (error) {
      this.logger.error(`Error fetching popular movies: ${error.message}`);
      throw error;
    }
  }

  private async deduplicateAndUpdateMovies(
    movies: Partial<Movie>[],
  ): Promise<void> {
    const uniqueMoviesMap = new Map<number, Partial<Movie>>();
    for (const movie of movies) {
      uniqueMoviesMap.set(movie.tmdbId, movie); // Overwrites duplicates
    }
    const uniqueMovies = Array.from(uniqueMoviesMap.values());

    if (uniqueMovies.length === 0) {
      this.logger.warn('No unique movies to upsert.');
      return;
    }

    const existingMoviesMap = await this.getExistingMovies(uniqueMovies);

    // Prepare entities to save
    const moviesToSave: Movie[] = [];

    for (const movieData of uniqueMovies) {
      const existing = existingMoviesMap.get(movieData.tmdbId);

      if (existing) {
        // Update existing movie but preserve the id
        const updatedMovie = {
          ...existing,
          ...movieData,
        };

        moviesToSave.push(updatedMovie as Movie);
      } else {
        // New movie
        moviesToSave.push(movieData as Movie);
      }
    }

    // Save all entities with relationships intact
    await this.movieRepository.save(moviesToSave);

    this.logger.log(`Successfully processed ${moviesToSave.length} movies`);
  }

  private async getExistingMovies(uniqueMovies): Promise<Map<number, Movie>> {
    // Find existing movies with their genres
    const existingMovies = await this.movieRepository.find({
      where: { tmdbId: In(uniqueMovies.map((movie) => movie.tmdbId)) },
      relations: ['genres'],
    });

    return new Map(existingMovies.map((movie) => [movie.tmdbId, movie]));
  }

  private async getGenreMap(): Promise<Map<number, Genre>> {
    const genres = await this.genreRepository.find();
    return new Map(genres.map((g) => [g.tmdbId, g]));
  }

  // Scheduled task to sync data nightly
  @Cron('0 0 * * *') // Midnight daily
  async syncData(): Promise<void> {
    this.logger.log('Starting TMDB data sync...');
    try {
      await this.syncGenres();
      await this.syncPopularMovies();
      this.logger.log('TMDB data sync completed.');
    } catch (err) {
      this.logger.error(`TMDB sync failed: ${err.message}`, err.stack);
    }
  }
}
