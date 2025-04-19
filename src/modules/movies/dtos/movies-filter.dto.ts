import {
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsDateString,
  IsNumberString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseFilterDto } from '../../../common/pagination/dtos/base-filter.dto';

export class MovieFilterDto extends BaseFilterDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  genreNames?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    return value?.split(',').map(Number) ?? [];
  })
  genreIds?: number[];

  @IsOptional()
  @IsDateString()
  releaseDateFrom?: string;

  @IsOptional()
  @IsDateString()
  releaseDateTo?: string;

  @IsOptional()
  @IsNumberString()
  minRating?: string;

  @IsOptional()
  @IsNumberString()
  maxRating?: string;

  @IsOptional()
  @IsEnum([
    'title',
    'releaseDate',
    'popularity',
    'voteAverage',
    'userRatingAverage',
  ])
  sortBy?: string = 'popularity';
}
