import { findStationByIcao } from './data/stations'
import getGate from './getGate'
import { VaKey } from './types'

/**
 * Generates an arrival message string from the given flight info.
 *
 * @param flightInfo
 * @param vaKeyParam
 */
const getArrivalInfo = async (flightInfo: {
  arr: string
  dep: string
  callsign: string,
},
                              vaKeyParam?: VaKey
): Promise<string> => {
  const vaKey = vaKeyParam ?? 'NKS';
  const station = findStationByIcao(flightInfo.arr, vaKey)
  const isIntl = !flightInfo.dep.startsWith(flightInfo.arr[0])
  const gate = station ? await getGate(station, isIntl, vaKey) : null

  const callsignFormatted = flightInfo.callsign.replace(/\D/g, '')

  const arrivalInfo = [
    `***AUTOMATED UPLINK***`,
    `GATE ASSIGNMENT FOR`,
    `FLIGHT ${callsignFormatted}`,
    `ARRIVING ${flightInfo.arr} IS ${gate?.gateNumber ?? 'UNKNOWN'}`,
    //`GROUND POWER: ${gate ? 'YES' : 'UNKNOWN'}`,
    //`GROUND AIR: ${gate ? 'YES' : 'UNKNOWN'}`,
    `GROUND POWER: YES`,
    `GROUND AIR: YES`,
    `OPS FREQ: ${station?.opsFreq ?? 'NONE'}`,
    `MESSAGE: KEEP APU`,
    `SHUTDOWN WHEN ABLE`,
  ]

  const footerKey = `${vaKey}_FOOTER`;
  if (process.env[footerKey]) {
    arrivalInfo.push(process.env[footerKey] as unknown as string)
  }

  return arrivalInfo.join('\n').toUpperCase()
}

export default getArrivalInfo
