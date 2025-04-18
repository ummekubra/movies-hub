import { Controller, Get, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Movie } from './entities/movie.entity';
import { MovieFilterDto } from './dto/movies-filter.dto';
import { Paginated } from 'src/common/pagination/interfaces/paginated.interface';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all movies with search, filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of movies with filtering options',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Filter by movie title',
  })
  @ApiQuery({
    name: 'overview',
    required: false,
    description: 'Filter by overview content',
  })
  @ApiQuery({
    name: 'genreIds',
    required: false,
    description: 'Filter by genre IDs (comma separated)',
  })
  @ApiQuery({
    name: 'genreNames',
    required: false,
    description: 'Filter by genre (comma separated)',
    style: 'form',
    explode: false,
    isArray: true,
    example: ['Action', 'Thriller', 'Horror'],
  })
  @ApiQuery({
    name: 'releaseDateFrom',
    required: false,
    description: 'Filter by release date (from)',
  })
  @ApiQuery({
    name: 'releaseDateTo',
    required: false,
    description: 'Filter by release date (to)',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    description: 'Filter by minimum user rating',
  })
  @ApiQuery({
    name: 'maxRating',
    required: false,
    description: 'Filter by maximum user rating',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: [
      'title',
      'releaseDate',
      'popularity',
      'voteAverage',
      'userRatingAverage',
    ],
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  async findAll(@Query() filterDto: MovieFilterDto): Promise<Paginated<Movie>> {
    return this.moviesService.findAll(filterDto);
  }
}
