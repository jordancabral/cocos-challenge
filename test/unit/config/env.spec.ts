import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnv } from '../../../src/infrastructure/config/env';

describe('loadEnv', () => {
  it('reads the database url and defaults the port', () => {
    expect(
      loadEnv({ DATABASE_URL: 'postgres://cocos:cocos@localhost:5432/cocos' }),
    ).toEqual({
      DATABASE_URL: 'postgres://cocos:cocos@localhost:5432/cocos',
      PORT: 3000,
    });
  });

  it('rejects a missing database url', () => {
    expect(() => loadEnv({})).toThrow();
  });

  it('fills empty keys from a dotenv file and keeps values already set', () => {
    const directory = mkdtempSync(join(tmpdir(), 'cocos-env-'));
    const envPath = join(directory, '.env');
    writeFileSync(
      envPath,
      [
        '# comment',
        'DATABASE_URL=postgresql://USER:PASSWORD@ep-young-surf-be3raf6k-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require',
        'PORT=3000',
        '',
      ].join('\n'),
    );
    const source: NodeJS.ProcessEnv = { PORT: '4000' };

    expect(loadEnv(source, envPath)).toEqual({
      DATABASE_URL:
        'postgresql://USER:PASSWORD@ep-young-surf-be3raf6k-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require',
      PORT: 4000,
    });
  });
});
