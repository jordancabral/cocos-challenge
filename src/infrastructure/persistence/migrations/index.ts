import type { MigrationInterface } from 'typeorm';
import { LookupIndexes1732464000000 } from './1732464000000-LookupIndexes';

export const persistenceMigrations: (new () => MigrationInterface)[] = [
  LookupIndexes1732464000000,
];
