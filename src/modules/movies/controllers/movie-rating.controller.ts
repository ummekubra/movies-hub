// src/movies/controllers/movie-rating.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { MovieRatingService } from '../services/movie-rating.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RateMovieDto } from '../dtos/rate-movie.dto';
import { RatedMovieResponseDto } from '../dtos/rated-movie-response.dto';

@ApiTags('Movie Ratings')
@Controller('ratings')
export class MovieRatingController {
  constructor(private readonly ratingService: MovieRatingService) {}

  @Post()
  @ApiOperation({ summary: 'Rate a movie' })
  @ApiResponse({
    status: 200,
    description: 'Movie has been rated successfully',
    type: RatedMovieResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async rateMovie(@Request() req, @Body() dto: RateMovieDto) {
    return this.ratingService.rateMovie(req.user, dto);
  }
}
