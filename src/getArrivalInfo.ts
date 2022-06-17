import _ from 'lodash'

import { arrGatesAssigned } from './caches'
import gates from './data/gates'

interface Gate {
  icao: string
  gate_number: string
  international: boolean
}

/**
 * Retrieves a valid gate for the given airport and international status
 *
 * @param icao 4-letter ICAO airport code
 * @param international Whether the flight is international and not domestic
 * @returns Gate object or null if not found
 */
const getGate = (icao: string, international: boolean): Gate | null => {
  if (icao.length !== 4) {
    throw new Error('Invalid airport code')
  }

  const assignedGates: string[] = arrGatesAssigned.get(icao) ?? []
  const airportGates: Gate[] = gates.filter((gate) => gate.icao === icao)

  if (airportGates.length === 0) {
    return null
  }

  const possibleGatesByInternational = airportGates.filter(
    (gate) => gate.international === international
  )
  const possibleGatesByAlreadyAssigned = airportGates.filter(
    (gate) => !assignedGates.includes(gate.gate_number)
  )

  let possibleGates = _.unionBy(
    possibleGatesByInternational,
    possibleGatesByAlreadyAssigned,
    'gate_number'
  )

  if (possibleGates.length === 0) {
    possibleGates = airportGates
  }

  const chosenGate =
    possibleGates[Math.floor(Math.random() * possibleGates.length)]
  assignedGates.push(chosenGate.gate_number)

  arrGatesAssigned.set(icao, assignedGates)
  console.log(`Assigning gate ${chosenGate.gate_number} at ${icao}.`)

  return chosenGate
}

/**
 * Generates an arrival message string from the given flight info.
 *
 * @param flightInfo
 */
const getArrivalInfo = (flightInfo: {
  arr: string
  dep: string
  callsign: string
}): string => {
  const gate = getGate(
    flightInfo.arr,
    !flightInfo.dep.startsWith(flightInfo.arr[0])
  )

  // const arrivalWeather = await axios.get(`https://avwx.rest/api/metar/${flightInfo.arr}?`, {
  //     headers: {
  //         Authorization: `Bearer ${process.env.AVWX_KEY}`
  //     }
  // })

  const callsignFormatted = flightInfo.callsign.replace(/\D/g, '')
  const gateNumber = gate?.gate_number

  const arrivalInfo = [
    `***AUTOMATED UPLINK***`,
    `GATE ASSIGNMENT FOR`,
    `FLIGHT ${callsignFormatted}`,
    `ARRIVING ${flightInfo.arr} IS ${gateNumber ?? 'UNKNOWN'}`,
    `GROUND POWER: ${gateNumber ? 'YES' : 'UNKNOWN'}`,
    `GROUND AIR: ${gateNumber ? 'YES' : 'UNKNOWN'}`,
    `OPS FREQ: NONE`,
    `MESSAGE: KEEP APU`,
    `SHUTDOWN WHEN ABLE`,
  ]

  if (process.env.FOOTER) {
    arrivalInfo.push(process.env.FOOTER)
  }

  return arrivalInfo.join('\n').toUpperCase()
}

export default getArrivalInfo
