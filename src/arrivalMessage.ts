import axios from 'axios'
import { aalPilots } from './config'
import { log } from './log'

import filterAsync from 'node-filter-async'
import getArrivalInfo from './getArrivalInfo'
import { hoppieString, HoppieType } from './hoppie'
import { ttlCaches } from './cache/caches'
import { VaKey } from './types'

const vAmsysMapUris = {
  'NKS': 'https://vamsys.io/statistics/map/e084cd47-e432-4fcd-a8c3-7cbf86358c9d',
  'AAL': 'https://vamsys.io/statistics/map/4f89c7e1-2d90-42e2-b449-90781bed2d17'
}

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
    time_remaining: string
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

const flightShouldReceiveMessage = ({
  currentLocation,
  callsign,
  pilot
}: VaFlightInfo, vaKey: VaKey) => {

  if (vaKey == 'AAL') {

    if (['ROA', 'TWA', 'PSA'].includes(callsign.substring(0, 3))) {
      log.info(`Dropping message for ${pilot.username} on flight ${callsign}`);
      return false;
    }

    if (!aalPilots.includes(pilot.username)) {
      if (process.env.DEV_MODE?.toLowerCase() === 'true') {
        log.debug(`Would have dropped message for pilot ${pilot.username} on flight ${callsign}`);
        return true;
      }

      log.info(`Dropping message for ${pilot.username} on flight ${callsign}`);
      return false;
    }
  }

  return currentLocation.distance_remaining <= 225 &&
  currentLocation.groundspeed >= 250 // To prevent early gate assignments for short flights.
}

// Auto send arrival info per vAMSYS info
export const arrivalMessage = async (vaKeyParam?: VaKey) => {
  const vaKey = vaKeyParam ?? 'NKS' as VaKey;
  log.info(`Checking for arrival aircraft on vAMSYS for VA ${vaKey}...`)

  let data: VaFlightInfo[];
  try {
    data = (await axios.get(vAmsysMapUris[vaKey])).data as VaFlightInfo[];
  } catch (e) {
    return;
  }

  const flightsToReceiveMessage = await filterAsync(data, async (flight) => {
    if (flightShouldReceiveMessage(flight, vaKey)) {
      const isCached = await ttlCaches[vaKey].getArrivalInfo(flight.callsign);
      log.debug(`Flight ${flight.callsign} isCached:`, !!isCached);
      return !isCached;
    }

    return false;
  });


  log.info(
    `${vaKey}: ${data.length} flights found, ${flightsToReceiveMessage.length} eligible arriving flights found.`
  )

  let shouldCacheFlights = true;
  if (process.env.DEV_MODE == 'true'
    && vaKey == 'AAL'
    && flightsToReceiveMessage.length === 0
    && data.length > 0)
  {
    log.debug('No eligible flights for debugging - adding all flights to test.');
    flightsToReceiveMessage.push(...data);
    log.debug('Not caching sent flight info');
    shouldCacheFlights = false;
  }

  return Promise.all(
    flightsToReceiveMessage.map(async (flight) => {
      if (shouldCacheFlights) {
        await ttlCaches[vaKey].setArrivalInfo(flight.callsign, 'true');
      }
      const arrivalMessage = await getArrivalInfo({
        arr: flight.arrival.icao,
        dep: flight.departure.icao,
        callsign: flight.callsign,
        type: flight.aircraft.code
      }, vaKey)

      if (process.env.DEV_MODE?.toLowerCase() === 'true') {
        log.debug(`Generated message:\n${arrivalMessage}`);
        return;
      }

      const dispatchCallsign = process.env[`${vaKey}_DISPATCH_CALLSIGN`] as unknown as string;
      const callsign = flight.callsign;

      /* when testing integration with Hoppie on non prod, ensure that
       * we are not sending actual messages to flights
       */
      if (process.env.NODE_ENV != 'production') {
        flight.callsign = `${dispatchCallsign}OUT`;
        log.debug(callsign, '->', flight.callsign);
      }

      log.info(`Sending arrival info to ${flight.callsign}.`)
      await axios.post(
        hoppieString(HoppieType.telex, dispatchCallsign, flight.callsign, arrivalMessage)
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
