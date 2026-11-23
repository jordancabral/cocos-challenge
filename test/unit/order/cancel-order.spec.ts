import { ConflictError, NotFoundError } from '../../../src/application/errors';
import { noopLogger } from '../../../src/application/logging/app-logger';
import {
  TradingContext,
  UnitOfWork,
} from '../../../src/application/ports/unit-of-work';
import { CancelOrder } from '../../../src/application/cancel-order/cancel-order';
import { Money } from '../../../src/domain/money/money';
import { StoredOrder } from '../../../src/domain/order/order';
import { decideCancel } from '../../../src/domain/order/cancel-order';

function pending(): StoredOrder {
  return {
    id: 5,
    userId: 1,
    instrumentId: 45,
    ticker: 'LOMA',
    name: 'Loma Negra S.A.',
    instrumentType: 'ACCIONES',
    side: 'BUY',
    orderType: 'LIMIT',
    size: 50,
    price: Money.of('710.00'),
    status: 'NEW',
    datetime: '2023-07-12 15:14:20',
  };
}

describe('decideCancel', () => {
  it('cancels only a pending order of the same account', () => {
    expect(decideCancel(pending(), 1)).toEqual({ outcome: 'cancel' });
    expect(decideCancel({ ...pending(), status: 'FILLED' }, 1)).toEqual({
      outcome: 'conflict',
    });
    expect(decideCancel({ ...pending(), status: 'REJECTED' }, 1)).toEqual({
      outcome: 'conflict',
    });
    expect(decideCancel({ ...pending(), status: 'CANCELLED' }, 1)).toEqual({
      outcome: 'conflict',
    });
    expect(decideCancel(pending(), 2)).toEqual({ outcome: 'not-found' });
    expect(decideCancel(null, 1)).toEqual({ outcome: 'not-found' });
  });
});

describe('CancelOrder', () => {
  it('stores CANCELLED and leaves a non-pending order untouched', async () => {
    const orders = [pending()];
    const unitOfWork: UnitOfWork = {
      async run(_accountNumber, work) {
        const context: TradingContext = {
          userId: 1,
          accountNumber: '10001',
          async findInstrument() {
            return null;
          },
          async listOrders() {
            return orders;
          },
          async latestClose() {
            return null;
          },
          async insertOrder(draft) {
            return { ...draft, id: 99 };
          },
          async findOrder(id) {
            return orders.find((item) => item.id === id) ?? null;
          },
          async cancelOrder(id) {
            const found = orders.find((item) => item.id === id);
            if (found) {
              found.status = 'CANCELLED';
            }
          },
        };
        return work(context);
      },
    };
    const useCase = new CancelOrder(unitOfWork, noopLogger);
    const cancelled = await useCase.execute('10001', 5);
    expect(cancelled.status).toBe('CANCELLED');
    orders[0] = { ...pending(), status: 'FILLED' };
    await expect(useCase.execute('10001', 5)).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(useCase.execute('10001', 9)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
