import { readFileSync } from 'node:fs';
import { Client } from 'pg';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { noopLogger } from '../../src/application/logging/app-logger';
import { SubmitOrder } from '../../src/application/submit-order/submit-order';
import { createDataSource } from '../../src/infrastructure/persistence/data-source';
import { OrderUnitOfWorkAdapter } from '../../src/infrastructure/persistence/order-unit-of-work.adapter';

const exec = promisify(execFile);
const databaseUrl = 'postgres://cocos:cocos@127.0.0.1:54329/cocos';

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

describe('submit order against PostgreSQL', () => {
  const createdIds: number[] = [];

  beforeAll(async () => {
    await exec('docker', ['rm', '-f', 'cocos-pg-test']).catch(() => undefined);
    await exec('docker', [
      'run',
      '-d',
      '--name',
      'cocos-pg-test',
      '-e',
      'POSTGRES_USER=cocos',
      '-e',
      'POSTGRES_PASSWORD=cocos',
      '-e',
      'POSTGRES_DB=cocos',
      '-p',
      '54329:5432',
      'postgres:16-alpine',
    ]);
    await waitForPostgres();
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query(readFileSync('db/database.sql', 'utf8'));
    await client.end();
  }, 120000);

  afterAll(async () => {
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    if (createdIds.length > 0) {
      await client.query('DELETE FROM orders WHERE id = ANY($1::int[])', [
        createdIds,
      ]);
    }
    await client.end();
    await exec('docker', ['rm', '-f', 'cocos-pg-test']).catch(() => undefined);
  });

  it('fills, rejects, and reserves through the order function', async () => {
    const dataSource = createDataSource(databaseUrl);
    await dataSource.initialize();
    const submit = new SubmitOrder(
      new OrderUnitOfWorkAdapter(dataSource),
      noopLogger,
    );

    const filled = await submit.execute({
      accountNumber: '10001',
      ticker: 'GGAL',
      side: 'BUY',
      orderType: 'MARKET',
      quantity: 1,
    });
    createdIds.push(filled.id);
    expect(filled.status).toBe('FILLED');
    expect(filled.price).toMatch(/^\d+\.\d{2}$/);
    expect(filled.quantity).toBe(1);

    const rejected = await submit.execute({
      accountNumber: '10001',
      ticker: 'GGAL',
      side: 'SELL',
      orderType: 'MARKET',
      quantity: 1000000,
    });
    createdIds.push(rejected.id);
    expect(rejected.status).toBe('REJECTED');

    const pending = await submit.execute({
      accountNumber: '10001',
      ticker: 'GGAL',
      side: 'BUY',
      orderType: 'LIMIT',
      quantity: 1,
      limitPrice: '1.00',
    });
    createdIds.push(pending.id);
    expect(pending.status).toBe('NEW');
    expect(pending.price).toBe('1.00');

    await dataSource.destroy();
  });
});
