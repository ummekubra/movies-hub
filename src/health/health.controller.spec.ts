import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let typeOrmHealthIndicator: TypeOrmHealthIndicator;
  let redisHealthIndicator: RedisHealthIndicator;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  const mockTypeOrmHealthIndicator = {
    pingCheck: jest.fn(),
  };

  const mockRedisHealthIndicator = {
    isHealthy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockTypeOrmHealthIndicator,
        },
        {
          provide: RedisHealthIndicator,
          useValue: mockRedisHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    typeOrmHealthIndicator = module.get<TypeOrmHealthIndicator>(
      TypeOrmHealthIndicator,
    );
    redisHealthIndicator =
      module.get<RedisHealthIndicator>(RedisHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return the health check result when everything is healthy', async () => {
      const healthCheckResult = {
        status: 'ok',
        info: {
          postgres: { status: 'up' },
          redis: { status: 'up' },
        },
        error: {},
        details: {
          postgres: { status: 'up' },
          redis: { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(healthCheckResult);

      const result = await controller.check();

      expect(result).toEqual(healthCheckResult);
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
        expect.any(Function),
      ]);
    });

    it('should check both postgres and redis health', async () => {
      // Mock implementation to capture and execute the health check functions
      mockHealthCheckService.check.mockImplementation(async (healthChecks) => {
        for (const check of healthChecks) {
          await check();
        }
        return { status: 'ok' };
      });

      await controller.check();

      expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('postgres');
      expect(redisHealthIndicator.isHealthy).toHaveBeenCalledWith('redis');
    });

    it('should propagate errors from health checks', async () => {
      const healthError = new Error('Database connection failed');

      mockHealthCheckService.check.mockRejectedValue(healthError);

      await expect(controller.check()).rejects.toThrow(healthError);
    });
  });

  describe('API documentation', () => {
    it('should have ApiTags decorator set to "Health"', () => {
      const controllerMetadata = Reflect.getMetadata(
        'swagger/apiUseTags',
        HealthController,
      );
      expect(controllerMetadata).toContain('Health');
    });
  });
});
