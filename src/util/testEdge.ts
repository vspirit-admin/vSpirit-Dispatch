import axios from 'axios'
import _ from 'lodash'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import duration from 'dayjs/plugin/duration'

dayjs.extend(utc)
dayjs.extend(duration)

const api = axios.create({
  baseURL: 'https://aviation-edge.com/v2/public',
  params: {
    key: process.env.EDGE_API_KEY,
  },
})

interface EdgeRoute {
  arrivalIcao: string
  arrivalIata: string
  arrivalTime: string
  departureIcao: string
  departureIata: string
  departureTime: string
  flightNumber: string
  regNumber: string[]
}

interface EdgeFlight {
  type: string
  status: string
  departure: {
    icaoCode: string
    terminal: string
    gate: string
    scheduledTime: string
  }
  arrival: {
    icaoCode: string
    terminal: string
    gate: string
    scheduledTime: string
  }
  flight: {
    number: string
    icaoNumber: string
  }
}

interface Airport {
  icao: string
  iata: string
  gates: string[]
}

export const getRoutes = async () => {
  return (await api.get('/routes', { params: { airlineIata: 'NK' } }))
    .data as EdgeRoute[]
}

export const getAirportsFromEdgeRoutes = (routes: EdgeRoute[]): Airport[] =>
  _.uniqBy(
    routes.reduce((prev: Airport[], curr) => {
      prev.push(
        {
          icao: curr.arrivalIcao.toUpperCase(),
          iata: curr.arrivalIata.toUpperCase(),
          gates: [],
        },
        {
          icao: curr.departureIcao.toUpperCase(),
          iata: curr.departureIata.toUpperCase(),
          gates: [],
        }
      )
      return prev
    }, []),
    'iata'
  )

export const getEdgeFlightsByAirport = _.throttle(async (iata: string) => {
  const date = dayjs.utc().startOf('month').format('YYYY-MM-DD')
  return await Promise.all(
    ['arrival', 'departure'].map(
      async (type) =>
        (
          await api.get('/flightsHistory', {
            params: {
              airline_iata: 'NK',
              code: iata,
              date_from: date,
              type,
            },
          })
        ).data as EdgeFlight[]
    )
  )
}, dayjs.duration(5, 'second').asMilliseconds())

export const getEdgeFlights = async () => {
  const airports = getAirportsFromEdgeRoutes(await getRoutes())
  console.log('airports length:', airports.length)

  return await Promise.all(
    airports.map((airport, i) => {
      console.log(i)
      return getEdgeFlightsByAirport(airport.iata)
    })
  )
}
