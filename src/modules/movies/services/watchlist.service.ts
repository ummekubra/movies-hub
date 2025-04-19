import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Watchlist } from '../entities/watchlist.entity';
import { Movie } from '../entities/movie.entity';
import { AddToWatchlistDto } from '../dtos/add-to-watchist.dto';
import { User } from '../../users/entities/user.entity';
import { WatchlistResponseDto } from '../dtos/watchlist-response.dto';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(Watchlist)
    private readonly watchlistRepository: Repository<Watchlist>,

    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async addToWatchlist(
    userId: number,
    dto: AddToWatchlistDto,
  ): Promise<WatchlistResponseDto> {
    // Check if movie exists
    const movie = await this.movieRepository.findOne({
      where: { id: dto.movieId },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${dto.movieId} not found`);
    }

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if movie is already in user's watchlist
    const existingEntry = await this.watchlistRepository.findOne({
      where: { user: { id: userId }, movie: { id: dto.movieId } },
      relations: ['movie', 'user'],
    });

    if (existingEntry) {
      throw new ConflictException('Movie already in watchlist');
    }

    const savedMovie = await this.watchlistRepository.save({
      user,
      movie,
    });
    return this.toResponseDto({ ...savedMovie, movie });
  }

  //commom response to be sent to client( WatchlistResponseDto format )
  private toResponseDto(watchlist: Watchlist): WatchlistResponseDto {
    const { id, addedAt, movie } = watchlist;
    return {
      id,
      movieId: movie.id,
      title: movie.title,
      posterPath: movie.posterPath,
      releaseDate: movie.releaseDate,
      addedAt,
    };
  }

  async getWatchlistByUser(userId: number): Promise<WatchlistResponseDto[]> {
    const watchlistItems = await this.watchlistRepository.find({
      where: { user: { id: userId } },
      relations: ['movie'],
      order: { addedAt: 'DESC' },
    });

    return watchlistItems.map(this.toResponseDto);
  }

  async removeFromWatchlist(userId: number, movieId: number): Promise<void> {
    const entry = await this.watchlistRepository.findOne({
      where: { user: { id: userId }, movie: { id: movieId } },
    });
    if (!entry) throw new NotFoundException('Watchlist entry not found');

    await this.watchlistRepository.remove(entry);
  }
}
