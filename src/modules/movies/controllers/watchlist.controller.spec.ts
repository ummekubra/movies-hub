import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from '../services/watchlist.service';
import { AddToWatchlistDto } from '../dtos/add-to-watchist.dto';

const mockWatchlistService = {
  addToWatchlist: jest.fn(),
  getWatchlistByUser: jest.fn(),
  removeFromWatchlist: jest.fn(),
};

describe('WatchlistController', () => {
  let controller: WatchlistController;
  let service: WatchlistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WatchlistController],
      providers: [
        {
          provide: WatchlistService,
          useValue: mockWatchlistService,
        },
      ],
    }).compile();

    controller = module.get<WatchlistController>(WatchlistController);
    service = module.get<WatchlistService>(WatchlistService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addToWatchlist', () => {
    it('should call watchlistService.addToWatchlist with correct parameters', async () => {
      // Arrange
      const req = { user: { id: 1 } };
      const dto: AddToWatchlistDto = { movieId: 123 };
      const expectedResult = {
        id: 1,
        movieId: 123,
        title: 'Test Movie',
        posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        releaseDate: new Date('1999-10-15'),
        addedAt: new Date('2025-10-21'),
      };
      jest.spyOn(service, 'addToWatchlist').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.addToWatchlist(req, dto);

      // Assert
      expect(service.addToWatchlist).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getWatchlist', () => {
    it('should call watchlistService.getWatchlistByUser with correct user ID', async () => {
      // Arrange
      const req = { user: { id: 1 } };
      const expectedResult = [
        {
          id: 1,
          movieId: 123,
          title: 'Test Movie',
          posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
          releaseDate: new Date('1999-10-15'),
          addedAt: new Date('2025-10-21'),
        },
      ];
      jest
        .spyOn(service, 'getWatchlistByUser')
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getWatchlist(req);

      // Assert
      expect(service.getWatchlistByUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('removeFromWatchlist', () => {
    it('should call watchlistService.removeFromWatchlist with correct parameters', async () => {
      // Arrange
      const req = { user: { id: 1 } };
      const movieId = 123;
      jest.spyOn(service, 'removeFromWatchlist').mockResolvedValue(undefined);

      // Act
      await controller.removeFromWatchlist(req, movieId);

      // Assert
      expect(service.removeFromWatchlist).toHaveBeenCalledWith(1, movieId);
    });
  });
});
