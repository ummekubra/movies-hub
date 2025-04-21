import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from '../controllers/movies.controller';
import { MoviesService } from '../services/movies.service';
import { Movie } from '../entities/movie.entity';
import { MovieFilterDto } from '../dtos/movies-filter.dto';
import { CreateMovieDto } from '../dtos/create-movie.dto';
import { UpdateMovieDto } from '../dtos/update-movie.dto';

// Mock service implementation
const mockMoviesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);

    // Reset mocks between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with the provided filter DTO', async () => {
      // Arrange
      const filterDto: MovieFilterDto = {
        page: 1,
        limit: 10,
        title: 'test',
        sortBy: 'title',
        order: 'ASC',
      };
      const expectedResult = {
        items: [{ id: 1, title: 'Test Movie' }],
        meta: { page: 1, totalItems: 1, totalPages: 1, itemsPerPage: 10 },
      };
      mockMoviesService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(filterDto);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with the provided ID', async () => {
      // Arrange
      const movieId = 1;
      const expectedMovie = { id: movieId, title: 'Test Movie' } as Movie;
      mockMoviesService.findOne.mockResolvedValue(expectedMovie);

      // Act
      const result = await controller.findOne(movieId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(movieId);
      expect(result).toEqual(expectedMovie);
    });
  });

  describe('create', () => {
    it('should call service.create with the provided DTO', async () => {
      // Arrange
      const createDto: CreateMovieDto = {
        tmdbId: 550,
        title: 'New Movie',
        overview: 'Movie description',
        releaseDate: new Date('2023-01-01'),
        genreIds: [1, 2],
      };
      const expectedMovie = { id: 1, ...createDto } as unknown as Movie;
      mockMoviesService.create.mockResolvedValue(expectedMovie);

      // Act
      const result = await controller.create(createDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedMovie);
    });
  });

  describe('update', () => {
    it('should call service.update with the provided ID and DTO', async () => {
      // Arrange
      const movieId = 1;
      const updateDto: UpdateMovieDto = {
        title: 'Updated Movie',
      };
      const expectedMovie = { id: movieId, title: 'Updated Movie' } as Movie;
      mockMoviesService.update.mockResolvedValue(expectedMovie);

      // Act
      const result = await controller.update(movieId, updateDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(movieId, updateDto);
      expect(result).toEqual(expectedMovie);
    });
  });

  describe('remove', () => {
    it('should call service.remove with the provided ID', async () => {
      // Arrange
      const movieId = 1;
      mockMoviesService.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove(movieId);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(movieId);
    });
  });
});
