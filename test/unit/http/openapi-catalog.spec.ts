import { moneySchema } from '../../../src/infrastructure/http/openapi';
import { documentedApp, operation } from './openapi-support';

describe('OpenAPI catalog', () => {
  it('lists the public operations and money as text with centavos', async () => {
    const { app, document } = await documentedApp();
    const paths = Object.keys(document.paths ?? {});
    expect(paths).toEqual(
      expect.arrayContaining([
        '/health',
        '/accounts/{accountNumber}/portfolio',
        '/instruments',
        '/orders',
        '/orders/{orderId}/cancellation',
      ]),
    );
    expect(operation(document, '/health', 'get')).toBeDefined();
    expect(
      operation(document, '/accounts/{accountNumber}/portfolio', 'get'),
    ).toBeDefined();
    expect(operation(document, '/instruments', 'get')).toBeDefined();
    expect(operation(document, '/orders', 'post')).toBeDefined();
    expect(
      operation(document, '/orders/{orderId}/cancellation', 'post'),
    ).toBeDefined();
    expect(JSON.stringify(document)).toContain(
      JSON.stringify(moneySchema.pattern),
    );
    await app.close();
  });
});
