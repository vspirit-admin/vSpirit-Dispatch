import { findStationByIcao } from './data/stations'
import getGate, { Station } from './getGate'
import { log } from './log'
import { GateRepository } from './repositories/GateRepository'
import { VaKey } from './types'

interface FlightInfo {
  arr: string
  dep: string
  callsign: string,
  type: string,
}
/**
 * Generates an arrival message string from the given flight info.
 *
 * @param flightInfo
 * @param vaKeyParam
 */
const getArrivalInfo = async (
  flightInfo: FlightInfo,
  vaKeyParam?: VaKey
): Promise<string> => {
  const vaKey = vaKeyParam ?? 'NKS';

  let station: Station | null | undefined
  if (vaKey == 'NKS') {
    station = findStationByIcao(flightInfo.arr, vaKey)
  } else {
    station = await getStationByIcaoAndType(vaKey, flightInfo.arr, flightInfo.type);
  }

  const isIntl = !flightInfo.dep.startsWith(flightInfo.arr[0])
  const gate = station ? await getGate(station, isIntl, vaKey) : null

  const callsignFormatted = flightInfo.callsign.replace(/\D/g, '')

  const arrivalInfo = [
    `***AUTOMATED UPLINK***`,
    `GATE ASSIGNMENT FOR`,
    `FLIGHT ${callsignFormatted}`,
    `ARRIVING ${flightInfo.arr} IS ${gate?.gateNumber ?? 'UNKNOWN'}`,
    `GROUND POWER: YES`,
    `GROUND AIR: YES`,
    `OPS FREQ: ${station?.opsFreq ?? 'NONE'}`,
    `MESSAGE: KEEP APU`,
    `SHUTDOWN WHEN ABLE`,
  ]

  const footerKey = `${vaKey}_FOOTER`;
  if (process.env[footerKey]) {
    arrivalInfo.push(...(process.env[footerKey] as unknown as string).split("\n"))
  }

  // The PMDG B77W doesn't currently support newlines in Hoppie messages. Use padding instead.
  if (flightInfo.type == 'B77W') {
    const paddedArrivalInfo = arrivalInfo.map((s: string) => s.padEnd(parseInt(process.env.PMDG_B77W_PAD as string), ' '));
    return paddedArrivalInfo.join('').toUpperCase();
  }

  return arrivalInfo.join('\n').toUpperCase()
}

const getStationByIcaoAndType = async (vaKey: VaKey, icao: string, type: string): Promise<Station | undefined> => {
  const gates = await GateRepository.findByIcaoAndType(vaKey, icao, type);

  if(gates.length == 0 || !gates[0].frequency) return;

  return {
    icao: icao,
    acars: true,
    opsFreq: gates[0].frequency.frequency,
    gates: gates.map((gate) => {
      return {
        gateNumber: gate.gate,
        isIntl: gate.isIntl
      }
    })
  } as Station;

}

export default getArrivalInfo;
