import { type AccessToken, ClientCredentials } from 'simple-oauth2'
import { ttlCaches } from '../cache/caches.js'
import { log } from '../log.js'
import type { VaKey } from '../types.ts'

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
    },
    options: {
      authorizationMethod: 'body',
    },
  })

  try {
    const accessToken: AccessToken = await client.getToken({ scope: '*' })
    if (accessToken.token.access_token) {
      const token = accessToken.token.access_token as string
      log.info(`Caching OAuth token for ${vaKey}`)
      await cache.setVamsysToken(token)
      return token
    }
  } catch (e) {
    const clientIdSet = !!process.env[`CLIENT_ID_${vaKey}`]
    const clientSecretSet = !!process.env[`CLIENT_SECRET_${vaKey}`]
    const errDetails: Record<string, unknown> = {
      vaKey,
      clientIdSet,

      clientSecretSet,
    }

    if (e instanceof Error) {
      errDetails.message = e.message
      // simple-oauth2 attaches HTTP details to the error object
      const oauthErr = e as Error & { output?: { statusCode?: number; payload?: unknown } }
      if (oauthErr.output) {
        errDetails.statusCode = oauthErr.output.statusCode
        errDetails.responseBody = oauthErr.output.payload
      }
    }

    log.error(errDetails, `OAuth token request failed for ${vaKey}`)
  }

  return '';
}