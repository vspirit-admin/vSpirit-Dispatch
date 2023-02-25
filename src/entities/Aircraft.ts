import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Aircraft {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  type: string

  @Column()
  aircraftCategoryId: number
}