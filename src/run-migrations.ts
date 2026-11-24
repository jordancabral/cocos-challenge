import 'reflect-metadata';
import { loadEnv } from './infrastructure/config/env';
import { createDataSource } from './infrastructure/persistence/data-source';

async function main(): Promise<void> {
  const env = loadEnv();
  const dataSource = createDataSource(env.DATABASE_URL);
  await dataSource.initialize();
  try {
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
}

void main();
