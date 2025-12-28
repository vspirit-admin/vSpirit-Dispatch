import { AccessToken, ClientCredentials } from 'simple-oauth2'
import { ttlCaches } from '../cache/caches'
import { log } from '../log'
import { VaKey } from '../types'

export async function getAccessToken(vaKey: VaKey): Promise<string> {
  const cache = ttlCaches[vaKey]
  const accessToken = await cache.getVamsysToken() as string
  if (accessToken) {
    log.info(`Using cached OAuth token for ${vaKey}`)
    return accessToken;
  }

  const client = new ClientCredentials({
    client: {
      id: process.env[`CLIENT_ID_${vaKey}`] ?? '',
      secret: process.env[`CLIENT_SECRET_${vaKey}`] ?? '',
    },
    auth: {
      tokenHost: 'https://vamsys.io/oauth/token',
    }
  })

  try {
    const accessToken: AccessToken = await client.getToken({ scope: '*' })
    if (accessToken.token.access_token) {
      const token = accessToken.token.access_token as string
      log.debug(`Caching OAuth token for ${vaKey}`)
      await cache.setVamsysToken(token)
      return token
    }
  } catch (e) {
    log.error(e)
  }

  return '';
}