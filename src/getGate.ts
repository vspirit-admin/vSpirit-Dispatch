import _ from 'lodash'
import { Logger } from 'tslog'

import { arrGatesAssigned } from './caches'

const gateLogger = new Logger({ name: 'gateLogger' })

interface Gate {
  gateNumber: string
  isIntl: boolean
}

export interface Station {
  icao: string
  acars: boolean
  opsFreq: string
  gates: Gate[]
}

/**
 * Retrieves a valid gate for the given airport and international status
 *
 * @param station Station to choose a gate from
 * @param international Whether the flight is international and not domestic
 * @returns Gate object or null if not found
 */
const getGate = (station: Station, international: boolean): Gate | null => {
  const gateNumbersAlreadyAssigned = station.gates
    .filter(({ gateNumber }) =>
      arrGatesAssigned.get(`${station.icao}/${gateNumber}`.toUpperCase())
    )
    .map(({ gateNumber }) => gateNumber)

  if (station.gates.length === 0) {
    gateLogger.warn(`No gate found at ${station.icao}.`)
    return null
  }

  const possibleGatesByInternational = station.gates.filter(
    (gate) => gate.isIntl === international
  )
  const possibleGatesByAlreadyAssigned = station.gates.filter(
    (gate) => !gateNumbersAlreadyAssigned.includes(gate.gateNumber)
  )

  let possibleGates = _.unionBy(
    possibleGatesByAlreadyAssigned,
    possibleGatesByInternational,
    'gateNumber'
  )

  // If there is no union, prioritize stand availability over international gates.
  if (possibleGates.length === 0) {
    possibleGates =
      possibleGatesByAlreadyAssigned.length > 0
        ? possibleGatesByAlreadyAssigned
        : possibleGatesByInternational.length > 0
        ? possibleGatesByInternational
        : station.gates
  }

  const chosenGate =
    possibleGates[Math.floor(Math.random() * possibleGates.length)] as Gate | undefined

  if (chosenGate) {
    arrGatesAssigned.set(
      `${station.icao}/${chosenGate.gateNumber}`.toUpperCase(),
      true
    )
    gateLogger.info(`Assigning gate ${chosenGate.gateNumber} at ${station.icao}.`)
  } else {
    gateLogger.info(`No gates found for ${station.icao}.`)
  }

  return chosenGate ?? null
}

export default getGate
