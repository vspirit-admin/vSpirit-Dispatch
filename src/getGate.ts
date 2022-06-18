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

  const assignedGateNumbers: string[] = arrGatesAssigned.get(icao) ?? []
  const airportGates: Gate[] = gates.filter((gate) => gate.icao === icao)

  if (airportGates.length === 0) {
    gateLogger.warn(`No gate found at ${icao}.`)
    return null
  }

  const possibleGatesByInternational = airportGates.filter(
    (gate) => gate.international === international
  )
  const possibleGatesByAlreadyAssigned = airportGates.filter(
    (gate) => !assignedGateNumbers.includes(gate.gate_number)
  )

  let possibleGates = _.unionBy(
    possibleGatesByInternational,
    possibleGatesByAlreadyAssigned,
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

  assignedGateNumbers.push(chosenGateNumber)
  arrGatesAssigned.set(icao, assignedGateNumbers)
  gateLogger.info(`Assigning gate ${chosenGateNumber} at ${icao}.`)

  return chosenGateNumber
}

export default getGate
