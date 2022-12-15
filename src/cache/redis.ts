import { createClient } from 'redis'
import { log } from '../log'

const redisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST ?? 'redis',
    port: parseInt(process.env.REDIS_PORT ?? '6379')
  }
});
redisClient.on('error', (err) => log.error('Redis error:', err));
redisClient.on('connect', () => log.debug('Connected to redis.'));

void (async () => {
  await redisClient.connect();
})();

export type RedisClientType = typeof redisClient;

export { redisClient }