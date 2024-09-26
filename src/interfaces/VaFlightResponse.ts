import VaFlightInfo from './VaFlightInfo'

export default interface VaFlightResponse {
  status: string,
  request: object,
  data: {
    flights: VaFlightInfo[],
    total: number,
    generatedAt: string,
  }
}
