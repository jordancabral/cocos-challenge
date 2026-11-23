import { ZodError } from 'zod';
import {
  ConflictError,
  InvalidRequestError,
  NotFoundError,
} from '../../../src/application/errors';
import { toHttpError } from '../../../src/infrastructure/http/http-exception.filter';

describe('toHttpError', () => {
  it('maps request, missing and illegal-state errors', () => {
    expect(toHttpError(new InvalidRequestError('bad'))).toEqual({
      status: 400,
      message: 'bad',
    });
    expect(toHttpError(new NotFoundError('missing'))).toEqual({
      status: 404,
      message: 'missing',
    });
    expect(toHttpError(new ConflictError('busy'))).toEqual({
      status: 409,
      message: 'busy',
    });
    expect(toHttpError(new ZodError([]))).toEqual({
      status: 400,
      message: 'Invalid request',
    });
    expect(toHttpError(new Error('boom'))).toEqual({
      status: 500,
      message: 'Unexpected error',
    });
  });
});
