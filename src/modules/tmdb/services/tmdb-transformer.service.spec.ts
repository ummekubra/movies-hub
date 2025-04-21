import { Test, TestingModule } from '@nestjs/testing';
import { TmdbTransformerService } from './tmdb-transformer.service';
import { Genre } from '../../../modules/movies/entities/genre.entity';
import { TMDBGenre, TMDBMovie } from '../interfaces/tmdb-responses.interface';

describe('TmdbTransformerService', () => {
  let service: TmdbTransformerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TmdbTransformerService],
    }).compile();

    service = module.get<TmdbTransformerService>(TmdbTransformerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transformGenres', () => {
    it('should transform TMDB genres to entity format', () => {
      const tmdbGenres: TMDBGenre[] = [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Comedy' },
        { id: 3, name: 'Drama' },
      ];

      const expected = [
        { tmdbId: 1, name: 'Action' },
        { tmdbId: 2, name: 'Comedy' },
        { tmdbId: 3, name: 'Drama' },
      ];

      const result = service.transformGenres(tmdbGenres);
      expect(result).toEqual(expected);
    });

    it('should handle empty genres array', () => {
      const result = service.transformGenres([]);
      expect(result).toEqual([]);
    });
  });

  describe('transformMovies', () => {
    it('should transform TMDB movies to entity format with genre relations', () => {
      const tmdbMovies: TMDBMovie[] = [
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
      ];

      const genreMap = new Map<number, Genre>([
        [1, { id: 1, tmdbId: 1, name: 'Action' } as Genre],
        [2, { id: 2, tmdbId: 2, name: 'Comedy' } as Genre],
        [3, { id: 3, tmdbId: 3, name: 'Drama' } as Genre],
      ]);

      const expected = [
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
          genres: [
            { id: 1, tmdbId: 1, name: 'Action' },
            { id: 2, tmdbId: 2, name: 'Comedy' },
          ],
        },
      ];

      const result = service.transformMovies(tmdbMovies, genreMap);
      expect(result).toEqual(expected);
    });

    it('should handle null release date', () => {
      const tmdbMovies: TMDBMovie[] = [
        {
          id: 123,
          title: 'Test Movie',
          overview: 'A test movie',
          poster_path: '/test.jpg',
          backdrop_path: '/backdrop.jpg',
          release_date: null,
          popularity: 10.5,
          vote_average: 8.5,
          vote_count: 1000,
          genre_ids: [1],
        },
      ];

      const genreMap = new Map<number, Genre>([
        [1, { id: 1, tmdbId: 1, name: 'Action' } as Genre],
      ]);

      const result = service.transformMovies(tmdbMovies, genreMap);
      expect(result[0].releaseDate).toBeNull();
    });

    it('should filter out non-existent genre IDs', () => {
      const tmdbMovies: TMDBMovie[] = [
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
          genre_ids: [1, 999], // 999 doesn't exist in our map
        },
      ];

      const genreMap = new Map<number, Genre>([
        [1, { id: 1, tmdbId: 1, name: 'Action' } as Genre],
      ]);

      const result = service.transformMovies(tmdbMovies, genreMap);
      expect(result[0].genres).toHaveLength(1);
      expect(result[0].genres[0].tmdbId).toBe(1);
    });

    it('should handle empty movies array', () => {
      const genreMap = new Map<number, Genre>();
      const result = service.transformMovies([], genreMap);
      expect(result).toEqual([]);
    });

    it('should handle movie with no genres', () => {
      const tmdbMovies: TMDBMovie[] = [
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
          genre_ids: [],
        },
      ];

      const genreMap = new Map<number, Genre>();
      const result = service.transformMovies(tmdbMovies, genreMap);
      expect(result[0].genres).toHaveLength(0);
    });
  });
});
