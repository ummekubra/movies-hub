import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('TMDB Movie API')
    .setDescription('API documentation for the movies')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    // Order here determines the tag order in Swagger UI
    .addTag('Health', "Check Application's health")
    .addTag('Auth', 'Authentication and login endpoints')
    .addTag('Users', 'User management')
    .addTag('Movies', 'Movie sync and retrieval')
    .addTag('Movie Ratings')
    .addTag('Watchlist')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
}
