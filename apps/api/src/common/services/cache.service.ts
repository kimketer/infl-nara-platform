import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  tags?: string[]; // Cache tags for invalidation
}

export interface CacheStrategy {
  name: string;
  ttl: number;
  invalidationPattern?: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;
  private readonly defaultTTL = 3600; // 1 hour

  // Cache strategies for different data types
  private readonly strategies: Record<string, CacheStrategy> = {
    dashboard: {
      name: 'dashboard',
      ttl: 300, // 5 minutes
      invalidationPattern: 'dashboard:*',
    },
    campaign: {
      name: 'campaign',
      ttl: 1800, // 30 minutes
      invalidationPattern: 'campaign:*',
    },
    user: {
      name: 'user',
      ttl: 7200, // 2 hours
      invalidationPattern: 'user:*',
    },
    performance: {
      name: 'performance',
      ttl: 600, // 10 minutes
      invalidationPattern: 'performance:*',
    },
    settlement: {
      name: 'settlement',
      ttl: 3600, // 1 hour
      invalidationPattern: 'settlement:*',
    },
    linkprice: {
      name: 'linkprice',
      ttl: 900, // 15 minutes
      invalidationPattern: 'linkprice:*',
    },
  };

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });
  }

  private generateKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  async get<T>(key: string, strategy: string = 'default'): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key, this.strategies[strategy]?.name);
      const data = await this.redis.get(cacheKey);
      
      if (data) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return JSON.parse(data);
      }
      
      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting cache for key: ${key}`, error);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    strategy: string = 'default',
    options?: CacheOptions,
  ): Promise<void> {
    try {
      const cacheStrategy = this.strategies[strategy] || this.strategies.dashboard;
      const cacheKey = this.generateKey(key, options?.prefix || cacheStrategy.name);
      const ttl = options?.ttl || cacheStrategy.ttl;

      await this.redis.setex(cacheKey, ttl, JSON.stringify(value));
      
      // Add to cache tags if specified
      if (options?.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await this.redis.sadd(`tag:${tag}`, cacheKey);
          await this.redis.expire(`tag:${tag}`, ttl);
        }
      }

      this.logger.debug(`Cached data for key: ${cacheKey} with TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`Error setting cache for key: ${key}`, error);
    }
  }

  async delete(key: string, strategy: string = 'default'): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, this.strategies[strategy]?.name);
      await this.redis.del(cacheKey);
      this.logger.debug(`Deleted cache for key: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Error deleting cache for key: ${key}`, error);
    }
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Error invalidating cache by pattern: ${pattern}`, error);
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keys = await this.redis.smembers(`tag:${tag}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.del(`tag:${tag}`);
        this.logger.debug(`Invalidated ${keys.length} cache keys for tag: ${tag}`);
      }
    } catch (error) {
      this.logger.error(`Error invalidating cache by tag: ${tag}`, error);
    }
  }

  async invalidateStrategy(strategy: string): Promise<void> {
    const cacheStrategy = this.strategies[strategy];
    if (cacheStrategy?.invalidationPattern) {
      await this.invalidateByPattern(cacheStrategy.invalidationPattern);
    }
  }

  // Dashboard-specific caching methods
  async getDashboardData(userId: string): Promise<any | null> {
    return this.get(`dashboard:${userId}`, 'dashboard');
  }

  async setDashboardData(userId: string, data: any): Promise<void> {
    await this.set(`dashboard:${userId}`, data, 'dashboard');
  }

  async invalidateDashboardData(userId?: string): Promise<void> {
    if (userId) {
      await this.delete(`dashboard:${userId}`, 'dashboard');
    } else {
      await this.invalidateStrategy('dashboard');
    }
  }

  // Campaign-specific caching methods
  async getCampaignData(campaignId: string): Promise<any | null> {
    return this.get(`campaign:${campaignId}`, 'campaign');
  }

  async setCampaignData(campaignId: string, data: any): Promise<void> {
    await this.set(`campaign:${campaignId}`, data, 'campaign');
  }

  async invalidateCampaignData(campaignId?: string): Promise<void> {
    if (campaignId) {
      await this.delete(`campaign:${campaignId}`, 'campaign');
    } else {
      await this.invalidateStrategy('campaign');
    }
  }

  // Performance data caching
  async getPerformanceData(key: string): Promise<any | null> {
    return this.get(`performance:${key}`, 'performance');
  }

  async setPerformanceData(key: string, data: any): Promise<void> {
    await this.set(`performance:${key}`, data, 'performance');
  }

  // Linkprice API response caching
  async getLinkpriceData(key: string): Promise<any | null> {
    return this.get(`linkprice:${key}`, 'linkprice');
  }

  async setLinkpriceData(key: string, data: any): Promise<void> {
    await this.set(`linkprice:${key}`, data, 'linkprice');
  }

  // Cache statistics
  async getStats(): Promise<any> {
    try {
      const info = await this.redis.info();
      const keyspace = await this.redis.info('keyspace');
      
      return {
        info: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace),
        strategies: Object.keys(this.strategies),
      };
    } catch (error) {
      this.logger.error('Error getting cache stats', error);
      return null;
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const lines = info.split('\r\n');
    const result: Record<string, any> = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }
    
    return result;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return false;
    }
  }

  // Graceful shutdown
  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
} 