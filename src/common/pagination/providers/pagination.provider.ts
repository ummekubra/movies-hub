import { Inject, Injectable } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Paginated } from '../interfaces/paginated.interface';
import { BaseFilterDto } from '../dtos/base-filter.dto';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ParsedQs } from 'qs';

@Injectable()
export class PaginationProvider {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  public async paginate<T extends ObjectLiteral>(
    paginationQuery: BaseFilterDto,
    queryBuilder: SelectQueryBuilder<T>,
  ): Promise<Paginated<T>> {
    const { page = 1, limit = 10 } = paginationQuery;

    // Calculate total before applying pagination
    const totalItems = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalItems / limit);

    // Apply pagination to query
    const results = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Create the request URLs
    const baseURL = `${this.request.protocol}://${this.request.headers.host}`;
    const path = this.request.originalUrl.split('?')[0];
    // const path = this.request.route
    //   ? this.request.route.path
    //   : this.request.path;

    // Parse existing query parameters
    const queryParams = new URLSearchParams();

    // Helper function to safely handle different value types
    const addQueryParam = (
      key: string,
      value: string | string[] | ParsedQs | ParsedQs[],
    ) => {
      if (key === 'page') return; // Skip page parameter as we'll set it later

      if (Array.isArray(value)) {
        // Handle array values
        value.forEach((val) => {
          if (typeof val === 'string') {
            queryParams.append(key, val);
          } else if (val !== null && val !== undefined) {
            queryParams.append(key, String(val));
          }
        });
      } else if (typeof value === 'string') {
        // Handle string values
        queryParams.set(key, value);
      } else if (value !== null && value !== undefined) {
        // Handle object values by converting to string
        queryParams.set(key, String(value));
      }
    };

    // Process all query parameters
    Object.entries(this.request.query || {}).forEach(([key, value]) =>
      addQueryParam(key, String(value)),
    );

    // Function to build URL with page parameter
    const buildUrl = (pageNum: number) => {
      const params = new URLSearchParams(queryParams);
      params.set('limit', limit.toString());
      params.set('page', pageNum.toString());
      return `${baseURL}${path}?${params.toString()}`;
    };

    // Calculate next and previous page numbers
    const nextPage = page < totalPages ? page + 1 : page;
    const previousPage = page > 1 ? page - 1 : 1;

    return {
      data: results,
      meta: {
        itemsPerPage: limit,
        totalItems: totalItems,
        currentPage: page,
        totalPages: totalPages,
      },
      links: {
        first: buildUrl(1),
        previous: buildUrl(previousPage),
        current: buildUrl(page),
        next: buildUrl(nextPage),
        last: buildUrl(totalPages || 1),
      },
    };
  }
}
