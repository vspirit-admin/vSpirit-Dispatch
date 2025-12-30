/* eslint-disable @typescript-eslint/unbound-method */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('./ttlcache.js', () => ({
  default: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.unstable_mockModule('./redis.js', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
    connect: jest.fn(),
  },
}));

const { RedisTTLCache } = await import('./RedisTTLCache.js');
import type { RedisTTLCache as RedisTTLCacheType } from './RedisTTLCache.js';
const { default: TTLCache } = await import('./ttlcache.js');
const { redisClient } = await import('./redis.js');


describe('RedisTTLCache', () => {
  let cache: RedisTTLCacheType; // Use the Instance type here
  const vaKey = 'NKS';
  const env = 'test';

  beforeEach(() => {
    process.env.NODE_ENV = env;
    jest.clearAllMocks();

    // RedisTTLCache (from the dynamic import) is the constructor
    cache = new RedisTTLCache(redisClient as any, vaKey);
  });

  describe('getArrivalInfo', () => {
    it('should check TTLCache first', async () => {
      const key = 'FLIGHT123';
      const wrappedKey = `${env}:${vaKey}:arrivalInfo:${key}`;
      const cachedValue = 'cached_value';
      (TTLCache.get as jest.Mock).mockReturnValue(cachedValue);

      const result = await cache.getArrivalInfo(key);

      expect(result).toBe(cachedValue);
      expect(TTLCache.get).toHaveBeenCalledWith(wrappedKey);
      expect(redisClient.get).not.toHaveBeenCalled();
    });

    it('should fallback to Redis and re-cache if TTLCache is empty', async () => {
      const key = 'FLIGHT123';
      const wrappedKey = `${env}:${vaKey}:arrivalInfo:${key}`;
      const redisValue = 'redis_value';

      (TTLCache.get as jest.Mock).mockReturnValue(undefined);
      // Cast to any or a specific MockedFunction to satisfy the strict ESM types
      (redisClient.get as jest.MockedFunction<any>).mockResolvedValue(redisValue);

      const result = await cache.getArrivalInfo(key);

      expect(result).toBe(redisValue);
      expect(TTLCache.get).toHaveBeenCalledWith(wrappedKey);
      expect(TTLCache.get).toHaveReturnedWith(undefined)
      expect(redisClient.get).toHaveBeenCalledWith(wrappedKey);
      expect(TTLCache.set).toHaveBeenCalledWith(wrappedKey, redisValue);
    });
  });

  describe('setArrivalInfo', () => {
    it('should set values in both Redis and TTLCache with 1h TTL', async () => {
      const key = 'FLIGHT123';
      const value = { stand: 'A1' };
      const stringified = JSON.stringify(value);
      const wrappedKey = `${env}:${vaKey}:arrivalInfo:${key}`;
      const oneHourMs = 3600000;

      await cache.setArrivalInfo(key, value);

      expect(redisClient.set).toHaveBeenCalledWith(
        wrappedKey,
        stringified,
        { PX: oneHourMs }
      );
      expect(TTLCache.set).toHaveBeenCalledWith(
        wrappedKey,
        stringified,
        { ttl: oneHourMs }
      );
    });
  });

  describe('setVamsysToken', () => {
    it('should use a 24h TTL for tokens', async () => {
      const token = 'abc-123';
      const wrappedKey = `${env}:${vaKey}:vamsysToken`;
      const twentyFourHoursMs = 86400000;

      await cache.setVamsysToken(token);

      expect(redisClient.set).toHaveBeenCalledWith(
        wrappedKey,
        token,
        { PX: twentyFourHoursMs }
      );

      expect(TTLCache.set).toHaveBeenCalledWith(
        wrappedKey,
        token,
        { ttl: twentyFourHoursMs }
      );
    });
  });
});