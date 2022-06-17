import { schedule } from 'node-cron'
import axios from 'axios'
import NodeCache from 'node-cache'

import getArrivalInfo from './getArrivalInfo'
import { hoppieParse, hoppieString, HoppieType } from './hoppie'

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

const arrInfoSentCache = new NodeCache({ stdTTL: 3600 }) // 1 hour TTL

const flightArrivingSoon = ({ currentLocation }: VaFlightInfo) =>
  currentLocation.groundspeed >= 250 &&
  currentLocation.distance_remaining <= 225

// Auto send arrival info per vAMSYS info
export const cron2 = () => {
  // TODO: replace with scheduler that supports async such as Bree
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  schedule('* * * * *', async () => {
    console.log('Checking for arrival aircraft on vAMSYS')
    const res = await axios.get(vAmsysMapUri)
    const data = res.data as VaFlightInfo[]
    return Promise.all(
      data.map(async (flight) => {
        if (
          !flightArrivingSoon(flight) ||
          arrInfoSentCache.get(flight.callsign)
        ) {
          console.log('No flights found')
          return
        }

        const arrivalInfo = getArrivalInfo({
          arr: flight.arrival.icao,
          dep: flight.arrival.icao,
          callsign: flight.callsign,
        })
        console.log('Sending arrival info to', flight.callsign)
        await axios.post(
          hoppieString(
            HoppieType.telex,
            arrivalInfo.join('\n'),
            flight.callsign
          )
        )
        arrInfoSentCache.set(flight.callsign, true)
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
      .map(async ({ from, message }) => {
        const [, dep, arr] = [...message.matchAll(/^(\w{4})\/(\w{4})/g)][0]
        const flightInfo = {
          callsign: from,
          dep,
          arr,
        }

        const arrivalInfo = getArrivalInfo(flightInfo)
        if (process.env.FOOTER) {
          arrivalInfo.push(process.env.FOOTER)
        }

        const hString = hoppieString(
          HoppieType.telex,
          arrivalInfo.join('\n').toUpperCase(),
          flightInfo.callsign
        )
        console.log(`Sending telex to ${flightInfo.callsign}:`, arrivalInfo)
        await axios.post(hString)
        return
      })
  })
}
