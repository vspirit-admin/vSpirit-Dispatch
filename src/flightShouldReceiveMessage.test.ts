import _ from 'lodash'
import { aalPilots } from './config.js'
import { flightShouldReceiveMessage } from './flightShouldReceiveMessage.js'
import type VaFlightInfo from './interfaces/VaFlightInfo.ts'
import { log } from './log.js'

const { cloneDeep } = _;

log.info(process.env.NODE_ENV);

const baseFlightInfo = {
  progress: {
    groundSpeed: 400,
    distanceRemaining: 200,
  } satisfies Partial<VaFlightInfo['progress']>,
  pilot: {
    username: 'AAL0001',
  } satisfies Partial<VaFlightInfo['pilot']>,
  booking: {
    callsign: 'AAL999',
  } satisfies Partial<VaFlightInfo['booking']>
} as VaFlightInfo

/*
test.skip('skip', () => {
  return;
});
*/

beforeAll(() => {
  // ensure that environmental variables do not conflict with tests.
  aalPilots.length = 0
  process.env.DEV_MODE = 'false';
})

test('it should receive message', () => {
  expect(flightShouldReceiveMessage(baseFlightInfo, 'AAL')).toBeTruthy()
})

describe('distance', () => {
  test('it should receive message for exactly 225 distance', () => {
    const flightInfo = cloneDeep(baseFlightInfo)
    flightInfo.progress.distanceRemaining = 225
    expect(flightShouldReceiveMessage(flightInfo, 'AAL')).toBeTruthy()
  })

  test('it should not receive message over 225 distance', () => {
    const flightInfo = cloneDeep(baseFlightInfo)
    flightInfo.progress.distanceRemaining = 226
    expect(flightShouldReceiveMessage(flightInfo, 'AAL')).toBeFalsy()
  })
})

describe('groundspeed', () => {
  test('it should receive message over 250 groundspeed', () => {
    const flightInfo = cloneDeep(baseFlightInfo)
    flightInfo.progress.groundSpeed = 250
    expect(flightShouldReceiveMessage(flightInfo, 'AAL')).toBeTruthy()
  })

  test('it should not receive message below 250 groundspeed', () => {
    const flightInfo = cloneDeep(baseFlightInfo)
    flightInfo.progress.groundSpeed = 249
    expect(flightShouldReceiveMessage(flightInfo, 'AAL')).toBeFalsy()
  })
})

describe('callsign exclusions', () => {
  ;['ROA', 'TWA', 'PSA'].map((callsign) => {
    test(`it should not send for ${callsign}`, () => {
      const flightInfo = cloneDeep(baseFlightInfo)
      flightInfo.booking.callsign = `${callsign}999`
      expect(flightShouldReceiveMessage(flightInfo, 'AAL')).toBeFalsy()
    })
  })
})

describe('allowlist', () => {
  const allowlistedPilot = 'AAL0002'
  beforeAll(() => aalPilots.push(allowlistedPilot))
  afterAll(() => aalPilots.pop())

  test('it should exclude pilots not on the allowlist', () => {
    expect(flightShouldReceiveMessage(baseFlightInfo, 'AAL')).toBeFalsy()
  })

  test('it should include pilots on the allowlist', () => {
    const flightInfo = cloneDeep(baseFlightInfo)
    flightInfo.pilot.username = allowlistedPilot
    expect(flightShouldReceiveMessage(flightInfo, 'AAL')).toBeTruthy()
  })
})
