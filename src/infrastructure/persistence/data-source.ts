import { DataSource, DataSourceOptions } from 'typeorm';
import { InstrumentEntity } from './entities/instrument.entity';
import { MarketDataEntity } from './entities/market-data.entity';
import { OrderEntity } from './entities/order.entity';
import { UserEntity } from './entities/user.entity';
import { persistenceMigrations } from './migrations';

export const persistenceEntities = [
  UserEntity,
  InstrumentEntity,
  OrderEntity,
  MarketDataEntity,
];

export function postgresOptions(databaseUrl: string): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl,
    entities: persistenceEntities,
    migrations: persistenceMigrations,
    migrationsRun: true,
    synchronize: false,
    ssl: sslOptions(databaseUrl),
  };
}

export function createDataSource(databaseUrl: string): DataSource {
  return new DataSource(postgresOptions(databaseUrl));
}

function sslOptions(
  databaseUrl: string,
): { rejectUnauthorized: boolean } | undefined {
  try {
    const mode = new URL(databaseUrl).searchParams.get('sslmode');
    if (mode === 'require' || mode === 'prefer') {
      return { rejectUnauthorized: false };
    }
    if (mode === 'verify-ca' || mode === 'verify-full') {
      return { rejectUnauthorized: true };
    }
  } catch {
    return undefined;
  }
  return undefined;
}
