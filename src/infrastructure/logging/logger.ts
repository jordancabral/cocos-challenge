import { AsyncLocalStorage } from 'node:async_hooks';
import pino, { DestinationStream } from 'pino';
import { AppLogger } from '../../application/logging/app-logger';

export const correlationStorage = new AsyncLocalStorage<string>();

export function createLogger(stream?: DestinationStream): AppLogger {
  const logger = pino({ base: undefined }, stream);
  return {
    info(message, fields) {
      logger.info(
        { correlationId: correlationStorage.getStore() ?? null, ...fields },
        message,
      );
    },
  };
}
