import { Module } from '@nestjs/common';
import { TmdbService } from './services/tmdb.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MoviesModule } from '../movies/movies.module';
import { TmdbApiService } from './services/tmdb-api.service';
import { TmdbTransformerService } from './services/tmdb-transformer.service';

@Module({
  imports: [HttpModule, ConfigModule, MoviesModule],
  providers: [TmdbService, TmdbApiService, TmdbTransformerService],
  exports: [TmdbService],
})
export class TmdbModule {}
