import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { TmdbModule } from './modules/tmdb/tmdb.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesModule } from './modules/movies/movies.module';
import { UsersModule } from './modules/users/users.module';
import typeOrmConfig from './config/typeorm.config';
import { PaginationModule } from './common/pagination/pagination.module';
import { AuthModule } from './modules/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { HealthModule } from './health/health.module';
import cacheConfig from './config/cache.config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    CacheModule.registerAsync(cacheConfig()),
    ScheduleModule.forRoot(), // initiates cron
    TmdbModule,
    MoviesModule,
    UsersModule,
    PaginationModule,
    AuthModule,
    HealthModule,
  ],
  providers: [AppService],
})
export class AppModule {}
