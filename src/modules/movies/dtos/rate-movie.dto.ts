import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RateMovieDto {
  @ApiProperty({
    description: 'ID of the movie to be rated',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  movieId: number;

  @ApiProperty({
    description: 'Rating value between 0.5 and 10',
    example: 8.5,
    type: Number,
    minimum: 0.5,
    maximum: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.5)
  @IsPositive()
  @Max(10.0)
  rating: number;
}
