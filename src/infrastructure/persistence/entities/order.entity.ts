import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('orders_userid_idx', ['userId'])
@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'instrumentid', type: 'int' })
  instrumentId!: number;

  @Column({ name: 'userid', type: 'int' })
  userId!: number;

  @Column({ type: 'int' })
  size!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: string;

  @Column({ name: 'type', type: 'varchar' })
  orderType!: string;

  @Column({ type: 'varchar' })
  side!: string;

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ type: 'timestamp' })
  datetime!: Date;
}
