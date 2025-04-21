import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MovieRatingService } from '../services/movie-rating.service';
import { MovieRating } from '../entities/movie-rating.entity';
import { Movie } from '../entities/movie.entity';
import { User } from '../../users/entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RateMovieDto } from '../dtos/rate-movie.dto';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('MovieRatingService', () => {
  let service: MovieRatingService;
  let ratingRepository: MockRepository<MovieRating>;
  let movieRepository: MockRepository<Movie>;

  beforeEach(async () => {
    const ratingRepositoryMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const movieRepositoryMock = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieRatingService,
        {
          provide: getRepositoryToken(MovieRating),
          useValue: ratingRepositoryMock,
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: movieRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<MovieRatingService>(MovieRatingService);
    ratingRepository = module.get(getRepositoryToken(MovieRating));
    movieRepository = module.get(getRepositoryToken(Movie));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('rateMovie', () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
      ratings: [],
      watchlist: [],
    };

    const mockMovie: Movie = {
      id: 1,
      tmdbId: 1,
      overview: 'A ticking-time-bomb insomniac and a slippery soap salesman...',
      posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      backdropPath: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
      title: 'Test Movie',
      releaseDate: new Date('1999-10-15'),
      popularity: 41.891,
      voteAverage: 8.4,
      voteCount: 24371,
      genres: [
        {
          id: 1,
          name: 'Action',
          tmdbId: 0,
          movies: [],
        },
      ],
      ratings: [],
      watchlists: [],
      userRatingAverage: 0,
      userRatingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRating: MovieRating = {
      id: 1,
      user: mockUser,
      movie: mockMovie,
      rating: 4.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const rateMovieDto: RateMovieDto = {
      movieId: 1,
      rating: 4.5,
    };

    it('should throw NotFoundException when movie not found', async () => {
      // Arrange
      movieRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.rateMovie(mockUser, rateMovieDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { id: rateMovieDto.movieId },
      });
    });

    it('should create a new rating if user has not rated the movie before', async () => {
      // Arrange
      movieRepository.findOne.mockResolvedValue(mockMovie);
      ratingRepository.findOne.mockResolvedValue(null);
      ratingRepository.create.mockReturnValue(mockRating);
      ratingRepository.save.mockResolvedValue(mockRating);
      ratingRepository.find.mockResolvedValue([mockRating]);

      // Act
      const result = await service.rateMovie(mockUser, rateMovieDto);

      // Assert
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { id: rateMovieDto.movieId },
      });
      expect(ratingRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id }, movie: { id: mockMovie.id } },
      });
      expect(ratingRepository.create).toHaveBeenCalledWith({
        user: mockUser,
        movie: mockMovie,
        rating: rateMovieDto.rating,
      });
      expect(ratingRepository.save).toHaveBeenCalledWith(mockRating);
      expect(ratingRepository.find).toHaveBeenCalledWith({
        where: { movie: { id: mockMovie.id } },
      });
      expect(movieRepository.update).toHaveBeenCalledWith(mockMovie.id, {
        userRatingAverage: 4.5,
        userRatingCount: 1,
      });
      expect(result).toEqual({
        movieId: mockMovie.id,
        movieTitle: mockMovie.title,
        rating: mockRating.rating,
        ratedAt: mockRating.updatedAt,
      });
    });

    it('should update existing rating if user has already rated the movie', async () => {
      // Arrange
      const existingRating = { ...mockRating, rating: 3.5 };
      const updatedRating = { ...mockRating, rating: 4.5 };

      movieRepository.findOne.mockResolvedValue(mockMovie);
      ratingRepository.findOne.mockResolvedValue(existingRating);
      ratingRepository.save.mockResolvedValue(updatedRating);
      ratingRepository.find.mockResolvedValue([updatedRating]);

      // Act
      const result = await service.rateMovie(mockUser, rateMovieDto);

      // Assert
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { id: rateMovieDto.movieId },
      });
      expect(ratingRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id }, movie: { id: mockMovie.id } },
      });
      expect(ratingRepository.create).not.toHaveBeenCalled();
      expect(ratingRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        movieId: mockMovie.id,
        movieTitle: mockMovie.title,
        rating: updatedRating.rating,
        ratedAt: updatedRating.updatedAt,
      });
    });

    it('should correctly calculate average rating with multiple ratings', async () => {
      // Arrange
      const ratings = [
        { ...mockRating, id: 1, rating: 4.5 },
        { ...mockRating, id: 2, user: { ...mockUser, id: 2 }, rating: 3.5 },
        { ...mockRating, id: 3, user: { ...mockUser, id: 3 }, rating: 5 },
      ];

      movieRepository.findOne.mockResolvedValue(mockMovie);
      ratingRepository.findOne.mockResolvedValue(null);
      ratingRepository.create.mockReturnValue(mockRating);
      ratingRepository.save.mockResolvedValue(mockRating);
      ratingRepository.find.mockResolvedValue(ratings);

      // Act
      await service.rateMovie(mockUser, rateMovieDto);

      // Assert
      // Average = (4.5 + 3.5 + 5) / 3 = 4.3333 -> 4.3 after toFixed(1)
      expect(movieRepository.update).toHaveBeenCalledWith(mockMovie.id, {
        userRatingAverage: 4.3,
        userRatingCount: 3,
      });
    });

    it('should not update movie stats if no ratings exist', async () => {
      // Arrange
      movieRepository.findOne.mockResolvedValue(mockMovie);
      ratingRepository.findOne.mockResolvedValue(null);
      ratingRepository.create.mockReturnValue(mockRating);
      ratingRepository.save.mockResolvedValue(mockRating);
      ratingRepository.find.mockResolvedValue([]);

      // Act
      await service.rateMovie(mockUser, rateMovieDto);

      // Assert
      expect(movieRepository.update).not.toHaveBeenCalled();
    });
  });
});
