import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('marketdata_instrumentid_idx', ['instrumentId'])
@Entity({ name: 'marketdata' })
export class MarketDataEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'instrumentid', type: 'int' })
  instrumentId!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  high!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  low!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  open!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  close!: string;

  @Column({ name: 'previousclose', type: 'numeric', precision: 10, scale: 2 })
  previousClose!: string;

  @Column({ type: 'date' })
  date!: string;
}
