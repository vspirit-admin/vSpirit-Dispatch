import getGate from './getGate'

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
