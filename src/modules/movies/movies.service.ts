import { Injectable } from '@nestjs/common';
import { MovieFilterDto } from './dto/movies-filter.dto';
import { Paginated } from '../../common/pagination/interfaces/paginated.interface';
import { Movie } from './entities/movie.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { MovieQueryBuilder } from './utils/movie-query.builder';
@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
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
}
