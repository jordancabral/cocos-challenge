import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('users_accountnumber_uidx', ['accountNumber'], { unique: true })
@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  email!: string | null;

  @Column({ name: 'accountnumber', type: 'varchar' })
  accountNumber!: string;
}
