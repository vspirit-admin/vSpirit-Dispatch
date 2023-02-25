import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Airport } from './Airport'

@Entity('airport_frequencies')
export class AirportFrequency {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  frequency: string

  @Column()
  type: number

  @ManyToOne(
    () => Airport,
    (airport) => airport.frequencies
  )
  @JoinColumn({
    name: 'airport_id'
  })
  airport: Airport
}