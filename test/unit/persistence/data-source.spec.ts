import { postgresOptions } from '../../../src/infrastructure/persistence/data-source';

describe('postgresOptions', () => {
  it('turns sslmode=require into an encrypted connection', () => {
    const options = postgresOptions(
      'postgresql://USER:PASSWORD@ep-young-surf-be3raf6k-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    );
    expect(options).toMatchObject({
      type: 'postgres',
      synchronize: false,
      migrationsRun: true,
      ssl: { rejectUnauthorized: false },
    });
  });

  it('leaves local connections without ssl', () => {
    const options = postgresOptions(
      'postgres://cocos:cocos@localhost:5432/cocos',
    );
    expect(options.type).toBe('postgres');
    if (options.type === 'postgres') {
      expect(options.ssl).toBeUndefined();
      expect(options.synchronize).toBe(false);
      expect(options.migrationsRun).toBe(true);
    }
  });
});
