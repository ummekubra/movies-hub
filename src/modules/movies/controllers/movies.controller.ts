import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MoviesService } from '../services/movies.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Movie } from '../entities/movie.entity';
import { Paginated } from '../../../common/pagination/interfaces/paginated.interface';
import { MovieFilterDto } from '../dtos/movies-filter.dto';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { CreateMovieDto } from '../dtos/create-movie.dto';
import { UpdateMovieDto } from '../dtos/update-movie.dto';

@ApiTags('Movies')
@ApiBearerAuth()
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get movie by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the movie with the specified ID',
    type: Movie,
  })
  @ApiResponse({
    status: 404,
    description: 'Movie not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Movie ID',
    type: Number,
  })
  async findOne(@Param('id') id: number): Promise<Movie> {
    return this.moviesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Create a new movie',
  })
  @ApiResponse({
    status: 201,
    description: 'Movie has been successfully created',
    type: Movie,
  })
  @ApiBody({
    description: 'Movie data to create',
    type: CreateMovieDto,
  })
  async create(@Body() createMovieDto: CreateMovieDto): Promise<Movie> {
    return this.moviesService.create(createMovieDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a movie',
  })
  @ApiResponse({
    status: 200,
    description: 'Movie has been successfully updated',
    type: Movie,
  })
  @ApiResponse({
    status: 404,
    description: 'Movie not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Movie ID',
    type: Number,
  })
  @ApiBody({
    description: 'Movie data to update',
    type: UpdateMovieDto,
  })
  async update(
    @Param('id') id: number,
    @Body() updateMovieDto: UpdateMovieDto,
  ): Promise<Movie> {
    return this.moviesService.update(id, updateMovieDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a movie',
  })
  @ApiResponse({
    status: 200,
    description: 'Movie has been successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Movie not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Movie ID',
    type: Number,
  })
  async remove(@Param('id') id: number): Promise<void> {
    return this.moviesService.remove(id);
  }
}
