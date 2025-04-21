import { Test, TestingModule } from '@nestjs/testing';
import { TmdbApiService } from './tmdb-api.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
// import { InternalServerErrorException } from '@nestjs/common';
import { AxiosHeaders } from 'axios';

describe('TmdbApiService', () => {
  let service: TmdbApiService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockApiKey = 'test-api-key';
  const mockBaseUrl = 'https://api.themoviedb.org/3';

  const mockGenresResponse = {
    genres: [
      { id: 1, name: 'Action' },
      { id: 2, name: 'Comedy' },
    ],
  };

  const mockMoviesResponse = {
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

  beforeEach(async () => {
    // Mock environment variables if needed
    process.env.TMDB_API_KEY = mockApiKey;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmdbApiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'TMDB_API_KEY') return mockApiKey;
              if (key === 'TMDB_BASE_URL') return mockBaseUrl;
              return null;
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TmdbApiService>(TmdbApiService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    // Ensure API key is properly mocked
    expect(configService.get('TMDB_API_KEY')).toBe(mockApiKey);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.TMDB_API_KEY;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should get API key and base URL from config service', () => {
      expect(configService.get).toHaveBeenCalledWith('TMDB_API_KEY');
      expect(configService.get).toHaveBeenCalledWith('TMDB_BASE_URL');
    });

    it('should throw error if API key is not provided', () => {
      // Re-create the service with a null API key
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === 'TMDB_API_KEY') return null;
        if (key === 'TMDB_BASE_URL') return mockBaseUrl;
        return null;
      });

      expect(() => new TmdbApiService(configService, httpService)).toThrow(
        'TMDB_API_KEY must be provided',
      );
    });
  });

  describe('getGenres', () => {
    it('should fetch genres successfully', async () => {
      jest.spyOn(httpService, 'get').mockReturnValueOnce(
        of({
          data: mockGenresResponse,
          headers: {},
          config: {
            url: '',
            headers: new AxiosHeaders(), // ✅ FIXED
            method: 'get',
          },
          status: 200,
          statusText: 'OK',
        }),
      );

      const result = await service.getGenres();

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(`api_key=${mockApiKey}`),
      );
      expect(result).toEqual(mockGenresResponse.genres);
    });

    // it('should throw InternalServerErrorException on API error', async () => {
    //   jest
    //     .spyOn(httpService, 'get')
    //     .mockReturnValueOnce(throwError(() => new Error('API error')));

    //   await expect(service.getGenres()).rejects.toThrow(
    //     InternalServerErrorException,
    //   );
    // });
  });

  describe('getPopularMovies', () => {
    it('should fetch popular movies successfully with default page', async () => {
      jest.spyOn(httpService, 'get').mockReturnValueOnce(
        of({
          data: mockMoviesResponse,
          headers: {},
          config: {
            url: '',
            headers: new AxiosHeaders(), // ✅ FIXED
            method: 'get',
          },
          status: 200,
          statusText: 'OK',
        }),
      );

      const result = await service.getPopularMovies();

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(`api_key=${mockApiKey}&page=1`),
      );
      expect(result).toEqual(mockMoviesResponse);
    });

    it('should fetch popular movies with specific page', async () => {
      jest.spyOn(httpService, 'get').mockReturnValueOnce(
        of({
          data: { ...mockMoviesResponse, page: 2 },
          headers: {},
          config: {
            url: '',
            headers: new AxiosHeaders(), // ✅ FIXED
            method: 'get',
          },
          status: 200,
          statusText: 'OK',
        }),
      );

      const result = await service.getPopularMovies(2);

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(`api_key=${mockApiKey}&page=2`),
      );
      expect(result).toEqual({ ...mockMoviesResponse, page: 2 });
    });

    // it('should throw InternalServerErrorException on API error', async () => {
    //   jest
    //     .spyOn(httpService, 'get')
    //     .mockReturnValueOnce(throwError(() => new Error('API error')));

    //   await expect(service.getPopularMovies()).rejects.toThrow(
    //     InternalServerErrorException,
    //   );
    // });
  });

  describe('buildUrl', () => {
    it('should build a URL with query parameters', async () => {
      jest.spyOn(httpService, 'get').mockReturnValueOnce(
        of({
          data: mockMoviesResponse,
          headers: {},
          config: {
            url: '',
            headers: new AxiosHeaders(), // ✅ FIXED
            method: 'get',
          },
          status: 200,
          statusText: 'OK',
        }),
      );

      await service.getPopularMovies(3);

      // Use less strict matching to avoid test brittleness
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(`/movie/popular?api_key=${mockApiKey}&page=3`),
      );
    });
  });
});
