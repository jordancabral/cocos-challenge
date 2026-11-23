import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { correlationStorage } from '../logging/logger';

export function correlationMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const header = request.header('x-correlation-id');
  const correlationId =
    header && header.trim().length > 0 ? header.trim() : randomUUID();
  response.setHeader('x-correlation-id', correlationId);
  correlationStorage.run(correlationId, () => next());
}
