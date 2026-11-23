import { correlationMiddleware } from '../../../src/infrastructure/http/correlation-id.middleware';
import { correlationStorage } from '../../../src/infrastructure/logging/logger';

describe('correlationMiddleware', () => {
  it('reuses a header and generates one when it is absent', () => {
    const seen: string[] = [];
    const request = {
      header(name: string) {
        return name === 'x-correlation-id' ? 'abc-123' : undefined;
      },
    };
    const response = {
      setHeader(_name: string, value: string) {
        seen.push(value);
      },
    };
    correlationMiddleware(request as never, response as never, () => {
      expect(correlationStorage.getStore()).toBe('abc-123');
    });
    expect(seen).toEqual(['abc-123']);

    const generated: string[] = [];
    correlationMiddleware(
      { header: () => '   ' } as never,
      {
        setHeader: (_name: string, value: string) => generated.push(value),
      } as never,
      () => undefined,
    );
    expect(generated[0]?.length).toBeGreaterThan(0);
  });
});
