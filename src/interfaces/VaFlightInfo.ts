import type VaAircraftInfo from './VaAircraftInfo.ts'
import type VaAirportInfo from './VaAirportInfo.ts'
import type VaBookingInfo from './VaBookingInfo.ts'
import type VaFlightProgress from './VaFlightProgress.ts'
import type VaPilotInfo from './VaPilotInfo.ts'

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
