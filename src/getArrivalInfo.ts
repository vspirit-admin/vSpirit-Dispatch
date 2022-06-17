import gates from './data/gates'

interface Gate {
  icao: string
  gate_number: string
  international: boolean
}

/**
 * Retrieves a valid gate for the given airport and international status
 * @param airport 4 Letter ICAO airport code
 * @param international If the flight is international or not
 * @returns Gate object or null if not found
 */
const getGate = (airport: string, international: boolean): Gate | null => {
  if (airport.length !== 4) {
    throw new Error('Invalid airport code')
  }

  let possibleGates: Gate[] = gates.filter(
    (gate) => gate.icao === airport && gate.international === international
  )

  if (possibleGates.length === 0) {
    possibleGates = gates.filter((gate) => gate.icao === airport)

    if (possibleGates.length === 0) {
      return null
    }
  }

  return possibleGates[Math.floor(Math.random() * possibleGates.length)] ?? null
}

const getArrivalInfo = (flightInfo: {
  arr: string
  dep: string
  callsign: string
}): string[] => {
  const gate = getGate(
    flightInfo.arr,
    !flightInfo.dep.toUpperCase().startsWith('K')
  )

  // const arrivalWeather = await axios.get(`https://avwx.rest/api/metar/${flightInfo.arr}?`, {
  //     headers: {
  //         Authorization: `Bearer ${process.env.AVWX_KEY}`
  //     }
  // })

  return [
    `***AUTOMATED UPLINK***`,
    `GATE ASSIGNMENT FOR`,
    `FLIGHT ${flightInfo.callsign}`,
    `ARRIVING ${flightInfo.arr} IS ${gate?.gate_number ?? 'UNKN'}`,
    `GROUND POWER: YES`,
    `GROUND AIR: YES`,
    `OPS FREQ: NONE`,
    `MESSAGE: KEEP APU`,
    `SHUTDOWN WHEN ABLE`,
  ]
}

export default getArrivalInfo
