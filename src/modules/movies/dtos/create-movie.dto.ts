import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMovieDto {
  @ApiProperty({
    description: 'TMDB ID of the movie',
    example: 550,
  })
  @IsInt()
  @IsNotEmpty()
  tmdbId: number;

  @ApiProperty({
    description: 'Title of the movie',
    example: 'Fight Club',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Overview of the movie',
    example: 'A ticking-time-bomb insomniac and a slippery soap salesman...',
  })
  @IsString()
  @IsOptional()
  overview?: string;

  @ApiPropertyOptional({
    description: 'Path to the movie poster',
    example: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  })
  @IsString()
  @IsOptional()
  posterPath?: string;

  @ApiPropertyOptional({
    description: 'Path to the movie backdrop',
    example: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
  })
  @IsString()
  @IsOptional()
  backdropPath?: string;

  @ApiPropertyOptional({
    description: 'Release date of the movie',
    example: '1999-10-15',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  releaseDate?: Date;

  @ApiPropertyOptional({
    description: 'Popularity score from TMDB',
    example: 41.891,
  })
  @IsNumber()
  @IsOptional()
  popularity?: number;

  @ApiPropertyOptional({
    description: 'Vote average from TMDb',
    example: 8.4,
  })
  @IsNumber()
  @IsOptional()
  voteAverage?: number;

  @ApiPropertyOptional({
    description: 'Vote count from TMDb',
    example: 24371,
  })
  @IsInt()
  @IsOptional()
  voteCount?: number;

  @ApiPropertyOptional({
    description: 'Array of genre IDs for the movie',
    example: [18, 53],
    isArray: true,
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  genreIds?: number[];
}
