import { Module } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
