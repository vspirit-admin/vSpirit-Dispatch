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
 * @param packet Leave undefined for no packet/message, otherwise any string. Any special characters will be encoded.
 * @param to Destination of the request, or self if not given.
 */
export const hoppieString = (
  type = HoppieType.poll,
  packet: string | undefined = undefined,
  to: string | undefined = undefined
) => {
  const CALLSIGN = process.env.DISPATCH_CALLSIGN
  const HOPPIE_LOGON = process.env.HOPPIE_LOGON

  if (!CALLSIGN || !HOPPIE_LOGON) {
    throw new Error('CALLSIGN or HOPPIE_LOGON environment vars not set.')
  }

  const query = qs.stringify({
    logon: HOPPIE_LOGON,
    from: CALLSIGN,
    to: to ?? CALLSIGN,
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
