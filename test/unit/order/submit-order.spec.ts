import { NotFoundError } from '../../../src/application/errors';
import { noopLogger } from '../../../src/application/logging/app-logger';
import {
  TradingContext,
  UnitOfWork,
} from '../../../src/application/ports/unit-of-work';
import { SubmitOrder } from '../../../src/application/submit-order/submit-order';
import { Instrument } from '../../../src/domain/instrument/instrument';
import { Money } from '../../../src/domain/money/money';
import { StoredOrder } from '../../../src/domain/order/order';
import { decideSubmit } from '../../../src/domain/order/submit-order';

const teco: Instrument = {
  id: 7,
  ticker: 'TECO2',
  name: 'Telecom',
  type: 'ACCIONES',
};
const peso: Instrument = {
  id: 66,
  ticker: 'ARS',
  name: 'PESOS',
  type: 'MONEDA',
};

describe('decideSubmit', () => {
  const base = {
    instrument: teco,
    lastClose: Money.of('30.00'),
    availablePesos: Money.of('100.00'),
    availableShares: 4,
  };

  it('fills a market buy at the last close and ignores a sent price', () => {
    const decision = decideSubmit(
      { side: 'BUY', orderType: 'MARKET', quantity: 2, limitPrice: '1.00' },
      base,
    );
    expect(decision).toMatchObject({
      outcome: 'persist',
      status: 'FILLED',
      size: 2,
    });
    if (decision.outcome === 'persist') {
      expect(decision.price.toJson()).toBe('30.00');
    }
  });

  it('leaves a limit order pending when the cost is exactly the available pesos', () => {
    const decision = decideSubmit(
      { side: 'BUY', orderType: 'LIMIT', quantity: 2, limitPrice: '50.00' },
      base,
    );
    expect(decision).toMatchObject({
      outcome: 'persist',
      status: 'NEW',
      size: 2,
    });
  });

  it('rejects a buy above the available pesos and a sell above the available shares', () => {
    expect(
      decideSubmit({ side: 'BUY', orderType: 'MARKET', quantity: 4 }, base)
        .outcome === 'persist' &&
        decideSubmit({ side: 'BUY', orderType: 'MARKET', quantity: 4 }, base),
    ).toMatchObject({ status: 'REJECTED' });
    expect(
      decideSubmit({ side: 'SELL', orderType: 'MARKET', quantity: 5 }, base),
    ).toMatchObject({
      outcome: 'persist',
      status: 'REJECTED',
      size: 5,
    });
  });

  it('turns a peso amount into the greatest whole share quantity', () => {
    const decision = decideSubmit(
      { side: 'BUY', orderType: 'MARKET', amount: '100.00' },
      base,
    );
    expect(decision).toMatchObject({
      outcome: 'persist',
      status: 'FILLED',
      size: 3,
    });
  });

  it('does not persist an order that cannot represent a whole share or is malformed', () => {
    expect(
      decideSubmit({ side: 'BUY', orderType: 'MARKET', amount: '10.00' }, base)
        .outcome,
    ).toBe('invalid');
    expect(
      decideSubmit(
        { side: 'BUY', orderType: 'MARKET', quantity: 1, amount: '10.00' },
        base,
      ).outcome,
    ).toBe('invalid');
    expect(
      decideSubmit({ side: 'BUY', orderType: 'LIMIT', quantity: 1 }, base)
        .outcome,
    ).toBe('invalid');
    expect(
      decideSubmit(
        { side: 'BUY', orderType: 'LIMIT', quantity: 1, limitPrice: '1.234' },
        base,
      ).outcome,
    ).toBe('invalid');
    expect(
      decideSubmit(
        { side: 'BUY', orderType: 'MARKET', quantity: 1 },
        { ...base, instrument: peso },
      ).outcome,
    ).toBe('invalid');
    expect(
      decideSubmit(
        { side: 'BUY', orderType: 'MARKET', quantity: 1 },
        { ...base, instrument: null },
      ).outcome,
    ).toBe('invalid');
    expect(
      decideSubmit(
        { side: 'BUY', orderType: 'MARKET', quantity: 1 },
        { ...base, lastClose: null },
      ).outcome,
    ).toBe('invalid');
  });
});

describe('SubmitOrder', () => {
  it('makes the second limit order see the reservation of the first', async () => {
    const orders: StoredOrder[] = [
      {
        id: 1,
        userId: 1,
        instrumentId: 7,
        ticker: 'TECO2',
        name: 'Telecom',
        instrumentType: 'ACCIONES',
        side: 'CASH_IN',
        orderType: 'MARKET',
        size: 1000,
        price: Money.of('1.00'),
        status: 'FILLED',
        datetime: '2023-07-12 12:00:00',
      },
    ];
    const unitOfWork: UnitOfWork = {
      async run(_accountNumber, work) {
        const context: TradingContext = {
          userId: 1,
          accountNumber: '10001',
          async findInstrument() {
            return teco;
          },
          async listOrders() {
            return orders;
          },
          async latestClose() {
            return Money.of('100.00');
          },
          async insertOrder(draft) {
            const saved = { ...draft, id: orders.length + 1 };
            orders.push(saved);
            return saved;
          },
          async findOrder(id) {
            return orders.find((item) => item.id === id) ?? null;
          },
          async cancelOrder() {
            return undefined;
          },
        };
        return work(context);
      },
    };
    const submit = new SubmitOrder(unitOfWork, noopLogger);
    const first = await submit.execute({
      accountNumber: '10001',
      ticker: 'TECO2',
      side: 'BUY',
      orderType: 'LIMIT',
      quantity: 2,
      limitPrice: '100.00',
    });
    const second = await submit.execute({
      accountNumber: '10001',
      ticker: 'TECO2',
      side: 'BUY',
      orderType: 'LIMIT',
      quantity: 9,
      limitPrice: '100.00',
    });
    expect(first.status).toBe('NEW');
    expect(second.status).toBe('REJECTED');
  });

  it('reports a missing instrument without persisting', async () => {
    const unitOfWork: UnitOfWork = {
      async run(_accountNumber, work) {
        const context: TradingContext = {
          userId: 1,
          accountNumber: '10001',
          async findInstrument() {
            return null;
          },
          async listOrders() {
            return [];
          },
          async latestClose() {
            return null;
          },
          async insertOrder() {
            throw new Error('should not insert');
          },
          async findOrder() {
            return null;
          },
          async cancelOrder() {
            return undefined;
          },
        };
        return work(context);
      },
    };
    await expect(
      new SubmitOrder(unitOfWork, noopLogger).execute({
        accountNumber: '10001',
        ticker: 'NOPE',
        side: 'BUY',
        orderType: 'MARKET',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
