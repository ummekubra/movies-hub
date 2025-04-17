import { Injectable } from '@nestjs/common';
import { Genre } from 'src/modules/movies/entities/genre.entity';
import { Movie } from 'src/modules/movies/entities/movie.entity';
import { TMDBGenre, TMDBMovie } from '../interfaces/tmdb-responses.interface';

@Injectable()
export class TmdbTransformerService {
  transformGenres(tmdbGenres: TMDBGenre[]): Partial<Genre>[] {
    return tmdbGenres.map(({ id, name }) => ({
      tmdbId: id,
      name,
    }));
  }

  transformMovies(
    tmdbMovies: TMDBMovie[],
    genreMap: Map<number, Genre>,
  ): Partial<Movie>[] {
    return tmdbMovies.map((movie) => ({
      tmdbId: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date ? new Date(movie.release_date) : null,
      popularity: movie.popularity,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      genres: movie.genre_ids.map((id) => genreMap.get(id)).filter(Boolean),
    }));
  }
}
