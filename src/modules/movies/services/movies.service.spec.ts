import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from '../services/movies.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Movie } from '../entities/movie.entity';
import { Genre } from '../entities/genre.entity';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
import { PaginationProvider } from '../../../common/pagination/providers/pagination.provider';
import { MovieQueryBuilder } from '../utils/movie-query.builder';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../../common/cache/cache.service';
import { MovieFilterDto } from '../dtos/movies-filter.dto';
import { CreateMovieDto } from '../dtos/create-movie.dto';
import { UpdateMovieDto } from '../dtos/update-movie.dto';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CacheKeys } from '../../../common/constants/cache-keys.constants';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
type MockQueryBuilder = Partial<
  Record<keyof SelectQueryBuilder<any>, jest.Mock>
>;

const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('MoviesService', () => {
  let service: MoviesService;
  let movieRepository: MockRepository<Movie>;
  let genreRepository: MockRepository<Genre>;
  let paginationProvider: PaginationProvider;
  let movieQueryBuilder: MovieQueryBuilder;
  let cacheService: CacheService;
  let mockQueryBuilder: MockQueryBuilder;

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    movieRepository = createMockRepository();
    genreRepository = createMockRepository();
    movieRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useValue: movieRepository,
        },
        {
          provide: getRepositoryToken(Genre),
          useValue: genreRepository,
        },
        {
          provide: PaginationProvider,
          useValue: {
            paginate: jest.fn(),
          },
        },
        {
          provide: MovieQueryBuilder,
          useValue: {
            applyFilters: jest.fn(),
            applySorting: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getList: jest.fn(),
            setList: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            invalidateListCache: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    paginationProvider = module.get<PaginationProvider>(PaginationProvider);
    movieQueryBuilder = module.get<MovieQueryBuilder>(MovieQueryBuilder);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return cached result if available', async () => {
      // Arrange
      const filterDto: MovieFilterDto = { page: 1, limit: 10 };
      const cachedResult = {
        items: [{ id: 1, title: 'Cached Movie' }],
        meta: { page: 1, totalItems: 1, totalPages: 1, itemsPerPage: 10 },
      };
      (cacheService.getList as jest.Mock).mockResolvedValue(cachedResult);

      // Act
      const result = await service.findAll(filterDto);

      // Assert
      expect(cacheService.getList).toHaveBeenCalledWith(
        filterDto,
        CacheKeys.MOVIE_PREFIX,
      );
      expect(result).toEqual(cachedResult);
      expect(movieRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should query and cache results if no cache is available', async () => {
      // Arrange
      const filterDto: MovieFilterDto = { page: 1, limit: 10 };
      const paginatedResult = {
        items: [{ id: 1, title: 'Movie 1' }],
        meta: { page: 1, totalItems: 1, totalPages: 1, itemsPerPage: 10 },
      };
      (cacheService.getList as jest.Mock).mockResolvedValue(null);
      (paginationProvider.paginate as jest.Mock).mockResolvedValue(
        paginatedResult,
      );

      // Act
      const result = await service.findAll(filterDto);

      // Assert
      expect(movieRepository.createQueryBuilder).toHaveBeenCalledWith('movie');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'movie.genres',
        'genre',
      );
      expect(movieQueryBuilder.applyFilters).toHaveBeenCalledWith(
        mockQueryBuilder,
        filterDto,
      );
      expect(movieQueryBuilder.applySorting).toHaveBeenCalledWith(
        mockQueryBuilder,
        filterDto,
      );
      expect(paginationProvider.paginate).toHaveBeenCalledWith(
        filterDto,
        mockQueryBuilder,
      );
      expect(cacheService.setList).toHaveBeenCalledWith(
        CacheKeys.MOVIE_MODULE,
        filterDto,
        paginatedResult,
        CacheKeys.MOVIE_PREFIX,
      );
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findOne', () => {
    it('should return cached movie if available', async () => {
      // Arrange
      const movieId = 1;
      const cachedMovie = { id: movieId, title: 'Cached Movie' };
      const cacheKey = CacheKeys.MOVIE_DETAILS(movieId);
      (cacheService.get as jest.Mock).mockResolvedValue(cachedMovie);

      // Act
      const result = await service.findOne(movieId);

      // Assert
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(cachedMovie);
      expect(movieRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch and cache movie if not in cache', async () => {
      // Arrange
      const movieId = 1;
      const movie = { id: movieId, title: 'Test Movie' };
      const cacheKey = CacheKeys.MOVIE_DETAILS(movieId);
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (movieRepository.findOne as jest.Mock).mockResolvedValue(movie);

      // Act
      const result = await service.findOne(movieId);

      // Assert
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { id: movieId },
        relations: ['genres'],
      });
      expect(cacheService.set).toHaveBeenCalledWith(cacheKey, movie);
      expect(result).toEqual(movie);
    });

    it('should throw NotFoundException if movie is not found', async () => {
      // Arrange
      const movieId = 999;
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (movieRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(movieId)).rejects.toThrow(NotFoundException);
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { id: movieId },
        relations: ['genres'],
      });
    });
  });

  describe('create', () => {
    it('should create a movie without genres', async () => {
      // Arrange
      const createDto: CreateMovieDto = {
        tmdbId: 550,
        title: 'New Movie',
        overview: 'Movie description',
        releaseDate: new Date('2023-01-01'),
      };
      const newMovie = { ...createDto };
      const savedMovie = { id: 1, ...createDto };

      (movieRepository.create as jest.Mock).mockReturnValue(newMovie);
      (movieRepository.save as jest.Mock).mockResolvedValue(savedMovie);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(movieRepository.create).toHaveBeenCalledWith(createDto);
      expect(movieRepository.save).toHaveBeenCalledWith(newMovie);
      expect(cacheService.invalidateListCache).toHaveBeenCalledWith(
        CacheKeys.MOVIE_MODULE,
      );
      expect(result).toEqual(savedMovie);
    });
  });

  describe('update', () => {
    it('should update a movie with new data', async () => {
      // Arrange
      const movieId = 1;
      const existingMovie = {
        id: movieId,
        title: 'Original Title',
        overview: 'Original overview',
        genres: [],
      };
      const updateDto: UpdateMovieDto = {
        title: 'Updated Title',
      };
      const updatedMovie = { ...existingMovie, ...updateDto };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingMovie as any);
      (movieRepository.save as jest.Mock).mockResolvedValue(updatedMovie);

      // Act
      const result = await service.update(movieId, updateDto);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(movieId);
      expect(movieRepository.save).toHaveBeenCalledWith({
        ...existingMovie,
        ...updateDto,
      });
      expect(cacheService.delete).toHaveBeenCalledWith(
        CacheKeys.MOVIE_DETAILS(movieId),
      );
      expect(cacheService.invalidateListCache).toHaveBeenCalledWith(
        CacheKeys.MOVIE_MODULE,
      );
      expect(result).toEqual(updatedMovie);
    });

    it('should update a movie with new genres', async () => {
      // Arrange
      const movieId = 1;
      const genreIds = [2, 3];
      const genres = [
        { id: 2, name: 'Comedy' },
        { id: 3, name: 'Action' },
      ];
      const existingMovie = {
        id: movieId,
        title: 'Original Title',
        genres: [{ id: 1, name: 'Drama' }],
      };
      const updateDto: UpdateMovieDto = {
        title: 'Updated Title',
        genreIds,
      };
      const updatedMovie = { ...existingMovie, ...updateDto, genres };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingMovie as any);
      (genreRepository.find as jest.Mock).mockResolvedValue(genres);
      (movieRepository.save as jest.Mock).mockResolvedValue(updatedMovie);

      // Act
      const result = await service.update(movieId, updateDto);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(movieId);
      expect(genreRepository.find).toHaveBeenCalledWith({
        where: { id: In(genreIds) },
      });
      expect(movieRepository.save).toHaveBeenCalledWith({
        ...existingMovie,
        title: updateDto.title,
        genres,
      });
      expect(cacheService.delete).toHaveBeenCalledWith(
        CacheKeys.MOVIE_DETAILS(movieId),
      );
      expect(cacheService.invalidateListCache).toHaveBeenCalledWith(
        CacheKeys.MOVIE_MODULE,
      );
      expect(result).toEqual(updatedMovie);
    });

    it('should throw BadRequestException if invalid genre IDs are provided', async () => {
      // Arrange
      const movieId = 1;
      const genreIds = [1, 999]; // 999 is invalid
      const genres = [{ id: 1, name: 'Drama' }]; // Only one genre found
      const existingMovie = { id: movieId, title: 'Original Title' };
      const updateDto: UpdateMovieDto = {
        title: 'Updated Title',
        genreIds,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingMovie as any);
      (genreRepository.find as jest.Mock).mockResolvedValue(genres);

      // Act & Assert
      await expect(service.update(movieId, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(genreRepository.find).toHaveBeenCalledWith({
        where: { id: In(genreIds) },
      });
      expect(movieRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a movie successfully', async () => {
      // Arrange
      const movieId = 1;
      const movie = { id: movieId, title: 'Movie to delete' };
      (movieRepository.findOne as jest.Mock).mockResolvedValue(movie);

      // Act
      await service.remove(movieId);

      // Assert
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { id: movieId },
      });
      expect(movieRepository.remove).toHaveBeenCalledWith(movie);
      expect(cacheService.delete).toHaveBeenCalledWith(
        CacheKeys.MOVIE_DETAILS(movieId),
      );
      expect(cacheService.invalidateListCache).toHaveBeenCalledWith(
        CacheKeys.MOVIE_MODULE,
      );
    });

    it('should throw NotFoundException if movie to delete is not found', async () => {
      // Arrange
      const movieId = 999;
      (movieRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(movieId)).rejects.toThrow(NotFoundException);
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { id: movieId },
      });
      expect(movieRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if removal fails', async () => {
      // Arrange
      const movieId = 1;
      const movie = { id: movieId, title: 'Movie to delete' };
      const error = new Error('Database error');
      (movieRepository.findOne as jest.Mock).mockResolvedValue(movie);
      (movieRepository.remove as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(service.remove(movieId)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { id: movieId },
      });
      expect(movieRepository.remove).toHaveBeenCalledWith(movie);
    });
  });
});
