import {
  localOrderAmountExample,
  localOrderExample,
  localOrderLimitExample,
} from '../../../src/infrastructure/http/openapi';
import { documentedApp, hasLocalExample, operation } from './openapi-support';

describe('OpenAPI local examples', () => {
  it('prefills portfolio, search, submit and cancel for the local data', async () => {
    const { app, document } = await documentedApp();
    const portfolio = operation(
      document,
      '/accounts/{accountNumber}/portfolio',
      'get',
    );
    const search = operation(document, '/instruments', 'get');
    const submit = operation(document, '/orders', 'post');
    const cancel = operation(
      document,
      '/orders/{orderId}/cancellation',
      'post',
    );

    expect(hasLocalExample(portfolio)).toBe(true);
    expect(hasLocalExample(search)).toBe(true);
    expect(hasLocalExample(submit)).toBe(true);
    expect(hasLocalExample(cancel)).toBe(true);
    expect(JSON.stringify(portfolio)).toContain('10001');
    expect(JSON.stringify(search)).toContain('teco');
    expect(JSON.stringify(submit)).toContain(localOrderExample.ticker);
    expect(JSON.stringify(submit)).toContain('"quantity":1');
    const requestBody = submit?.requestBody;
    const examples =
      requestBody && 'content' in requestBody
        ? requestBody.content?.['application/json']?.examples
        : undefined;
    const amountExample = examples?.localAmount;
    const limitExample = examples?.localLimit;
    expect(
      amountExample && 'value' in amountExample
        ? amountExample.value
        : undefined,
    ).toEqual(localOrderAmountExample);
    expect(
      limitExample && 'value' in limitExample ? limitExample.value : undefined,
    ).toEqual(localOrderLimitExample);
    expect(JSON.stringify(cancel)).toContain('"orderId"');
    expect(JSON.stringify(cancel)).toContain('5');
    await app.close();
  });
});
