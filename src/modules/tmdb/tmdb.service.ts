import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import {
  TMDBGenreResponse,
  TMDBMovieResponse,
} from './interfaces/tmdb-responses.interface';

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('TMDB_API_KEY');
    this.baseUrl = this.configService.get<string>('TMDB_BASE_URL');
  }

  async fetchAllGenres(): Promise<any> {
    try {
      const url = `${this.baseUrl}/genre/movie/list?api_key=${this.apiKey}`;
      console.log('url: ', url);
      const { data } = await firstValueFrom(
        this.httpService.get<TMDBGenreResponse>(url),
      );

      this.logger.log(data);
      return data;
    } catch (error) {
      this.logger.error(`Error fetching genres from TMDB: ${error.message}`);
      throw error;
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
  @Cron('0 0 * * *') // Run at midnight every day
  async syncData() {
    this.logger.log('Starting TMDB data synchronization...');
    try {
      await this.fetchAllGenres();
      await this.fetchPopularMovies();
      this.logger.log('TMDB data synchronization completed successfully');
    } catch (error) {
      this.logger.error(`TMDB data synchronization failed: ${error.message}`);
    }
  }
}
