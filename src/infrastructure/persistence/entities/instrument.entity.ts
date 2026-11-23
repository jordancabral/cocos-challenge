import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'instruments' })
export class InstrumentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  ticker!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  type!: string;
}
