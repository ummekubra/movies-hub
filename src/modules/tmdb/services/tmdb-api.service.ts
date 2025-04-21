import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  TMDBGenre,
  TMDBGenreResponse,
  TMDBMovieResponse,
} from '../interfaces/tmdb-responses.interface';

@Injectable()
export class TmdbApiService {
  private readonly logger = new Logger(TmdbApiService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('TMDB_API_KEY');
    this.baseUrl = this.configService.get<string>('TMDB_BASE_URL');

    if (!this.apiKey) {
      throw new InternalServerErrorException('TMDB_API_KEY must be provided');
    }
  }

  private buildUrl(
    path: string,
    query: Record<string, string | number> = {},
  ): string {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      ...Object.fromEntries(
        Object.entries(query).map(([k, v]) => [k, String(v)]),
      ),
    });
    return `${this.baseUrl}${path}?${params.toString()}`;
  }

  async getGenres(): Promise<TMDBGenre[]> {
    try {
      const url = this.buildUrl('/genre/movie/list');
      const { data } = await firstValueFrom(
        this.httpService.get<TMDBGenreResponse>(url),
      );
      return data.genres;
    } catch (error) {
      this.logger.error(
        'Failed to fetch genres from TMDB',
        error.stack ?? error.message,
      );
      throw new InternalServerErrorException(
        'Failed to fetch genres from TMDB',
      );
    }
  }

  async getPopularMovies(page = 1): Promise<TMDBMovieResponse> {
    try {
      const url = this.buildUrl('/movie/popular', { page });
      const { data } = await firstValueFrom(
        this.httpService.get<TMDBMovieResponse>(url),
      );
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch popular movies (page ${page})`,
        error.stack ?? error.message,
      );
      throw new InternalServerErrorException(
        `Failed to fetch popular movies from TMDB`,
      );
    }
  }
}
