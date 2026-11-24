import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { Client } from 'pg';
import 'reflect-metadata';
import { createDataSource } from '../../src/infrastructure/persistence/data-source';

const exec = promisify(execFile);
const databaseUrl = 'postgres://cocos:cocos@127.0.0.1:54330/cocos';

type IndexRow = {
  indexname: string;
  indisunique: boolean;
  indexdef: string;
};

async function waitForPostgres(): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const client = new Client({ connectionString: databaseUrl });
    try {
      await client.connect();
      await client.end();
      return;
    } catch {
      await client.end().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error('PostgreSQL did not become ready');
}

async function withClient<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

async function readIndexes(names: string[]): Promise<IndexRow[]> {
  return withClient(async (client) => {
    const result = await client.query<IndexRow>(
      `SELECT c.relname AS indexname,
              i.indisunique,
              pg_get_indexdef(i.indexrelid) AS indexdef
       FROM pg_index i
       JOIN pg_class c ON c.oid = i.indexrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname = ANY($1::text[])
       ORDER BY c.relname`,
      [names],
    );
    return result.rows;
  });
}

async function reapplyMigrations(): Promise<void> {
  const dataSource = createDataSource(databaseUrl);
  await dataSource.initialize();
  try {
    await dataSource.query('DROP TABLE IF EXISTS migrations');
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
}

describe('lookup indexes', () => {
  beforeAll(async () => {
    await exec('docker', ['rm', '-f', 'cocos-pg-indexes']).catch(
      () => undefined,
    );
    await exec('docker', [
      'run',
      '-d',
      '--name',
      'cocos-pg-indexes',
      '-e',
      'POSTGRES_USER=cocos',
      '-e',
      'POSTGRES_PASSWORD=cocos',
      '-e',
      'POSTGRES_DB=cocos',
      '-p',
      '54330:5432',
      'postgres:16-alpine',
    ]);
    await waitForPostgres();
    await withClient(async (client) => {
      await client.query(readFileSync('db/database.sql', 'utf8'));
    });
  }, 120000);

  afterAll(async () => {
    await exec('docker', ['rm', '-f', 'cocos-pg-indexes']).catch(
      () => undefined,
    );
  });

  it('rejects a duplicate account number and ticker', async () => {
    const names = ['instruments_ticker_uidx', 'users_accountnumber_uidx'];
    const loaded = await readIndexes(names);
    expect(loaded).toEqual([
      expect.objectContaining({
        indexname: 'instruments_ticker_uidx',
        indisunique: true,
        indexdef: expect.stringContaining('(ticker)'),
      }),
      expect.objectContaining({
        indexname: 'users_accountnumber_uidx',
        indisunique: true,
        indexdef: expect.stringContaining('(accountnumber)'),
      }),
    ]);

    await withClient(async (client) => {
      await client.query('DROP INDEX IF EXISTS instruments_ticker_uidx');
      await client.query('DROP INDEX IF EXISTS users_accountnumber_uidx');
    });
    await reapplyMigrations();
    expect(await readIndexes(names)).toEqual(loaded);

    await withClient(async (client) => {
      const usersBefore = await client.query(
        `SELECT id, email FROM users WHERE accountnumber = '10001' ORDER BY id`,
      );
      await expect(
        client.query(
          `INSERT INTO users (email, accountnumber) VALUES ('dup@test.com', '10001')`,
        ),
      ).rejects.toMatchObject({ code: '23505' });
      const usersAfter = await client.query(
        `SELECT id, email FROM users WHERE accountnumber = '10001' ORDER BY id`,
      );
      expect(usersAfter.rows).toEqual(usersBefore.rows);
      expect(usersBefore.rows).toHaveLength(1);

      const instrumentsBefore = await client.query(
        `SELECT id, ticker, name FROM instruments WHERE ticker = 'GGAL' ORDER BY id`,
      );
      await expect(
        client.query(
          `INSERT INTO instruments (ticker, name, type) VALUES ('GGAL', 'Duplicate', 'ACCIONES')`,
        ),
      ).rejects.toMatchObject({ code: '23505' });
      const instrumentsAfter = await client.query(
        `SELECT id, ticker, name FROM instruments WHERE ticker = 'GGAL' ORDER BY id`,
      );
      expect(instrumentsAfter.rows).toEqual(instrumentsBefore.rows);
      expect(instrumentsBefore.rows).toHaveLength(1);
    });
  });

  it('scopes orders by account and prices by instrument', async () => {
    const names = ['marketdata_instrumentid_idx', 'orders_userid_idx'];
    const loaded = await readIndexes(names);
    expect(loaded).toEqual([
      expect.objectContaining({
        indexname: 'marketdata_instrumentid_idx',
        indisunique: false,
        indexdef: expect.stringContaining('(instrumentid)'),
      }),
      expect.objectContaining({
        indexname: 'orders_userid_idx',
        indisunique: false,
        indexdef: expect.stringContaining('(userid)'),
      }),
    ]);
    expect(loaded.map((index) => index.indexdef).join(' ')).not.toMatch(
      /date|name|status|side/i,
    );

    await withClient(async (client) => {
      await client.query('DROP INDEX IF EXISTS marketdata_instrumentid_idx');
      await client.query('DROP INDEX IF EXISTS orders_userid_idx');
    });
    await reapplyMigrations();
    expect(await readIndexes(names)).toEqual(loaded);

    await withClient(async (client) => {
      const orders = await client.query(
        'SELECT COUNT(*)::int AS count FROM orders WHERE userid = 1',
      );
      const prices = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM marketdata
         WHERE instrumentid = (SELECT id FROM instruments WHERE ticker = 'GGAL')`,
      );
      expect(orders.rows[0].count).toBeGreaterThan(1);
      expect(prices.rows[0].count).toBeGreaterThan(1);

      const forbidden = await client.query(
        `SELECT indexdef
         FROM pg_indexes
         WHERE schemaname = 'public'
           AND (
             indexdef ILIKE '%(name)%'
             OR indexdef ILIKE '%(status)%'
             OR indexdef ILIKE '%(side)%'
             OR (tablename = 'marketdata' AND indexdef ILIKE '%date%')
           )`,
      );
      expect(forbidden.rows).toEqual([]);
    });
  });
});
