import VaAircraftInfo from './VaAircraftInfo'
import VaAirportInfo from './VaAirportInfo'
import VaBookingInfo from './VaBookingInfo'
import VaFlightProgress from './VaFlightProgress'
import VaPilotInfo from './VaPilotInfo'

export default interface VaFlightInfo {
  bookingId: number,
  phase: number,
  pilot: VaPilotInfo,
  booking: VaBookingInfo,
  aircraft: VaAircraftInfo,
  route: { userRoute: string, companyRoute: string }
  departureAirport: VaAirportInfo,
  arrivalAirport: VaAirportInfo,
  progress: VaFlightProgress,
}
