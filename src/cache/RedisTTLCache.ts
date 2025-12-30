import TTLCache from './ttlcache.js';
import type { RedisClientType } from './redis.js'
import { log } from '../log.js'
import type { VaKey } from '../types.js'

const ms = (hours: number) => Math.floor(hours * 60 * 60 * 1000)

type RedisTTLCacheValueType = string | object;

export class RedisTTLCache {
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
    log.silly(`get ${wrappedKey}:TTLCache`, v);
    if (v !== undefined) {
      return v;
    }

    // if the server was restarted, but Redis still has the key
    // then recache the value in the TTLCache
    v = await this.client.get(wrappedKey) as RedisTTLCacheValueType | undefined;
    if (v !== undefined) {
      log.silly(`set ${wrappedKey}:TTLCache`, v);
      TTLCache.set(wrappedKey, v);
    }
    log.silly(`get ${wrappedKey}:Redis`, v);
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

  getGateAssigned(key: string) {
    return this.get(this.wrapGateAssignedKey(key));
  }

  setGateAssigned(key: string, value: RedisTTLCacheValueType) {
    return this.set(this.wrapGateAssignedKey(key), value);
  }

  setVamsysToken(token: string) {
    return this.set('vamsysToken', token, ms(24));
  }


  getVamsysToken() {
    return this.get('vamsysToken');
  }

}