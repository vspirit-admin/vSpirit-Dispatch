import TTLCache from '@isaacs/ttlcache';

const ms = (hours: number) => Math.floor(hours * 60 * 60 * 1000);

export default new TTLCache<string, string | object>({ttl: ms(1)});
