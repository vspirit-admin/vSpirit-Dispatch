import axios from 'axios'
import { log } from './log'

import filterAsync from 'node-filter-async'
import getArrivalInfo from './getArrivalInfo'
import { hoppieString, HoppieType } from './hoppie'
import { nksTTLCache } from './cache/caches'
import { VaKey } from './types'

const vAmsysMapUri =
  'https://vamsys.io/statistics/map/e084cd47-e432-4fcd-a8c3-7cbf86358c9d'

interface VaAirportInfo {
  name: string
  icao: string
  iata: string
  latitude: string
  longitude: string
}

interface VaFlightInfo {
  id: number
  callsign: string
  'flight-number': string
  pax: number
  cargo: number
  route: string
  network: string
  currentLocation: {
    altitude: number
    heading: number
    latitude: string
    longitude: string
    groundspeed: number
    distance_remaining: number
    distance_flown: number
    departure_time: string
    estimated_arrival_time: string
    time_flown: string
  }
  aircraft: {
    registration: string
    name: string
    code: string
    codename: string
  }
  arrival: VaAirportInfo
  departure: VaAirportInfo
  pilot: {
    username: string
  }
}

const flightShouldReceiveMessage = ({ currentLocation }: VaFlightInfo) =>
  currentLocation.distance_remaining <= 225 &&
  currentLocation.groundspeed >= 250 // To prevent early gate assignments for short flights.

// Auto send arrival info per vAMSYS info
export const arrivalMessage = async (vaKey?: VaKey) => {
  vaKey = vaKey ?? 'NKS';
  log.info(`Checking for arrival aircraft on vAMSYS for VA ${vaKey}...`)
  const data = (await axios.get(vAmsysMapUri)).data as VaFlightInfo[]
  const flightsToReceiveMessage = await filterAsync(data, async (flight) => {
    const isCached = await nksTTLCache.getArrivalInfo(flight.callsign);
    log.debug(`Flight ${flight.callsign} isCached:`, !!isCached);
    return flightShouldReceiveMessage(flight) && !isCached;
  });


  log.info(
    `${data.length} flights found, ${flightsToReceiveMessage.length} eligible arriving flights found.`
  )

  let shouldCacheFlights = true;
  if (process.env.DEV_MODE == 'true'
    && flightsToReceiveMessage.length === 0
    && data.length > 0)
  {
    log.debug('No eligible flights for debugging - adding all flights to test.');
    flightsToReceiveMessage.push(...data);
    shouldCacheFlights = false;
  }


  return Promise.all(
    flightsToReceiveMessage.map(async (flight) => {
      if (shouldCacheFlights) {
        await nksTTLCache.setArrivalInfo(flight.callsign, 'true');
      }
      const arrivalMessage = await getArrivalInfo({
        arr: flight.arrival.icao,
        dep: flight.departure.icao,
        callsign: flight.callsign,
      })

      if (process.env.DEV_MODE?.toLowerCase() === 'true') {
        log.debug(`Generated message:\n${arrivalMessage}`);
        return;
      }

      const callsign = flight.callsign;
      /* when testing integration with Hoppie on non prod, ensure that
       * we are not sending actual messages to flights
       */
      if (process.env.NODE_ENV != 'production') {
        flight.callsign = `${process.env.DISPATCH_CALLSIGN ?? 'NKS'}OUT`;
        log.debug(callsign, '->', flight.callsign);
      }

      log.info(`Sending arrival info to ${flight.callsign}.`)
      await axios.post(
        hoppieString(HoppieType.telex, arrivalMessage, flight.callsign)
      ).then(function (response) {
        // Hoppie returns a 200 status code even with logon code failures
        if (response.data == 'error {illegal logon code}') {
          throw new Error('HOPPIE_LOGON is invalid.');
        }

        if (response.data == 'ok') {
          log.info(`Sending arrival info for ${flight.callsign} succeeded.`);
        }
      });
    })
  )
}
