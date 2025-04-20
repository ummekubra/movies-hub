import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MovieFilterDto } from '../dtos/movies-filter.dto';
import { Paginated } from '../../../common/pagination/interfaces/paginated.interface';
import { Movie } from '../entities/movie.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { MovieQueryBuilder } from '../utils/movie-query.builder';
import { CreateMovieDto } from '../dtos/create-movie.dto';
import { Genre } from '../entities/genre.entity';
import { UpdateMovieDto } from '../dtos/update-movie.dto';
@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    private readonly paginationProvider: PaginationProvider,
    private readonly movieQueryBuilder: MovieQueryBuilder,
  ) {}

  async findAll(filterDto: MovieFilterDto): Promise<Paginated<Movie>> {
    // Create query builder with all needed relationships
    const queryBuilder = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.genres', 'genre');

    // Apply filters and sorting
    this.movieQueryBuilder.applyFilters(queryBuilder, filterDto);
    this.movieQueryBuilder.applySorting(queryBuilder, filterDto);

    // Apply pagination
    const result = await this.paginationProvider.paginate<Movie>(
      filterDto,
      queryBuilder,
    );

    return result;
  }

  async findOne(id: number): Promise<Movie> {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['genres'],
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return movie;
  }

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const { genreIds, ...movieData } = createMovieDto;
    const movie = this.movieRepository.create(movieData);

    if (genreIds?.length) {
      movie.genres = await this.loadGenresByIds(genreIds);
    }

    return this.movieRepository.save(movie);
  }

  async update(id: number, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.findOne(id);

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    const { genreIds, ...movieData } = updateMovieDto;
    Object.assign(movie, movieData);

    if (genreIds) {
      movie.genres = await this.loadGenresByIds(genreIds);
    }

    return this.movieRepository.save(movie);
  }

  private async loadGenresByIds(ids: number[]): Promise<Genre[]> {
    const genres = await this.genreRepository.find({ where: { id: In(ids) } });

    const foundIds = genres.map((genre) => genre.id);
    const missingIds = ids.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Invalid genre IDs: ${missingIds.join(', ')}`,
      );
    }

    return genres;
  }

  async remove(id: number): Promise<void> {
    const movie = await this.movieRepository.findOne({ where: { id } });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    try {
      await this.movieRepository.remove(movie);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete the movie: ${error.message}`,
      );
    }
  }
}
