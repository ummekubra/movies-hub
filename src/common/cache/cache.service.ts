import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { keyvInstance } from 'src/config/cache.config';

@Injectable()
export class CacheService {
  private readonly cacheTtl: number;
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly configService: ConfigService) {
    this.cacheTtl = this.configService.get<number>('REDIS_TTL') || 3600000;
  }

  getCacheTtl(): number {
    return this.cacheTtl;
  }

  private generateListKey(filterDto: object, prefix: string): string {
    const filterStr = JSON.stringify(filterDto);
    return `${prefix}${Buffer.from(filterStr).toString('base64')}`;
  }

  async get<T>(key: string): Promise<T | null> {
    return await keyvInstance.get(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    await keyvInstance.set(key, value, this.cacheTtl);
  }

  async delete(key: string): Promise<void> {
    await keyvInstance.delete(key);
  }

  /**
   * Registry helpers for list invalidation
   */
  private getRegistryKey(moduleName: string): string {
    return `${moduleName}:list-keys-registry`;
  }

  async registerListKey(moduleName: string, key: string): Promise<void> {
    const registryKey = this.getRegistryKey(moduleName);
    const keyRegistry = (await keyvInstance.get<string[]>(registryKey)) || [];

    if (!keyRegistry.includes(key)) {
      keyRegistry.push(key);
      await keyvInstance.set(registryKey, keyRegistry, this.cacheTtl);
    }
  }

  async invalidateListCache(moduleName: string): Promise<void> {
    const registryKey = this.getRegistryKey(moduleName);
    const keyRegistry = (await keyvInstance.get<string[]>(registryKey)) || [];

    for (const key of keyRegistry) {
      await keyvInstance.delete(key);
    }

    await keyvInstance.set(registryKey, [], this.cacheTtl);
  }

  async setList<T>(
    moduleName: string,
    filterDto: object,
    data: T,
    prefix: string,
  ): Promise<void> {
    const key = this.generateListKey(filterDto, prefix);
    await this.set(key, data);
    await this.registerListKey(moduleName, key);
  }

  async getList<T>(filterDto: object, prefix: string): Promise<T | null> {
    const key = this.generateListKey(filterDto, prefix);
    return this.get<T>(key);
  }
}
