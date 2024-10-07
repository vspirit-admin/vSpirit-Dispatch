import axios, { AxiosError } from 'axios'
import filterAsync from 'node-filter-async'
import VaFlightResponse from './interfaces/VaFlightResponse'
import VaFlightInfo from './interfaces/VaFlightInfo'
import { log } from './log'

import { flightShouldReceiveMessage } from './flightShouldReceiveMessage'
import getArrivalInfo from './getArrivalInfo'
import { hoppieString, HoppieType } from './hoppie'
import { ttlCaches } from './cache/caches'
import { VaKey } from './types'

const vAmsysActiveFlightsUri = 'https://vamsys.io/api/token/v1/discord/airline/active-flights'

// Auto send arrival info per vAMSYS info
export const arrivalMessage = async (vaKeyParam?: VaKey) => {
  const vaKey = vaKeyParam ?? ('NKS' as VaKey)
  log.info(`Checking for arrival aircraft on vAMSYS for VA ${vaKey}...`)

  let response: VaFlightResponse;
  try {
    const VAMSYS_TOKEN: string = process.env['VAMSYS_TOKEN_' + vaKey] ?? ''
    response = (await axios.post(vAmsysActiveFlightsUri, {}, {
      headers: {
        Authorization: `Bearer ${VAMSYS_TOKEN}`
      }
    })).data as VaFlightResponse
  } catch (e) {
    log.info((e as AxiosError).message)
    log.debug((e as AxiosError).toJSON())
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (response?.data?.flights === undefined) return;

  const flightsToReceiveMessage = await filterAsync(
    Object.values(response.data.flights),
    async (flight: VaFlightInfo) => {
    if (flightShouldReceiveMessage(flight, vaKey)) {
      const isCached = !!await ttlCaches[vaKey].getArrivalInfo(flight.booking.callsign);
      log.debug(`Flight ${flight.booking.callsign} isCached: `, isCached);
      return !isCached;
    }

    return false;

  });

  log.info(
    `${vaKey}: ${response.data.total} flights found, ${flightsToReceiveMessage.length} eligible arriving flights found.`
  )

  let shouldCacheFlights = true;
  if (
    process.env.DEV_MODE == 'true' &&
    //vaKey == 'AAL' &&
    flightsToReceiveMessage.length === 0 &&
    response.data.total > 0
  ) {
    log.debug('No eligible flights for debugging - adding all flights to test.')

    flightsToReceiveMessage.push(...Object.values(response.data.flights) as VaFlightInfo[]);
    log.debug('Not caching sent flight info')
    shouldCacheFlights = false;
  }


  return Promise.all(
    flightsToReceiveMessage.map(async (flight: VaFlightInfo) => {
      if (shouldCacheFlights) {
        await ttlCaches[vaKey].setArrivalInfo(flight.booking.callsign, 'true')
      }
      const arrivalMessage = await getArrivalInfo(
        {
          arr: flight.arrivalAirport.icao,
          dep: flight.departureAirport.icao,
          callsign: flight.booking.callsign,
          type: flight.aircraft.code
        },
        vaKey
      )

      if (process.env.DEV_MODE?.toLowerCase() === 'true') {
        log.debug(`Generated message:\n${arrivalMessage}`)
        return
      }

      const dispatchCallsign = process.env[
        `${vaKey}_DISPATCH_CALLSIGN`
        ] as unknown as string
      const callsign = flight.booking.callsign

      /* when testing integration with Hoppie on non prod, ensure that
       * we are not sending actual messages to flights
       */
      if (process.env.NODE_ENV != 'production') {
        flight.booking.callsign = `${dispatchCallsign}OUT`
        log.debug(callsign, '->', flight.booking.callsign)
      }

      log.info(`Sending arrival info to ${flight.booking.callsign}.`)
      const url = hoppieString(
        HoppieType.telex,
        dispatchCallsign,
        flight.booking.callsign,
        arrivalMessage
      )

      //log.debug(url);

      await axios
        .post(url)
        .then(function(response) {
          // Hoppie returns a 200 status code even with logon code failures
          if (response.data == 'error {illegal logon code}') {
            throw new Error('HOPPIE_LOGON is invalid.')
          }

          if (response.data == 'ok') {
            log.info(`Sending arrival info for ${flight.booking.callsign} succeeded.`)
          }
        })
    })
  )
}
