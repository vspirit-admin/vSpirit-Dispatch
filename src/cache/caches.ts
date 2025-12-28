import { redisClient } from './redis'
import { RedisTTLCache } from './RedisTTLCache'

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