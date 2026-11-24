import { documentedApp, operation } from './openapi-support';

const orderFields = [
  'id',
  'accountNumber',
  'ticker',
  'side',
  'type',
  'quantity',
  'price',
  'status',
];

describe('POST /orders contract', () => {
  it('references the full Order schema on 201', async () => {
    const { app, document } = await documentedApp();
    const created = operation(document, '/orders', 'post')?.responses?.['201'];
    const schema =
      created && 'content' in created
        ? created.content?.['application/json']?.schema
        : undefined;

    expect(schema).toEqual({ $ref: '#/components/schemas/Order' });

    const order = document.components?.schemas?.Order;
    expect(order).toEqual(
      expect.objectContaining({
        type: 'object',
        required: expect.arrayContaining(orderFields),
      }),
    );
    if (order && 'properties' in order) {
      expect(Object.keys(order.properties ?? {}).sort()).toEqual(
        [...orderFields].sort(),
      );
      expect(order.properties?.price).toEqual(
        expect.objectContaining({
          type: 'string',
          pattern: '^-?\\d+\\.\\d{2}$',
        }),
      );
    }

    await app.close();
  });
});
