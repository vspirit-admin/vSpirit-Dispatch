import { VaKey } from '../types'
import { redisClient, RedisClientType } from './redis'
import TTLCache from './ttlcache';
import { log } from '../log';

const ms = (hours: number) => Math.floor(hours * 60 * 60 * 1000)

type RedisTTLCacheValueType = string | object;

class RedisTTLCache {
  private readonly client: RedisClientType
  private readonly vaKey: VaKey = 'NKS';

  constructor (redisClient: RedisClientType, vaKey?: VaKey) {
    this.client = redisClient;
    if (vaKey) {
      this.vaKey = vaKey;
    }
  }

  private wrapKey(key: string): string {
    const env = process.env.NODE_ENV ?? 'local';
    return `${env}:${this.vaKey}:${key}`;
  }

  private async get(key: string) {
    const wrappedKey = this.wrapKey(key);

    let v = TTLCache.get(wrappedKey);
    if (v !== undefined) {
      log.debug(`get ${wrappedKey}:TTLCache`);
      return v;
    }

    // if the server was restarted, but Redis still has the key
    // then recache the value in the TTLCache
    v = await this.client.get(wrappedKey) as RedisTTLCacheValueType | undefined;
    if (v !== undefined) {
      log.debug(`set ${wrappedKey}:TTLCache`, v);
      TTLCache.set(wrappedKey, v);
    }
    log.debug(`get ${wrappedKey}:Redis`, v);
    return v;
  }

  private async set(key: string, value: RedisTTLCacheValueType, ttl?: number) {
    if (ttl === undefined) {
      ttl = ms(1);
    }
    if (typeof value == 'object') {
      value = JSON.stringify(value);
    }

    const wrappedKey = this.wrapKey(key);

    await this.client.set(wrappedKey, value, {
      PX: ttl
    });

    TTLCache.set(wrappedKey, value, { ttl });
  }

  private wrapArrivalInfoKey(key: string): string {
    return `arrivalInfo:${key}`;
  }

  getArrivalInfo(key: string) {
    return this.get(this.wrapArrivalInfoKey(key));
  }

  setArrivalInfo(key: string, value: RedisTTLCacheValueType) {
    return this.set(
      this.wrapArrivalInfoKey(key),
      value
    );
  }

  private wrapGateAssignedKey(key: string): string {
    return `gateAssigned:${key}`;
  }

  getGetAssigned(key: string) {
    return this.get(this.wrapGateAssignedKey(key));
  }

  setGateAssigned(key: string, value: RedisTTLCacheValueType) {
    return this.set(this.wrapGateAssignedKey(key), value);
  }
}

const nksTTLCache = new RedisTTLCache(redisClient, 'NKS');
const aalTTLCache = new RedisTTLCache(redisClient, 'AAL');

const ttlCaches = {
  'NKS': nksTTLCache,
  'AAL': aalTTLCache
}

export {
  redisClient,
  nksTTLCache,
  aalTTLCache,
  ttlCaches
}