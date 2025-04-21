import { Test, TestingModule } from '@nestjs/testing';
import { MovieRatingController } from '../controllers/movie-rating.controller';
import { MovieRatingService } from '../services/movie-rating.service';
import { RateMovieDto } from '../dtos/rate-movie.dto';
import { RatedMovieResponseDto } from '../dtos/rated-movie-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('MovieRatingController', () => {
  let controller: MovieRatingController;
  let service: MovieRatingService;

  const mockRatingService = {
    rateMovie: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovieRatingController],
      providers: [
        {
          provide: MovieRatingService,
          useValue: mockRatingService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MovieRatingController>(MovieRatingController);
    service = module.get<MovieRatingService>(MovieRatingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('rateMovie', () => {
    it('should call rateMovie service method with user and dto', async () => {
      // Arrange
      const user = { id: 1, username: 'testuser' };
      const dto: RateMovieDto = { movieId: 1, rating: 4.5 };
      const mockResponse: RatedMovieResponseDto = {
        movieId: 1,
        movieTitle: 'Test Movie',
        rating: 4.5,
        ratedAt: new Date(),
      };

      mockRatingService.rateMovie.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.rateMovie({ user }, dto);

      // Assert
      expect(service.rateMovie).toHaveBeenCalledWith(user, dto);
      expect(result).toEqual(mockResponse);
    });

    it('should pass through exceptions from the service', async () => {
      // Arrange
      const user = { id: 1, username: 'testuser' };
      const dto: RateMovieDto = { movieId: 999, rating: 4.5 };

      mockRatingService.rateMovie.mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(controller.rateMovie({ user }, dto)).rejects.toThrow(
        'Test error',
      );
    });
  });
});
