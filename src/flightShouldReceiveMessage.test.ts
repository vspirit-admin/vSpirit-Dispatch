import { cloneDeep } from 'lodash'
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

test('it should receive message', () => {
  expect(flightShouldReceiveMessage(baseFlightInfo, 'AAL')).toBeTruthy()
})

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
;['ROA', 'TWA', 'PSA'].map((callsign) => {
  test(`it should not send for ${callsign}`, () => {
    const flightInfo = cloneDeep(baseFlightInfo)
    flightInfo.callsign = `${callsign}999`
    expect(flightShouldReceiveMessage(flightInfo, 'AAL')).toBeFalsy()
  })
})
