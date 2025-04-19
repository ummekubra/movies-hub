import { ApiProperty } from '@nestjs/swagger';

export class WatchlistResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  movieId: number;

  @ApiProperty({ example: 'Panda Plan' })
  title: string;

  @ApiProperty({
    example: '/hbO8MVrDuT8YxqeJD6DMxcamY9N.jpg',
    nullable: true,
  })
  posterPath: string;

  @ApiProperty({ example: '2024-10-01' })
  releaseDate: Date;

  @ApiProperty({ example: '2025-04-19T13:19:36.211Z' })
  addedAt: Date;
}
