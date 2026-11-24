import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('instruments_ticker_uidx', ['ticker'], { unique: true })
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
