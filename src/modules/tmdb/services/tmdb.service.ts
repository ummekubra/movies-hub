import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import {
  TMDBGenre,
  TMDBGenreResponse,
  TMDBMovieResponse,
} from '../interfaces/tmdb-responses.interface';
import { Genre } from '../../movies/entities/genre.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {
    this.apiKey = this.configService.get<string>('TMDB_API_KEY');
    this.baseUrl = this.configService.get<string>('TMDB_BASE_URL');
  }

  async fetchAllGenres(): Promise<TMDBGenre[]> {
    try {
      const url = `${this.baseUrl}/genre/movie/list?api_key=${this.apiKey}`;
      console.log('url: ', url);
      const { data } = await firstValueFrom(
        this.httpService.get<TMDBGenreResponse>(url),
      );
      this.logger.log(data);
      return data.genres;
    } catch (error) {
      this.logger.error(`Error fetching genres from TMDB: ${error.message}`);
      throw error;
    }
  }

  async syncGenres(tmdbGenres: TMDBGenre[]) {
    // Early exit if no genres to process
    if (!tmdbGenres || tmdbGenres.length === 0) {
      return;
    }

    try {
      // Transforming TMDB genres to match entity structure
      const genres = tmdbGenres.map((genre) => ({
        tmdbId: genre.id,
        name: genre.name,
      }));

      // Single database operation to handle both inserts and updates
      await this.genreRepository.upsert(genres, {
        conflictPaths: ['tmdbId'],
        skipUpdateIfNoValuesChanged: true,
      });
    } catch (error) {
      this.logger.error('Failed to sync genres', error.stack);
      throw new Error('Failed to sync genres');
    }
  }

  async fetchPopularMovies(page = 1): Promise<void> {
    try {
      const url = `${this.baseUrl}/movie/popular?api_key=${this.apiKey}&page=${page}`;
      const { data } = await firstValueFrom(
        this.httpService.get<TMDBMovieResponse>(url),
      );

      this.logger.log(data);
    } catch (error) {
      this.logger.error(
        `Error fetching popular movies from TMDB: ${error.message}`,
      );
      throw error;
    }
  }

  // Scheduled task to sync data nightly
  @Cron('* * * * *') // Run at midnight every day @Cron('0 0 * * *')
  async syncData() {
    this.logger.log('Starting TMDB data synchronization...');
    try {
      const tmdbGenres: TMDBGenre[] = await this.fetchAllGenres();
      await this.syncGenres(tmdbGenres);
      // await this.fetchPopularMovies();
      this.logger.log('TMDB data synchronization completed successfully');
    } catch (error) {
      this.logger.error(`TMDB data synchronization failed: ${error.message}`);
    }
  }
}
