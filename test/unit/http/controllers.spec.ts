import { NotFoundError } from '../../../src/application/errors';
import { GetPortfolio } from '../../../src/application/get-portfolio/get-portfolio';
import { noopLogger } from '../../../src/application/logging/app-logger';
import { PortfolioReader } from '../../../src/application/ports/repositories';
import { InvalidRequestError } from '../../../src/application/errors';
import { SearchInstruments } from '../../../src/application/search-instruments/search-instruments';
import { CancelOrder } from '../../../src/application/cancel-order/cancel-order';
import { SubmitOrder } from '../../../src/application/submit-order/submit-order';
import { HealthController } from '../../../src/infrastructure/http/health.controller';
import { InstrumentsController } from '../../../src/infrastructure/http/instruments.controller';
import { OrdersCancellationController } from '../../../src/infrastructure/http/orders-cancellation.controller';
import { OrdersController } from '../../../src/infrastructure/http/orders.controller';
import { PortfolioController } from '../../../src/infrastructure/http/portfolio.controller';
import { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from '../../../src/infrastructure/http/http-exception.filter';

describe('HTTP controllers and use cases', () => {
  it('serves health', () => {
    expect(new HealthController().health()).toEqual({ status: 'ok' });
  });

  it('returns a portfolio and hides a missing account', async () => {
    const reader: PortfolioReader = {
      async findAccount(accountNumber) {
        return accountNumber === '10001' ? { id: 1, accountNumber } : null;
      },
      async listOrders() {
        return [];
      },
      async latestCloses() {
        return new Map();
      },
    };
    const useCase = new GetPortfolio(reader, noopLogger);
    await expect(useCase.execute('10001')).resolves.toEqual({
      accountNumber: '10001',
      totalValue: '0.00',
      availablePesos: '0.00',
      positions: [],
    });
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
    const controller = new PortfolioController(useCase);
    await expect(controller.show('10001')).resolves.toMatchObject({
      accountNumber: '10001',
    });
  });

  it('searches through the controller and rejects a blank query', async () => {
    const useCase = new SearchInstruments(
      {
        async listAll() {
          return [
            {
              id: 7,
              ticker: 'TECO2',
              name: 'Telecom',
              type: 'ACCIONES' as const,
            },
          ];
        },
      },
      noopLogger,
    );
    const controller = new InstrumentsController(useCase);
    await expect(controller.search({ q: 'teco' })).resolves.toEqual({
      items: [{ ticker: 'TECO2', name: 'Telecom', type: 'ACCIONES' }],
    });
    await expect(useCase.execute('   ')).rejects.toBeInstanceOf(
      InvalidRequestError,
    );
  });

  it('accepts an order body and a cancellation', async () => {
    const submit = {
      async execute() {
        return {
          id: 12,
          accountNumber: '10001',
          ticker: 'TECO2',
          side: 'BUY' as const,
          type: 'MARKET' as const,
          quantity: 1,
          price: '30.00',
          status: 'FILLED' as const,
        };
      },
    };
    const orders = new OrdersController(submit as unknown as SubmitOrder);
    await expect(
      orders.create({
        accountNumber: '10001',
        ticker: 'TECO2',
        side: 'BUY',
        type: 'MARKET',
        quantity: 1,
      }),
    ).resolves.toMatchObject({ status: 'FILLED' });
    await expect(
      orders.create({
        accountNumber: '10001',
        ticker: 'TECO2',
        side: 'BUY',
        type: 'MARKET',
      }),
    ).rejects.toThrow();

    const cancel = {
      async execute() {
        return {
          id: 5,
          accountNumber: '10001',
          ticker: 'LOMA',
          side: 'BUY' as const,
          type: 'LIMIT' as const,
          quantity: 50,
          price: '710.00',
          status: 'CANCELLED' as const,
        };
      },
    };
    const cancellation = new OrdersCancellationController(
      cancel as unknown as CancelOrder,
    );
    await expect(
      cancellation.cancel({ orderId: '5' }, { accountNumber: '10001' }),
    ).resolves.toMatchObject({
      status: 'CANCELLED',
    });

    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as ArgumentsHost;
    new HttpExceptionFilter().catch(new NotFoundError('missing'), host);
    expect(response.status).toHaveBeenCalledWith(404);
  });
});
