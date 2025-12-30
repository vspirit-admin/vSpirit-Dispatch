import axios, { AxiosError } from 'axios'
import filterAsync from 'node-filter-async'
import type VaFlightResponse from './interfaces/VaFlightResponse.ts'
import type VaFlightInfo from './interfaces/VaFlightInfo.ts'
import { log } from './log.js'

import { flightShouldReceiveMessage } from './flightShouldReceiveMessage.js'
import getArrivalInfo from './getArrivalInfo.js'
import { hoppieString, HoppieType } from './hoppie.js'
import { ttlCaches } from './cache/caches.js'
import { getAccessToken } from './oauth/token.js'
import type { VaKey } from './types.ts'

const vAmsysActiveFlightsUri = 'https://vamsys.io/api/v3/operations/flight-map'

// Auto send arrival info per vAMSYS info
export const arrivalMessage = async (vaKeyParam?: VaKey) => {
  const vaKey = vaKeyParam ?? ('NKS' as VaKey)
  log.info(`Checking for arrival aircraft on vAMSYS for VA ${vaKey}...`)

  let response: VaFlightResponse;
  try {
    const VAMSYS_TOKEN = await getAccessToken(vaKey)

    response = (await axios.get(vAmsysActiveFlightsUri, {
      headers: {
        Authorization: `Bearer ${VAMSYS_TOKEN}`
      }
    })).data as VaFlightResponse
  } catch (e) {
    log.info((e as AxiosError).message)
    log.debug((e as AxiosError).toJSON())
    return
  }

  const flightsToReceiveMessage = await filterAsync(
    Object.values(response.data),
    async (flight: VaFlightInfo) => {
      if (flightShouldReceiveMessage(flight, vaKey)) {
        const isCached = !!await ttlCaches[vaKey].getArrivalInfo(flight.booking.callsign);
        log.debug(`Flight ${flight.booking.callsign} isCached: `, isCached);
        return !isCached;
      }

      return false;
    }
  );

  log.info(
    `${vaKey}: ${response.data.length} flights found, ${flightsToReceiveMessage.length} eligible arriving flights found.`
  )

  let shouldCacheFlights = true;
  if (
    process.env.DEV_MODE == 'true' &&
    //vaKey == 'AAL' &&
    flightsToReceiveMessage.length === 0 &&
    response.data.length > 0
  ) {
    log.debug('No eligible flights for debugging - adding all flights to test.')

    flightsToReceiveMessage.push(...Object.values(response.data));
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
