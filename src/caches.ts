import TTLCache from '@isaacs/ttlcache'

const ms = (hours: number) => Math.floor(hours * 60 * 60 * 1000)

export const arrInfoSentCache = new TTLCache<string, boolean>({ ttl: ms(1) })
export const arrGatesAssigned = new TTLCache<string, boolean>({ ttl: ms(1) })
