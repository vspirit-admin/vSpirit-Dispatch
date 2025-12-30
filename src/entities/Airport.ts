import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { AirportFrequency } from './AirportFrequency.js'

@Entity('airports')
export class Airport {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  icao: string

  @OneToMany(
    () => AirportFrequency,
    (aF) => aF.airport
  )
  frequencies: AirportFrequency[]
}