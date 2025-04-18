import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { MovieRating } from './entities/movie-rating.entity';
import { Watchlist } from './entities/watchlist.entity';
import { Genre } from './entities/genre.entity';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { MovieQueryBuilder } from './utils/movie-query.builder';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie, MovieRating, Watchlist, Genre]),
    PaginationModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService, MovieQueryBuilder],
  exports: [TypeOrmModule],
})
export class MoviesModule {}
