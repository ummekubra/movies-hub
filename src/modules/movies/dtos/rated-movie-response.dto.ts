import { ApiProperty } from '@nestjs/swagger';

export class RatedMovieResponseDto {
  @ApiProperty({
    description: 'ID of a movie being rated',
    example: '1',
  })
  movieId: number;

  @ApiProperty({
    description: 'Title of the which is been updated',
    example: "A Knight's War",
  })
  movieTitle: string;

  @ApiProperty({
    description: 'Rating value between 0.5 and 10',
    example: 8.5,
    type: Number,
    minimum: 0.5,
    maximum: 10,
  })
  rating: number;

  @ApiProperty({
    description: 'Date movie was rated',
    example: '2025-04-19T11:14:25.034Z',
  })
  ratedAt: Date;
}
