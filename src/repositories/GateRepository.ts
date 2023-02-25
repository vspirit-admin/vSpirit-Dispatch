import { GateabaseDataSource } from '../db'
import { Gate } from '../entities'
import { Airport } from '../entities/Airport'
import { VaKey } from '../types'

export const GateRepository = GateabaseDataSource.getRepository(Gate).extend({
  findByIcaoAndType(vaKey: VaKey, icao: string, type: string) {
    return this.createQueryBuilder('gate')
      .distinct()
      .innerJoin(
        'gate_aircraft_category',
        'gac',
        'gate.id = gac.gate_id'
      )
      .innerJoin(
        'aircraft',
        'a',
        'gac.aircraft_category_id = a.aircraft_category_id'
      )
      .innerJoin(
        Airport,
        'ap',
        'gate.airport_id = ap.id'
      )
      .innerJoin(
        'va_keys',
        'va',
        'gate.va_key_id=va.id'
      )
      .leftJoinAndMapOne(
        'gate.frequency',
        'gate.frequency',
        'af',
        'gate.airport_frequency_id=af.id'
      )
      .where('va.slug = :vaKey', { vaKey: vaKey})
      .andWhere('a.type = :type', { type: type})
      .andWhere('ap.icao = :icao', { icao: icao})
      .orderBy('gate.gate')
      .getMany();
  },
});