import { cloneDeep } from 'lodash'
import { aalPilots } from './config'
import { flightShouldReceiveMessage } from './flightShouldReceiveMessage'

const baseFlightInfo = {
  currentLocation: {
    groundspeed: 400,
    distance_remaining: 200,
  },
  callsign: 'AAL999',
  pilot: {
    username: 'AAL0001',
  },
}

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
    flightInfo.currentLocation.distance_remaining = 225
    expect(flightShouldReceiveMessage(flightInfo, 'AAL')).toBeTruthy()
  })

  test('it should not receive message over 225 distance', () => {
    const flightInfo = cloneDeep(baseFlightInfo)
    flightInfo.currentLocation.distance_remaining = 226
    expect(flightShouldReceiveMessage(flightInfo, 'AAL')).toBeFalsy()
  })
})

describe('groundspeed', () => {
  test('it should receive message over 250 groundspeed', () => {
    const flightInfo = cloneDeep(baseFlightInfo)
    flightInfo.currentLocation.groundspeed = 250
    expect(flightShouldReceiveMessage(flightInfo, 'AAL')).toBeTruthy()
  })

  test('it should not receive message below 250 groundspeed', () => {
    const flightInfo = cloneDeep(baseFlightInfo)
    flightInfo.currentLocation.groundspeed = 249
    expect(flightShouldReceiveMessage(flightInfo, 'AAL')).toBeFalsy()
  })
})

describe('callsign exclusions', () => {
  ;['ROA', 'TWA', 'PSA'].map((callsign) => {
    test(`it should not send for ${callsign}`, () => {
      const flightInfo = cloneDeep(baseFlightInfo)
      flightInfo.callsign = `${callsign}999`
      expect(flightShouldReceiveMessage(flightInfo, 'AAL')).toBeFalsy()
    })
  })
})

describe('whitelist', () => {
  const whitelistedPilot = 'AAL0002'
  beforeAll(() => aalPilots.push(whitelistedPilot))
  afterAll(() => aalPilots.pop())

  test('it should exclude pilots not on the whitelist', () => {
    expect(flightShouldReceiveMessage(baseFlightInfo, 'AAL')).toBeFalsy()
  })

  test('it should include pilots on the whitelist', () => {
    const flightInfo = cloneDeep(baseFlightInfo)
    flightInfo.pilot = { username: whitelistedPilot }
    expect(flightShouldReceiveMessage(baseFlightInfo, 'AAL')).toBeFalsy()
  })
})
