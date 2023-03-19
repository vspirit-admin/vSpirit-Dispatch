import { VaFlightInfo } from './arrivalMessage'
import { aalPilots } from './config'
import { log } from './log'
import { VaKey } from './types'

export const flightShouldReceiveMessage = (
  {
    currentLocation: { distance_remaining, groundspeed },
    callsign,
    pilot,
  }: Pick<VaFlightInfo, 'callsign' | 'pilot'> & {
    currentLocation: Pick<
      VaFlightInfo['currentLocation'],
      'distance_remaining' | 'groundspeed'
    >
  },
  vaKey: VaKey
) => {
  if (vaKey == 'AAL') {
    if (!aalPilots.includes(pilot.username)) {
      if (process.env.DEV_MODE?.toLowerCase() === 'true') {
        log.debug(
          `Would have dropped message for pilot ${pilot.username} on flight ${callsign}`
        )
        return true
      }

      log.debug(
        `Whitelist: Dropping message for ${pilot.username} on flight ${callsign}`
      )
      return false
    }

    if (['ROA', 'TWA', 'PSA'].includes(callsign.substring(0, 3))) {
      log.debug(
        `Non AAL: Dropping message for ${pilot.username} on flight ${callsign}`
      )
      return false
    }
  }

  return distance_remaining <= 225 && groundspeed >= 250 // To prevent early gate assignments for short flights.
}
