import { Module } from '@nestjs/common';
import { MoviesService } from './services/movies.service';
import { MoviesController } from './controllers/movies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { MovieRating } from './entities/movie-rating.entity';
import { Watchlist } from './entities/watchlist.entity';
import { Genre } from './entities/genre.entity';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { MovieQueryBuilder } from './utils/movie-query.builder';
import { MovieRatingController } from './controllers/movie-rating.controller';
import { MovieRatingService } from './services/movie-rating.service';
import { WatchlistService } from './services/watchlist.service';
import { WatchlistController } from './controllers/watchlist.controller';
import { UsersModule } from '../users/users.module';
import { CacheService } from 'src/common/cache/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie, MovieRating, Watchlist, Genre]),
    PaginationModule,
    UsersModule,
  ],
  controllers: [MoviesController, MovieRatingController, WatchlistController],
  providers: [
    MoviesService,
    MovieRatingService,
    MovieQueryBuilder,
    WatchlistService,
    CacheService,
  ],
  exports: [TypeOrmModule],
})
export class MoviesModule {}
