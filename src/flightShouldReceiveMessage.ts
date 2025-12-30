import type VaFlightInfo from './interfaces/VaFlightInfo.ts'
import { aalPilots } from './config.js'
import { log } from './log.js'
import { type VaKey } from './types.js'

export const flightShouldReceiveMessage = (
  flight: VaFlightInfo,
  vaKey: VaKey
) => {
  if (vaKey == 'AAL') {
    const username = flight.pilot.username;
    const callsign = flight.booking.callsign;
    if (aalPilots.length && !aalPilots.includes(username)) {
      if (process.env.DEV_MODE?.toLowerCase() === 'true') {
        log.debug(
          `Would have dropped message for pilot ${username} on flight ${callsign}`
        )
        return true
      }

      log.debug(
        `Allowlist: Dropping message for ${username} on flight ${callsign}`
      )
      return false
    }

    if (['ROA', 'TWA', 'PSA', 'AWE', 'ACL', 'USA'].includes(callsign.substring(0, 3))) {
      log.debug(
        `Non AAL: Dropping message for ${username} on flight ${callsign}`
      )
      return false
    }
  }

  const distanceRemaining = flight.progress.distanceRemaining;
  const groundSpeed = flight.progress.groundSpeed;

  log.debug(`dist: ${distanceRemaining}, gs: ${groundSpeed}`);

  const flightShouldReceiveMessage = distanceRemaining <= 225 && groundSpeed >= 250;
  log.debug(`${flight.booking.callsign} should receive message: `, flightShouldReceiveMessage);


  return flightShouldReceiveMessage;
}
