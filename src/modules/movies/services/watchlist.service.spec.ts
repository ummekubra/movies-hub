import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchlistService } from './watchlist.service';
import { Watchlist } from '../entities/watchlist.entity';
import { Movie } from '../entities/movie.entity';
import { User } from '../../users/entities/user.entity';
import { CacheService } from '../../../common/cache/cache.service';
import { AddToWatchlistDto } from '../dtos/add-to-watchist.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CacheKeys } from '../../../common/constants/cache-keys.constants';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

describe('WatchlistService', () => {
  let service: WatchlistService;
  let watchlistRepo: MockRepository<Watchlist>;
  let movieRepo: MockRepository<Movie>;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: getRepositoryToken(Watchlist),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
    watchlistRepo = module.get<MockRepository<Watchlist>>(
      getRepositoryToken(Watchlist),
    );
    movieRepo = module.get<MockRepository<Movie>>(getRepositoryToken(Movie));
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToWatchlist', () => {
    const userId = 1;
    const dto: AddToWatchlistDto = { movieId: 123 };
    const movie = {
      id: 123,
      title: 'Test Movie',
      posterPath: '/path/to/poster.jpg',
      releaseDate: new Date('2023-01-01'),
    };

    it('should throw NotFoundException if movie does not exist', async () => {
      // Arrange
      movieRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addToWatchlist(userId, dto)).rejects.toThrow(
        new NotFoundException(`Movie with ID ${dto.movieId} not found`),
      );
      expect(movieRepo.findOne).toHaveBeenCalledWith({
        where: { id: dto.movieId },
      });
    });

    it('should throw ConflictException if movie already in watchlist', async () => {
      // Arrange
      movieRepo.findOne.mockResolvedValue(movie);
      watchlistRepo.findOne.mockResolvedValue({
        id: 1,
        user: { id: userId },
        movie,
      });

      // Act & Assert
      await expect(service.addToWatchlist(userId, dto)).rejects.toThrow(
        new ConflictException('Movie already in watchlist'),
      );
      expect(watchlistRepo.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId }, movie: { id: dto.movieId } },
        relations: ['movie', 'user'],
      });
    });

    it('should successfully add movie to watchlist', async () => {
      // Arrange
      const addedAt = new Date();
      const savedWatchlist = {
        id: 1,
        addedAt,
        movie,
        user: { id: userId },
      };

      movieRepo.findOne.mockResolvedValue(movie);
      watchlistRepo.findOne.mockResolvedValue(null);
      watchlistRepo.save.mockResolvedValue(savedWatchlist);

      // Act
      const result = await service.addToWatchlist(userId, dto);

      // Assert
      expect(watchlistRepo.save).toHaveBeenCalledWith({
        user: { id: userId },
        movie,
      });
      expect(cacheService.delete).toHaveBeenCalledWith(
        CacheKeys.USER_WATCHLIST(userId),
      );
      expect(result).toEqual({
        id: savedWatchlist.id,
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.posterPath,
        releaseDate: movie.releaseDate,
        addedAt,
      });
    });
  });

  describe('getWatchlistByUser', () => {
    const userId = 1;
    const watchlistItems = [
      {
        id: 1,
        addedAt: new Date('2023-01-10'),
        movie: {
          id: 123,
          title: 'Test Movie',
          posterPath: '/path/to/poster.jpg',
          releaseDate: new Date('2023-01-01'),
        },
      },
    ];
    const expectedResponse = [
      {
        id: 1,
        movieId: 123,
        title: 'Test Movie',
        posterPath: '/path/to/poster.jpg',
        releaseDate: new Date('2023-01-01'),
        addedAt: watchlistItems[0].addedAt,
      },
    ];

    it('should return cached watchlist if available', async () => {
      // Arrange
      (cacheService.get as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      const result = await service.getWatchlistByUser(userId);

      // Assert
      expect(cacheService.get).toHaveBeenCalledWith(
        CacheKeys.USER_WATCHLIST(userId),
      );
      expect(watchlistRepo.find).not.toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it('should fetch and cache watchlist if not cached', async () => {
      // Arrange
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      watchlistRepo.find.mockResolvedValue(watchlistItems);

      // Act
      const result = await service.getWatchlistByUser(userId);

      // Assert
      expect(cacheService.get).toHaveBeenCalledWith(
        CacheKeys.USER_WATCHLIST(userId),
      );
      expect(watchlistRepo.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['movie'],
        order: { addedAt: 'DESC' },
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        CacheKeys.USER_WATCHLIST(userId),
        expectedResponse,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('removeFromWatchlist', () => {
    const userId = 1;
    const movieId = 123;
    const watchlistEntry = {
      id: 1,
      user: { id: userId },
      movie: { id: movieId },
    };

    it('should throw NotFoundException if watchlist entry not found', async () => {
      // Arrange
      watchlistRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.removeFromWatchlist(userId, movieId),
      ).rejects.toThrow(new NotFoundException('Watchlist entry not found'));
      expect(watchlistRepo.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId }, movie: { id: movieId } },
      });
    });

    it('should successfully remove movie from watchlist', async () => {
      // Arrange
      watchlistRepo.findOne.mockResolvedValue(watchlistEntry);

      // Act
      await service.removeFromWatchlist(userId, movieId);

      // Assert
      expect(watchlistRepo.remove).toHaveBeenCalledWith(watchlistEntry);
      expect(cacheService.delete).toHaveBeenCalledWith(
        CacheKeys.USER_WATCHLIST(userId),
      );
    });
  });
});
