import { Station } from '../getGate'
import stationsRaw from './stations.json'

const stations = stationsRaw as unknown as Station[]

export const findStationByIcao = (icao: string) =>
  stations.find((station) => station.icao === icao)
