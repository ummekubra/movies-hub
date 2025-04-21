import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class RedisHealthIndicator implements OnModuleInit {
  private readonly client: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<string>('REDIS_PORT', '6379');
    const password = this.configService.get<string>('REDIS_PASSWORD', '');

    const url = `redis://:${password}@${host}:${port}`;
    this.client = createClient({ url });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Redis connection failed on init:', error);
    }
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.client.ping();
      if (pong !== 'PONG') throw new Error('Redis ping failed');

      return {
        [key]: {
          status: 'up',
        },
      };
    } catch {
      return {
        [key]: {
          status: 'down',
        },
      };
    }
  }
}
