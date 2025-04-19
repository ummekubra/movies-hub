// src/movies/services/movie-rating.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from '../entities/movie.entity';
import { MovieRating } from '../entities/movie-rating.entity';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RateMovieDto } from '../dtos/rate-movie.dto';
import { RatedMovieResponseDto } from '../dtos/rated-movie-response.dto';

@Injectable()
export class MovieRatingService {
  constructor(
    @InjectRepository(MovieRating)
    private readonly ratingRepository: Repository<MovieRating>,

    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  async rateMovie(
    user: User,
    dto: RateMovieDto,
  ): Promise<RatedMovieResponseDto> {
    const movie = await this.findMovieById(dto.movieId);
    const ratingEntity = await this.createOrUpdateUserRating(
      user,
      movie,
      dto.rating,
    );
    await this.updateMovieRatingStats(movie.id);
    return {
      movieId: movie.id,
      movieTitle: movie.title,
      rating: ratingEntity.rating,
      ratedAt: ratingEntity.updatedAt,
    };
  }

  private async findMovieById(id: number): Promise<Movie> {
    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) throw new NotFoundException('Movie not found');
    return movie;
  }

  private async createOrUpdateUserRating(
    user: User,
    movie: Movie,
    score: number,
  ): Promise<MovieRating> {
    let movieRated = await this.ratingRepository.findOne({
      where: { user: { id: user.id }, movie: { id: movie.id } },
    });

    if (movieRated) {
      movieRated.rating = score;
    } else {
      movieRated = this.ratingRepository.create({ user, movie, rating: score });
    }

    return await this.ratingRepository.save(movieRated);
  }

  private async updateMovieRatingStats(movieId: number): Promise<void> {
    const ratings = await this.ratingRepository.find({
      where: { movie: { id: movieId } },
    });

    if (ratings.length === 0) return;

    const total = ratings.reduce((sum, r) => sum + Number(r.rating), 0);
    const average = parseFloat((total / ratings.length).toFixed(1));

    await this.movieRepository.update(movieId, {
      userRatingAverage: average,
      userRatingCount: ratings.length,
    });
  }
}
