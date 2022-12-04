import { VaKey } from '../types'
import { redisClient, RedisClientType } from './redis'

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

  private get(key: string) {
    return this.client.get(this.wrapKey(key));
  }

  private async set(key: string, value: RedisTTLCacheValueType) {
    if (typeof value == 'object') {
      value = JSON.stringify(value);
    }

    await this.client.set(this.wrapKey(key), value, {
      PX: ms(1)
    })
  }

  private wrapArrivalInfoKey(key: string): string {
    return `arrivalInfo:${key}`;
  }

  async getArrivalInfo(key: string) {
    return await this.get(this.wrapArrivalInfoKey(key));
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

export {
  redisClient,
  nksTTLCache
}