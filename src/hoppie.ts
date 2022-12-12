import qs from 'qs'

const HOPPIE_URL = 'http://www.hoppie.nl/acars/system/connect.html?'

export enum HoppieType {
  poll = 'poll',
  telex = 'telex',
  progress = 'progress',
}

interface HoppieMessage {
  from: string
  type: HoppieType
  message: string
}

/**
 * Generates request URI string for interacting with Hoppie's ACARS.
 * https://www.hoppie.nl/acars/system/tech.html
 *
 * @param type By default 'poll', otherwise one of HoppieType.
 * @param from Emitter of the request
 * @param to Destination of the request, or self if not given.
 * @param packet Leave undefined for no packet/message, otherwise any string. Any special characters will be encoded.
 */
export const hoppieString = (
  type = HoppieType.poll,
  from: string,
  to?: string,
  packet?: string
) => {
  const HOPPIE_LOGON = process.env.HOPPIE_LOGON

  if (!HOPPIE_LOGON) {
    throw new Error('HOPPIE_LOGON environment var not set.')
  }

  const query = qs.stringify({
    logon: HOPPIE_LOGON,
    from,
    to: to ?? from,
    type,
    packet,
  })

  return `${HOPPIE_URL}${query}`
}

// noinspection JSUnusedGlobalSymbols
/**
 * Parses an input string from a hoppie response and returns it as an array of HoppieMessage.
 * Currently unused but keeping for possible future use.
 *
 * @param input
 */
export const hoppieParse = (input: string): HoppieMessage[] =>
  [...input.matchAll(/{(\S+) (\S+) {(.*?)}}/gs)].map((match) => ({
    from: match[1],
    type: match[2] as HoppieType,
    message: match[3],
  }))
