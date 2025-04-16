export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: TMDBGenre[];
}

export interface TMDBMovieResponse {
  page: number;
  results: TMDBMovie[];
  total_results: number;
  total_pages: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBGenreResponse {
  genres: TMDBGenre[];
}
