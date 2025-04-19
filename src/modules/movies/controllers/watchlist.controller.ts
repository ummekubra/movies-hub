import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { WatchlistService } from '../services/watchlist.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AddToWatchlistDto } from '../dtos/add-to-watchist.dto';

@ApiTags('Watchlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  @ApiOperation({ summary: 'Add movie to your watchlist' })
  @ApiResponse({ status: 200, description: 'Movie added to watchlist' })
  @ApiResponse({ status: 409, description: 'Movie already in watchlist' })
  addToWatchlist(@Request() req, @Body() dto: AddToWatchlistDto) {
    const userId = req.user['id'];
    return this.watchlistService.addToWatchlist(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get current user's watchlist" })
  @ApiResponse({ status: 200, description: 'List of movies in watchlist' })
  getWatchlist(@Request() req) {
    const userId = req.user['id'];
    return this.watchlistService.getWatchlistByUser(userId);
  }

  @Delete(':movieId')
  @ApiOperation({ summary: 'Remove movie from watchlist' })
  @ApiResponse({ status: 200, description: 'Movie removed from watchlist' })
  removeFromWatchlist(
    @Request() req,
    @Param('movieId', ParseIntPipe) movieId: number,
  ) {
    const userId = req.user['id'];
    return this.watchlistService.removeFromWatchlist(userId, movieId);
  }
}
