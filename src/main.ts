import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS for global use
  app.enableCors();
  // Set up Swagger using the standalone config

  // Apply ValidationPipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are found
      transform: true, // Transform payloads into DTO instances
    }),
  );

  setupSwagger(app);
  await app.listen(process.env.SERVER_PORT ?? 8080);
}
bootstrap();
