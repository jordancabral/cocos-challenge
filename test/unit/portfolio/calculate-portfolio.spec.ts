import { Money } from '../../../src/domain/money/money';
import { StoredOrder } from '../../../src/domain/order/order';
import { calculatePortfolio } from '../../../src/domain/portfolio/calculate-portfolio';

function order(values: {
  id: number;
  instrumentId: number;
  ticker: string;
  name: string;
  instrumentType?: StoredOrder['instrumentType'];
  side: StoredOrder['side'];
  size: number;
  price: string;
  status: StoredOrder['status'];
  datetime: string;
  orderType?: StoredOrder['orderType'];
}): StoredOrder {
  return {
    userId: 1,
    instrumentType: values.instrumentType ?? 'ACCIONES',
    orderType: values.orderType ?? 'MARKET',
    ...values,
    price: Money.of(values.price),
  };
}

const seedOrders = [
  order({
    id: 1,
    instrumentId: 66,
    ticker: 'ARS',
    name: 'PESOS',
    instrumentType: 'MONEDA',
    side: 'CASH_IN',
    size: 1000000,
    price: '1.00',
    status: 'FILLED',
    datetime: '2023-07-12 12:11:20',
  }),
  order({
    id: 2,
    instrumentId: 47,
    ticker: 'PAMP',
    name: 'Pampa Holding S.A.',
    side: 'BUY',
    size: 50,
    price: '930.00',
    status: 'FILLED',
    datetime: '2023-07-12 12:31:20',
  }),
  order({
    id: 3,
    instrumentId: 47,
    ticker: 'PAMP',
    name: 'Pampa Holding S.A.',
    side: 'BUY',
    size: 50,
    price: '920.00',
    status: 'CANCELLED',
    orderType: 'LIMIT',
    datetime: '2023-07-12 14:21:20',
  }),
  order({
    id: 4,
    instrumentId: 47,
    ticker: 'PAMP',
    name: 'Pampa Holding S.A.',
    side: 'SELL',
    size: 10,
    price: '940.00',
    status: 'FILLED',
    datetime: '2023-07-12 14:51:20',
  }),
  order({
    id: 5,
    instrumentId: 45,
    ticker: 'LOMA',
    name: 'Loma Negra S.A.',
    side: 'BUY',
    size: 50,
    price: '710.00',
    status: 'NEW',
    orderType: 'LIMIT',
    datetime: '2023-07-12 15:14:20',
  }),
  order({
    id: 6,
    instrumentId: 47,
    ticker: 'PAMP',
    name: 'Pampa Holding S.A.',
    side: 'SELL',
    size: 100,
    price: '950.00',
    status: 'REJECTED',
    datetime: '2023-07-12 16:11:20',
  }),
  order({
    id: 7,
    instrumentId: 31,
    ticker: 'BMA',
    name: 'Banco Macro S.A.',
    side: 'BUY',
    size: 60,
    price: '1500.00',
    status: 'NEW',
    orderType: 'LIMIT',
    datetime: '2023-07-13 11:13:20',
  }),
  order({
    id: 8,
    instrumentId: 66,
    ticker: 'ARS',
    name: 'PESOS',
    instrumentType: 'MONEDA',
    side: 'CASH_OUT',
    size: 100000,
    price: '1.00',
    status: 'FILLED',
    datetime: '2023-07-13 12:31:20',
  }),
  order({
    id: 9,
    instrumentId: 31,
    ticker: 'BMA',
    name: 'Banco Macro S.A.',
    side: 'BUY',
    size: 20,
    price: '1540.00',
    status: 'FILLED',
    orderType: 'LIMIT',
    datetime: '2023-07-13 12:51:20',
  }),
  order({
    id: 10,
    instrumentId: 54,
    ticker: 'METR',
    name: 'MetroGAS S.A.',
    side: 'BUY',
    size: 500,
    price: '250.00',
    status: 'FILLED',
    datetime: '2023-07-13 14:11:20',
  }),
  order({
    id: 11,
    instrumentId: 31,
    ticker: 'BMA',
    name: 'Banco Macro S.A.',
    side: 'SELL',
    size: 30,
    price: '1530.00',
    status: 'FILLED',
    datetime: '2023-07-13 15:13:20',
  }),
];

const closes = [
  { instrumentId: 47, close: Money.of('925.85') },
  { instrumentId: 31, close: Money.of('1502.80') },
  { instrumentId: 54, close: Money.of('229.50') },
];

describe('calculatePortfolio', () => {
  it('matches the reference account 10001', () => {
    const portfolio = calculatePortfolio({
      accountNumber: '10001',
      orders: seedOrders,
      closes,
    });
    expect(portfolio.availablePesos).toBe('627500.00');
    expect(portfolio.totalValue).toBe('889756.00');
    expect(portfolio.positions).toEqual([
      {
        ticker: 'BMA',
        name: 'Banco Macro S.A.',
        quantity: -10,
        marketValue: '-15028.00',
        totalReturnPercent: null,
      },
      {
        ticker: 'METR',
        name: 'MetroGAS S.A.',
        quantity: 500,
        marketValue: '114750.00',
        totalReturnPercent: '-8.20',
      },
      {
        ticker: 'PAMP',
        name: 'Pampa Holding S.A.',
        quantity: 40,
        marketValue: '37034.00',
        totalReturnPercent: '-0.45',
      },
    ]);
  });

  it('lets a pending buy lower only the available pesos', () => {
    const portfolio = calculatePortfolio({
      accountNumber: '10001',
      orders: [
        order({
          id: 1,
          instrumentId: 66,
          ticker: 'ARS',
          name: 'PESOS',
          instrumentType: 'MONEDA',
          side: 'CASH_IN',
          size: 1000,
          price: '1.00',
          status: 'FILLED',
          datetime: '2023-07-12 12:00:00',
        }),
        order({
          id: 2,
          instrumentId: 1,
          ticker: 'TECO2',
          name: 'Telecom',
          side: 'BUY',
          size: 2,
          price: '100.00',
          status: 'NEW',
          orderType: 'LIMIT',
          datetime: '2023-07-12 13:00:00',
        }),
      ],
      closes: [{ instrumentId: 1, close: Money.of('100.00') }],
    });
    expect(portfolio.availablePesos).toBe('800.00');
    expect(portfolio.totalValue).toBe('1000.00');
    expect(portfolio.positions).toEqual([]);
  });

  it('releases a pending buy reservation when that order is cancelled', () => {
    const cancelled = seedOrders.map((item) =>
      item.id === 5 ? { ...item, status: 'CANCELLED' as const } : item,
    );
    const portfolio = calculatePortfolio({
      accountNumber: '10001',
      orders: cancelled,
      closes,
    });
    expect(portfolio.availablePesos).toBe('663000.00');
    expect(portfolio.totalValue).toBe('889756.00');
  });

  it('fails closed when a held asset has no last price', () => {
    expect(() =>
      calculatePortfolio({
        accountNumber: '10001',
        orders: [
          order({
            id: 1,
            instrumentId: 1,
            ticker: 'TECO2',
            name: 'Telecom',
            side: 'BUY',
            size: 1,
            price: '10.00',
            status: 'FILLED',
            datetime: '2023-07-12 12:00:00',
          }),
        ],
        closes: [],
      }),
    ).toThrow('Missing close for TECO2');
  });
});
