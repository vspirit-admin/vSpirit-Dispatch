export default interface VaFlightProgress {
  routeDistance: number,
  distanceRemaining: number,
  departureTime: string,
  timeRemaining: string,
  estimatedArrivalTime: string,
  currentPhase: string,
  groundSpeed: number,
  magneticHeading: number,
  altitude: number,
  location: { // @todo
    lat: string,
    lon: string
  },
  posreps: object // @todo
}
