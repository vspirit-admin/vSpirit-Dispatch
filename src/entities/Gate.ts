import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { AirportFrequency } from './AirportFrequency'

@Entity('gates')
export class Gate {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  vaKeyId: number

  @Column()
  airportId: number

  @Column()
  gate: string

  @Column()
  isIntl: boolean

  @OneToOne(
    () => AirportFrequency
  )
  @JoinColumn({
    name: 'airport_frequency_id'
  })
  frequency?: AirportFrequency
}