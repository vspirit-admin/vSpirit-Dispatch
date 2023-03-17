import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class AircraftCategory {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  slug: string
}