import { Module } from '@nestjs/common';
import { TmdbService } from './services/tmdb.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [HttpModule, ConfigModule, MoviesModule],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
