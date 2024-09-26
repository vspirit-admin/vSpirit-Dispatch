export default interface VaAirportInfo {
  name: string,
  icao: string,
  iata: string,
  identifiers: string,
  identifier: string,
  lat: number,
  lon: number,
  country: {
    name: string,
    code: string,
  }
}
