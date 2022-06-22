import _ from 'lodash'
import { Logger } from 'tslog'

import { arrGatesAssigned } from './caches'
import gates from './data/gates'

const gateLogger = new Logger({ name: 'gateLogger' })

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
const getGate = (icao: string, international: boolean): string | null => {
  if (icao.length !== 4) {
    gateLogger.error('Invalid ICAO:', icao)
    return null
  }

  const airportGates: Gate[] = gates.filter((gate) => gate.icao === icao)
  const gateNumbersAlreadyAssigned = airportGates
    .filter(({ gate_number }) =>
      arrGatesAssigned.get(`${icao}/${gate_number}`.toUpperCase())
    )
    .map(({ gate_number }) => gate_number)

  if (airportGates.length === 0) {
    gateLogger.warn(`No gate found at ${icao}.`)
    return null
  }

  const possibleGatesByInternational = airportGates.filter(
    (gate) => gate.international === international
  )
  const possibleGatesByAlreadyAssigned = airportGates.filter(
    (gate) => !gateNumbersAlreadyAssigned.includes(gate.gate_number)
  )

  let possibleGates = _.unionBy(
    possibleGatesByAlreadyAssigned,
    possibleGatesByInternational,
    'gate_number'
  )

  // If there is no union, prioritize stand availability over international gates.
  if (possibleGates.length === 0) {
    possibleGates =
      possibleGatesByAlreadyAssigned.length > 0
        ? possibleGatesByAlreadyAssigned
        : possibleGatesByInternational.length > 0
        ? possibleGatesByInternational
        : airportGates
  }

  const chosenGateNumber =
    possibleGates[Math.floor(Math.random() * possibleGates.length)].gate_number

  arrGatesAssigned.set(`${icao}/${chosenGateNumber}`.toUpperCase(), true)
  gateLogger.info(`Assigning gate ${chosenGateNumber} at ${icao}.`)

  return chosenGateNumber
}

export default getGate
