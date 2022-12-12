import { Station } from '../getGate'
import { VaKey } from '../types'
import stationsRaw from './stations_raw.json'

type Gateabase = Record<string, Station[]>;
const stations = stationsRaw as unknown as Gateabase;

export const findStationByIcao = (icao: string, vaKeyParam?: VaKey) => {
  const vaKey = vaKeyParam ?? 'NKS';
  if (!(vaKey in stations)) return null;
  return stations[vaKey].find((station: Station) => station.icao === icao)
}

