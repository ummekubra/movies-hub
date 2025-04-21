import { Test, TestingModule } from '@nestjs/testing';
import { TmdbService } from './tmdb.service';
import { TmdbApiService } from './tmdb-api.service';
import { TmdbTransformerService } from './tmdb-transformer.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Genre } from '../../../modules/movies/entities/genre.entity';
import { Movie } from '../../../modules/movies/entities/movie.entity';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

describe('TmdbService', () => {
  let service: TmdbService;
  let tmdbApiService: TmdbApiService;
  let transformerService: TmdbTransformerService;
  let genreRepository: Repository<Genre>;
  let movieRepository: Repository<Movie>;
  let configService: ConfigService;

  const mockGenres = [
    { id: 1, name: 'Action' },
    { id: 2, name: 'Comedy' },
  ];

  const mockMovies = {
    page: 1,
    results: [
      {
        id: 123,
        title: 'Test Movie',
        overview: 'A test movie',
        poster_path: '/test.jpg',
        backdrop_path: '/backdrop.jpg',
        release_date: '2023-01-01',
        popularity: 10.5,
        vote_average: 8.5,
        vote_count: 1000,
        genre_ids: [1, 2],
      },
    ],
    total_pages: 3,
    total_results: 60,
  };

  const mockTransformedGenres = [
    { tmdbId: 1, name: 'Action' },
    { tmdbId: 2, name: 'Comedy' },
  ];

  const mockGenreEntities = [
    { id: 1, tmdbId: 1, name: 'Action' },
    { id: 2, tmdbId: 2, name: 'Comedy' },
  ];

  const mockTransformedMovies = [
    {
      tmdbId: 123,
      title: 'Test Movie',
      overview: 'A test movie',
      posterPath: '/test.jpg',
      backdropPath: '/backdrop.jpg',
      releaseDate: new Date('2023-01-01'),
      popularity: 10.5,
      voteAverage: 8.5,
      voteCount: 1000,
      genres: [mockGenreEntities[0], mockGenreEntities[1]],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmdbService,
        {
          provide: TmdbApiService,
          useValue: {
            getGenres: jest.fn().mockResolvedValue(mockGenres),
            getPopularMovies: jest.fn().mockResolvedValue(mockMovies),
          },
        },
        {
          provide: TmdbTransformerService,
          useValue: {
            transformGenres: jest.fn().mockReturnValue(mockTransformedGenres),
            transformMovies: jest.fn().mockReturnValue(mockTransformedMovies),
          },
        },
        {
          provide: getRepositoryToken(Genre),
          useValue: {
            upsert: jest.fn().mockResolvedValue(true),
            find: jest.fn().mockResolvedValue(mockGenreEntities),
          },
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            save: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'SYNC_PAGE_COUNT') return 2;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TmdbService>(TmdbService);
    tmdbApiService = module.get<TmdbApiService>(TmdbApiService);
    transformerService = module.get<TmdbTransformerService>(
      TmdbTransformerService,
    );
    genreRepository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
    movieRepository = module.get<Repository<Movie>>(getRepositoryToken(Movie));
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('should call syncData', async () => {
      const syncDataSpy = jest.spyOn(service, 'syncData').mockResolvedValue();

      await service.onApplicationBootstrap();

      expect(syncDataSpy).toHaveBeenCalled();
    });
  });

  describe('syncGenres', () => {
    it('should fetch and upsert genres', async () => {
      await service.syncGenres();

      expect(tmdbApiService.getGenres).toHaveBeenCalled();
      expect(transformerService.transformGenres).toHaveBeenCalledWith(
        mockGenres,
      );
      expect(genreRepository.upsert).toHaveBeenCalledWith(
        mockTransformedGenres,
        {
          conflictPaths: ['tmdbId'],
          skipUpdateIfNoValuesChanged: true,
        },
      );
    });

    it('should not upsert if no genres are returned', async () => {
      jest.spyOn(tmdbApiService, 'getGenres').mockResolvedValueOnce([]);

      await service.syncGenres();

      expect(genreRepository.upsert).not.toHaveBeenCalled();
    });

    // it('should throw InternalServerErrorException if genres fetch fails', async () => {
    //   jest
    //     .spyOn(tmdbApiService, 'getGenres')
    //     .mockRejectedValueOnce(new Error('API error'));

    //   await expect(service.syncGenres()).rejects.toThrow(
    //     InternalServerErrorException,
    //   );
    // });
  });

  describe('syncPopularMovies', () => {
    it('should fetch and save popular movies', async () => {
      await service.syncPopularMovies();

      expect(genreRepository.find).toHaveBeenCalled();
      expect(tmdbApiService.getPopularMovies).toHaveBeenCalledWith(1);
      expect(transformerService.transformMovies).toHaveBeenCalledWith(
        mockMovies.results,
        expect.any(Map),
      );
      expect(movieRepository.find).toHaveBeenCalled();
      expect(movieRepository.save).toHaveBeenCalled();
    });

    it('should fetch multiple pages based on config', async () => {
      const mockSecondPage = { ...mockMovies, page: 2 };
      jest
        .spyOn(tmdbApiService, 'getPopularMovies')
        .mockResolvedValueOnce(mockMovies)
        .mockResolvedValueOnce(mockSecondPage);

      await service.syncPopularMovies();

      expect(tmdbApiService.getPopularMovies).toHaveBeenCalledWith(1);
      expect(tmdbApiService.getPopularMovies).toHaveBeenCalledWith(2);
      expect(configService.get).toHaveBeenCalledWith('SYNC_PAGE_COUNT');
    });

    it('should handle API errors gracefully', async () => {
      jest
        .spyOn(tmdbApiService, 'getPopularMovies')
        .mockResolvedValueOnce(mockMovies)
        .mockRejectedValueOnce(new Error('API error'));

      await service.syncPopularMovies();

      // It should still save the movies from the first page
      expect(movieRepository.save).toHaveBeenCalled();
    });
  });

  describe('syncData', () => {
    it('should call syncGenres and syncPopularMovies', async () => {
      const syncGenresSpy = jest
        .spyOn(service, 'syncGenres')
        .mockResolvedValue();
      const syncPopularMoviesSpy = jest
        .spyOn(service, 'syncPopularMovies')
        .mockResolvedValue();

      await service.syncData();

      expect(syncGenresSpy).toHaveBeenCalled();
      expect(syncPopularMoviesSpy).toHaveBeenCalled();
    });

    // it('should handle errors in the sync process', async () => {
    //   jest
    //     .spyOn(service, 'syncGenres')
    //     .mockRejectedValueOnce(new Error('Sync error'));
    //   const syncPopularMoviesSpy = jest.spyOn(service, 'syncPopularMovies');

    //   await service.syncData();

    //   // syncPopularMovies should not be called if syncGenres fails
    //   expect(syncPopularMoviesSpy).not.toHaveBeenCalled();
    // });
  });
});
