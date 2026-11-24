import { MigrationInterface, QueryRunner } from 'typeorm';

export class LookupIndexes1732464000000 implements MigrationInterface {
  name = 'LookupIndexes1732464000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS users_accountnumber_uidx ON users (accountnumber)',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS instruments_ticker_uidx ON instruments (ticker)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS orders_userid_idx ON orders (userid)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS marketdata_instrumentid_idx ON marketdata (instrumentid)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS marketdata_instrumentid_idx');
    await queryRunner.query('DROP INDEX IF EXISTS orders_userid_idx');
    await queryRunner.query('DROP INDEX IF EXISTS instruments_ticker_uidx');
    await queryRunner.query('DROP INDEX IF EXISTS users_accountnumber_uidx');
  }
}
