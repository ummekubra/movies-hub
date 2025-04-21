# Movies Hub API

A NestJS application that consumes The Movie Database (TMDB) APIs to store and sync movie data in a PostgreSQL database with a Redis caching layer.

## Overview

Movies Hub is a comprehensive TMDB data syncing and API service that allows users to:

* Browse and search movies from TMDB
* Filter movies by genre, etc
* Rate movies and see average ratings
* Add movies to watchlists
* Manage user accounts with authentication

The application regularly syncs(cron) data from TMDB and stores it locally, providing fast access through optimized endpoints with caching.

## Tech Stack

* **Framework** : NestJS
* **Database** : PostgreSQL (via TypeORM)
* **Caching** : Redis (via KeyV)
* **Authentication** : JWT (JSON Web Tokens)
* **API Documentation** : Swagger
* **Testing** : Jest
* **Containerization** : Docker & Docker Compose

## Project Structure

```
movies-hub/
├── src/
│   ├── common/          # Shared utilities, filters, constants
│   ├── config/          # Application configuration files
│   ├── health/          # Health check endpoints
│   ├── modules/
│   │   ├── auth/        # Authentication module
│   │   │   ├── controllers/
│   │   │   ├── dtos/
│   │   │   ├── guards/
│   │   │   ├── services/
│   │   │   └── strategies/
│   │   ├── movies/      # Movies module
│   │   ├── tmdb/        # TMDB integration module
│   │   └── users/       # Users module
│   └── app.module.ts    # Main application module
├── .env                 # Environment variables
├── .gitignore
├── docker-compose.yml   # Docker Compose configuration
├── Dockerfile           # Docker configuration
├── package.json         # Dependencies and scripts
├── README.md            # Project documentation
└── tsconfig.json        # TypeScript configuration
```

## Database Schema

The application uses the following database schema:

* **Movie** : Contains movie details including title, overview, posterPath, backdropPath, etc.
* **Genre** : Movie genres (Action, Comedy, Drama, etc.)
* **User** : User information including authentication details
* **Watchlist** : User's movie watchlist
* **Movie_Rating** : User ratings for movies

Relationships:

* Movies can have multiple genres (many-to-many)
* Users can rate multiple movies (one-to-many)
* Users can add multiple movies to their watchlist (one-to-many)

## API Endpoints

### Authentication

* `POST /auth/login` - Login and get JWT tokens
* `POST /auth/refresh` - Refresh JWT token

### Movies

* `GET /movies` - List movies with pagination, filtering,  searching and sorting.
* `POST /movies` - Create a new movie.
* `GET /movies/:id` - Get movie details by ID.
* `PATCH /movies/:id` - Update a movie.
* `DELETE /movies/:id` - Delete a movie.

### User Actions

* `POST /users` - Register a new user
* `GET /users` - Get all registered users
* `GET /users/:id` - Get user by ID
* `PATCH /users/:id` - Update user info
* `DELETE /users/:id` - Delete a user

### Watchlist & Rating Movies

* `POST /watchlist` - Add movie to your watchlist.
* `GET /watchlist` - Get current user's watchlist.
* `DELETE /watchlist/:id` - Remove movie from watchlist.
* `POST /rating` - Rate movies (0.5 to 10.0).

### Health

* `GET /health` - Check API and service health

## Setting Up for Development

### Prerequisites

* Node.js 18+
* npm or yarn
* Docker and Docker Compose
* PostgreSQL
* Redis

### Local Setup

1. Clone the repository:

```bash
git clone https://github.com/ummekubra/movies-hub.git
cd movies-hub
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on the provided example.
4. Start PostgreSQL and Redis (using Docker or local installations).
5. Run database migrations:

```bash
npm run typeorm:run-migrations
```

6. Start the development server:

```bash
npm run start:dev
```

The server will be available at `http://localhost:8080`.

## Docker Setup

The application can be run entirely within Docker containers:

```bash
docker-compose up
```

This will start:

* The NestJS application on port 8080
* PostgreSQL database on port 5432
* Redis cache on port 6379

## Testing

The project includes comprehensive unit and integration tests:

```bash
# Run all tests
npm test
```

## Data Syncing

The application syncs data from TMDB using a scheduled task. The sync can be configured through environment variables:

* `SYNC_PAGE_COUNT`: Number of pages to sync from TMDB (default: 100)
* `TMDB_API_KEY`: Your TMDB API key

## Authentication

The API uses JWT for authentication:

* Access tokens expire in 1 hour
* Refresh tokens expire in 7 days

Include the JWT token in requests as a Bearer token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## Caching

The application uses Redis for caching with the following settings:

* Default TTL: 1 hour
* Cache keys are prefixed based on the resource type

## API Documentation

Swagger API documentation is available at `localhost:8080/api-docs` when the application is running.

## Environment Variables

| Variable               | Description                  | Default                      |
| ---------------------- | ---------------------------- | ---------------------------- |
| SERVER_PORT            | Application port             | 8080                         |
| MODE                   | Application mode (DEV/PROD)  | DEV                          |
| SYNC_PAGE_COUNT        | Number of TMDB pages to sync | 100                          |
| TMDB_BASE_URL          | TMDB API base URL            | https://api.themoviedb.org/3 |
| TMDB_API_KEY           | TMDB API key                 | Required                     |
| DB_HOST                | Database host                | 127.0.0.1                    |
| DB_PORT                | Database port                | 5432                         |
| DB_USER                | Database username            | Required                     |
| DB_PASSWORD            | Database password            | Required                     |
| DB_DATABASE            | Database name                | movies_db                    |
| JWT_SECRET             | JWT secret key               | Required                     |
| JWT_EXPIRES_IN         | JWT expiration time          | 1h                           |
| JWT_REFRESH_SECRET     | JWT refresh token secret     | Required                     |
| JWT_REFRESH_EXPIRES_IN | JWT refresh token expiration | 7d                           |
| REDIS_HOST             | Redis host                   | localhost                    |
| REDIS_PORT             | Redis port                   | 6379                         |
| REDIS_PASSWORD         | Redis password               | Required                     |
| REDIS_TTL              | Redis cache TTL (ms)         | 3600000                      |

## Best Practices

This project follows these best practices:

* SOLID principles for code organization
* RESTful API design
* Efficient caching strategies
* Comprehensive error handling
* Security-focused authentication
* Containerization for consistent environments
* Well-documented code and APIs

## License

[UNLICENSED] - Private project
