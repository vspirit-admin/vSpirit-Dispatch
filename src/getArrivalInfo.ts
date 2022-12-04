import { findStationByIcao } from './data/stations'
import getGate from './getGate'

/**
 * Generates an arrival message string from the given flight info.
 *
 * @param flightInfo
 */
const getArrivalInfo = async (flightInfo: {
  arr: string
  dep: string
  callsign: string
}): Promise<string> => {
  const station = findStationByIcao(flightInfo.arr)
  const isIntl = !flightInfo.dep.startsWith(flightInfo.arr[0])
  const gate = station ? await getGate(station, isIntl) : null

  const callsignFormatted = flightInfo.callsign.replace(/\D/g, '')

  const arrivalInfo = [
    `***AUTOMATED UPLINK***`,
    `GATE ASSIGNMENT FOR`,
    `FLIGHT ${callsignFormatted}`,
    `ARRIVING ${flightInfo.arr} IS ${gate?.gateNumber ?? 'UNKNOWN'}`,
    `GROUND POWER: ${gate ? 'YES' : 'UNKNOWN'}`,
    `GROUND AIR: ${gate ? 'YES' : 'UNKNOWN'}`,
    `OPS FREQ: ${station?.opsFreq ?? 'NONE'}`,
    `MESSAGE: KEEP APU`,
    `SHUTDOWN WHEN ABLE`,
  ]

  if (process.env.FOOTER) {
    arrivalInfo.push(process.env.FOOTER)
  }

  return arrivalInfo.join('\n').toUpperCase()
}

export default getArrivalInfo
