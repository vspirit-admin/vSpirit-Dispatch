import _ from 'lodash'
import filterAsync from 'node-filter-async'
import { log } from './log'

import { nksTTLCache } from './cache/caches'

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
const getGate = async (station: Station, international: boolean): Promise<Gate | null> => {
  const gateNumbersAlreadyAssigned = (await filterAsync(station.gates, async ({ gateNumber }) => {
    const gateCacheString = `${station.icao}:${gateNumber}`.toUpperCase()
    const isCached = await nksTTLCache.getGetAssigned(gateCacheString);
    return !!isCached;
  })).map(({ gateNumber }) => gateNumber);

  if (station.gates.length === 0) {
    log.warn(`No gate found at ${station.icao}.`)
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
    const gateCacheString = `${station.icao}:${chosenGate.gateNumber}`.toUpperCase()
    await nksTTLCache.setGateAssigned(gateCacheString, 'true');

    log.info(`Assigning gate ${chosenGate.gateNumber} at ${station.icao}.`)
  } else {
    log.info(`No gates found for ${station.icao}.`)
  }

  return chosenGate ?? null
}

export default getGate
