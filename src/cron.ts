import { schedule } from 'node-cron'
import axios from 'axios'

import getArrivalInfo from './getArrivalInfo'
import { hoppieParse, hoppieString, HoppieType } from './hoppie'
import { arrInfoSentCache } from './caches'

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

const flightArrivingSoon = ({ currentLocation }: VaFlightInfo) =>
  currentLocation.distance_remaining <= 225 &&
  currentLocation.groundspeed >= 250

// Auto send arrival info per vAMSYS info
export const cron2 = () => {
  // TODO: replace with scheduler that supports async such as Bree
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  schedule('* * * * *', async () => {
    console.log(new Date())
    console.log('Checking for arrival aircraft on vAMSYS...')
    const data = (await axios.get(vAmsysMapUri)).data as VaFlightInfo[]
    const flights = data.filter(
      (flight) =>
        flightArrivingSoon(flight) && !arrInfoSentCache.get(flight.callsign)
    )

    console.log(
      `${data.length} flights found, ${flights.length} eligible arriving flights found.`
    )

    return Promise.all(
      flights.map(async (flight) => {
        arrInfoSentCache.set(flight.callsign, true)
        const arrivalInfo = getArrivalInfo({
          arr: flight.arrival.icao,
          dep: flight.departure.icao,
          callsign: flight.callsign,
        })
        console.log(`Sending arrival info to ${flight.callsign}.`)
        await axios.post(
          hoppieString(
            HoppieType.telex,
            arrivalInfo,
            flight.callsign
          )
        )
      })
    )
  })
}

// Auto send arrival info per hoppie
export const cron = () => {
  // TODO: replace with scheduler that supports async such as Bree
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  schedule('* * * * *', async () => {
    console.log('Looking For Aircraft Approaching TOD')

    const pendingMessages = (await axios.get(hoppieString())).data as string
    const pendingEtaMessages = hoppieParse(pendingMessages).filter(
      ({ type, message }) =>
        type === HoppieType.progress && message.includes('ETA/')
    )

    if (pendingEtaMessages.length === 0) {
      return console.log('No Aircraft Approaching TOD')
    }

    console.log('ETAs found:', pendingEtaMessages)

    return pendingEtaMessages
      .filter(({ from: callsign }) => !arrInfoSentCache.get(callsign))
      .map(async ({ from: callsign, message }) => {
        arrInfoSentCache.set(callsign, true)
        const [, dep, arr] = [...message.matchAll(/^(\w{4})\/(\w{4})/g)][0]
        const flightInfo = {
          callsign,
          dep,
          arr,
        }

        const arrivalInfo = getArrivalInfo(flightInfo)
        const hString = hoppieString(
          HoppieType.telex,
          arrivalInfo,
          flightInfo.callsign
        )
        console.log(`Sending telex to ${flightInfo.callsign}.`)
        await axios.post(hString)
        return
      })
  })
}
