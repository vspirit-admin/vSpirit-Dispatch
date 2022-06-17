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

export default getGate
