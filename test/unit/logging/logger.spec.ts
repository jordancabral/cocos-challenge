import { Writable } from 'node:stream';
import {
  correlationStorage,
  createLogger,
} from '../../../src/infrastructure/logging/logger';

describe('createLogger', () => {
  it('writes JSON with the active correlation id', () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(chunk.toString());
        callback();
      },
    });
    const logger = createLogger(stream);
    correlationStorage.run('corr-1', () => {
      logger.info('portfolio consulted', { accountNumber: '10001' });
    });
    const entry = JSON.parse(lines[0] ?? '{}') as {
      correlationId: string;
      msg: string;
    };
    expect(entry.correlationId).toBe('corr-1');
    expect(entry.msg).toBe('portfolio consulted');
  });
});
