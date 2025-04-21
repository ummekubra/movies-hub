import { ConfigService } from '@nestjs/config';
import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

export let keyvInstance: Keyv;

const cacheConfig = (): CacheModuleAsyncOptions => ({
  isGlobal: true,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const redisHost = configService.get('REDIS_HOST');
    const redisPort = configService.get<number>('REDIS_PORT');
    const redisPassword = configService.get('REDIS_PASSWORD');

    const redisUrl = redisPassword
      ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
      : `redis://${redisHost}:${redisPort}`;

    try {
      const store = new Keyv({
        store: new KeyvRedis(redisUrl),
        namespace: 'movies-hub',
      });

      keyvInstance = store;

      const ttl = configService.get<number>('REDIS_TTL') || 60 * 1000;

      return {
        store,
        ttl,
      };
    } catch (error) {
      console.error('Redis connection failed:', error);
      throw error;
    }
  },
});

export default cacheConfig;
