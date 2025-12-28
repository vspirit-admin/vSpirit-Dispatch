/* eslint-disable @typescript-eslint/unbound-method */
import { RedisTTLCache } from './RedisTTLCache';
import TTLCache from './ttlcache';
import { redisClient } from './redis';

// Mock the modules
jest.mock('./ttlcache', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock('./redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
    connect: jest.fn(),
  },
}));

describe('RedisTTLCache', () => {
  let cache: RedisTTLCache;
  const vaKey = 'NKS';
  const env = 'test';

  beforeEach(() => {
    process.env.NODE_ENV = env;
    jest.clearAllMocks();
    
    // We pass the mocked redisClient to the constructor
    cache = new RedisTTLCache(redisClient, vaKey);
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
      (redisClient.get as jest.Mock).mockResolvedValue(redisValue);

      const result = await cache.getArrivalInfo(key);

      expect(result).toBe(redisValue);
      expect(TTLCache.get).toHaveBeenCalledWith(wrappedKey);
      expect(TTLCache.get).toReturnWith(undefined)
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