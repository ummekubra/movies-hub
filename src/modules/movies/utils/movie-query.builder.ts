import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { Movie } from '../entities/movie.entity';
import { MovieFilterDto } from '../dto/movies-filter.dto';

@Injectable()
export class MovieQueryBuilder {
  applyFilters(
    query: SelectQueryBuilder<Movie>,
    filterDto: MovieFilterDto,
  ): void {
    // Build filters object with conditional parameters
    const filterParams: Record<string, any> = {};
    const whereClauses: string[] = [];

    // Title filter - Case insensitive search
    if (filterDto.title) {
      whereClauses.push('LOWER(movie.title) LIKE :title');
      filterParams.title = `%${filterDto.title.toLowerCase()}%`;
    }

    // Overview filter - Case insensitive search
    if (filterDto.overview) {
      whereClauses.push('LOWER(movie.overview) LIKE :overview');
      filterParams.overview = `%${filterDto.overview.toLowerCase()}%`;
    }

    // Genre filter - Using EXISTS for better performance with indexes
    if (filterDto.genreIds?.length) {
      whereClauses.push('genre.id IN (:...genreIds)');
      filterParams.genreIds = filterDto.genreIds;
    }

    // --- Genre Filter (by name) ---
    if (filterDto.genreNames?.length) {
      whereClauses.push('LOWER(genre.name) IN (:...genreNames)');
      filterParams.genreNames = filterDto.genreNames.map((name) =>
        name.toLowerCase().trim(),
      );
    }

    if (filterDto.releaseDateFrom) {
      whereClauses.push('movie.releaseDate >= :releaseDateFrom');
      filterParams.releaseDateFrom = filterDto.releaseDateFrom;
    }

    if (filterDto.releaseDateTo) {
      whereClauses.push('movie.releaseDate <= :releaseDateTo');
      filterParams.releaseDateTo = filterDto.releaseDateTo;
    }

    if (filterDto.minRating) {
      whereClauses.push('movie.userRatingAverage >= :minRating');
      filterParams.minRating = filterDto.minRating;
    }

    if (filterDto.maxRating) {
      whereClauses.push('movie.userRatingAverage <= :maxRating');
      filterParams.maxRating = filterDto.maxRating;
    }

    if (whereClauses.length > 0) {
      query.where(whereClauses.join(' AND '), filterParams);
    }
  }

  applySorting(
    query: SelectQueryBuilder<Movie>,
    filterDto: MovieFilterDto,
  ): void {
    const sortBy = filterDto.sortBy ?? 'popularity';
    const order = filterDto.order ?? 'DESC';
    query.orderBy(`movie.${sortBy}`, order);
  }
}
