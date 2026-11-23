import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';
import {
  ConflictError,
  InvalidRequestError,
  NotFoundError,
} from '../../application/errors';

export function toHttpError(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof ZodError) {
    return {
      status: 400,
      message: error.issues[0]?.message ?? 'Invalid request',
    };
  }
  if (error instanceof InvalidRequestError) {
    return { status: 400, message: error.message };
  }
  if (error instanceof NotFoundError) {
    return { status: 404, message: error.message };
  }
  if (error instanceof ConflictError) {
    return { status: 409, message: error.message };
  }
  return { status: 500, message: 'Unexpected error' };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = toHttpError(error);
    response.status(mapped.status).json({ message: mapped.message });
  }
}
