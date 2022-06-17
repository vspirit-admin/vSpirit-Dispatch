import NodeCache from 'node-cache'

export const arrInfoSentCache = new NodeCache({ stdTTL: 3600 }) // 1 hour TTL
export const arrGatesAssigned = new NodeCache({ stdTTL: 3600 })
