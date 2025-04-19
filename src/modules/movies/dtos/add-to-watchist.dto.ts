import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class AddToWatchlistDto {
  @ApiProperty({
    description: 'Movie ID to add to watchlist (internal DB id)',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  movieId: number;
}
