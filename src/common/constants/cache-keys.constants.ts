export class CacheKeys {
  // Movie module
  static readonly MOVIE_MODULE = 'movies';
  static readonly MOVIE_PREFIX = 'movie:';
  static readonly MOVIE_LIST_PREFIX = 'movies:list:';
  static readonly MOVIE_DETAILS = (id: number): string =>
    `${this.MOVIE_PREFIX}${id}`;
  static readonly MOVIE_LIST = (filterHash: string): string =>
    `${this.MOVIE_LIST_PREFIX}${filterHash}`;

  // User module
  static readonly USER_PREFIX = 'user:';
  static readonly USER_DETAILS = (id: number): string =>
    `${this.USER_PREFIX}${id}`;
  static readonly USER_LIST_PREFIX = 'users:list:';
  static readonly USER_LIST = (filterHash: string): string =>
    `${this.USER_LIST_PREFIX}${filterHash}`;

  // Genre module
  static readonly GENRE_PREFIX = 'genre:';
  static readonly GENRE_DETAILS = (id: number): string =>
    `${this.GENRE_PREFIX}${id}`;
  static readonly GENRE_LIST = 'genre:list';

  // Watchlist module
  static readonly WATCHLIST_PREFIX = 'watchlist:';
  static readonly USER_WATCHLIST = (userId: number): string =>
    `${this.WATCHLIST_PREFIX}user:${userId}`;

  // Ratings module
  static readonly RATING_PREFIX = 'rating:';
  static readonly MOVIE_RATINGS = (movieId: number): string =>
    `${this.RATING_PREFIX}movie:${movieId}`;
  static readonly USER_RATINGS = (userId: number): string =>
    `${this.RATING_PREFIX}user:${userId}`;

  /**
   * Generate a namespaced cache key
   * @param namespace The namespace for the key
   * @param key The specific key identifier
   */
  static namespaced(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }
}
