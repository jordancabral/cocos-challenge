import { Money } from '../money/money';
import { StoredOrder } from '../order/order';

export interface PositionView {
  ticker: string;
  name: string;
  quantity: number;
  marketValue: string;
  totalReturnPercent: string | null;
  dailyReturnPercent: string | null;
}

export interface PortfolioView {
  accountNumber: string;
  totalValue: string;
  availablePesos: string;
  positions: PositionView[];
}

export interface CloseQuote {
  instrumentId: number;
  close: Money;
  previousClose: Money | null;
}

interface Holding {
  instrumentId: number;
  ticker: string;
  name: string;
  quantity: number;
  cost: Money;
}

export function calculatePortfolio(input: {
  accountNumber: string;
  orders: StoredOrder[];
  closes: CloseQuote[];
}): PortfolioView {
  const executed = executedPesos(input.orders);
  const reserved = reservedBuyPesos(input.orders);
  const quotesByInstrument = new Map(
    input.closes.map((quote) => [quote.instrumentId, quote]),
  );
  const holdings = holdingsFromFilled(input.orders);
  const positions: PositionView[] = [];
  let marketTotal = Money.zero();

  for (const holding of holdings) {
    if (holding.quantity === 0) {
      continue;
    }
    const quote = quotesByInstrument.get(holding.instrumentId);
    if (!quote) {
      throw new Error(`Missing close for ${holding.ticker}`);
    }
    const marketValue = quote.close.timesInt(holding.quantity);
    marketTotal = marketTotal.plus(marketValue);
    const totalReturnPercent =
      holding.quantity > 0
        ? marketValue.returnPercentAgainst(holding.cost)
        : null;
    const dailyReturnPercent = quote.previousClose
      ? quote.close.returnPercentAgainst(quote.previousClose)
      : null;
    positions.push({
      ticker: holding.ticker,
      name: holding.name,
      quantity: holding.quantity,
      marketValue: marketValue.toJson(),
      totalReturnPercent,
      dailyReturnPercent,
    });
  }

  positions.sort((left, right) => left.ticker.localeCompare(right.ticker));

  return {
    accountNumber: input.accountNumber,
    totalValue: executed.plus(marketTotal).toJson(),
    availablePesos: executed.minus(reserved).toJson(),
    positions,
  };
}

export function executedPesos(orders: StoredOrder[]): Money {
  let total = Money.zero();
  for (const order of orders) {
    if (order.status !== 'FILLED') {
      continue;
    }
    const gross = order.price.timesInt(order.size);
    if (order.side === 'CASH_IN' || order.side === 'SELL') {
      total = total.plus(gross);
    }
    if (order.side === 'CASH_OUT' || order.side === 'BUY') {
      total = total.minus(gross);
    }
  }
  return total;
}

export function reservedBuyPesos(orders: StoredOrder[]): Money {
  let reserved = Money.zero();
  for (const order of orders) {
    if (order.status === 'NEW' && order.side === 'BUY') {
      reserved = reserved.plus(order.price.timesInt(order.size));
    }
  }
  return reserved;
}

export function availableShares(
  orders: StoredOrder[],
  instrumentId: number,
): number {
  let net = 0;
  let reservedSells = 0;
  for (const order of orders) {
    if (order.instrumentId !== instrumentId) {
      continue;
    }
    if (order.status === 'FILLED' && order.side === 'BUY') {
      net += order.size;
    }
    if (order.status === 'FILLED' && order.side === 'SELL') {
      net -= order.size;
    }
    if (order.status === 'NEW' && order.side === 'SELL') {
      reservedSells += order.size;
    }
  }
  return net - reservedSells;
}

function holdingsFromFilled(orders: StoredOrder[]): Holding[] {
  const grouped = new Map<number, StoredOrder[]>();
  for (const order of orders) {
    if (order.instrumentType === 'MONEDA') {
      continue;
    }
    const bucket = grouped.get(order.instrumentId) ?? [];
    bucket.push(order);
    grouped.set(order.instrumentId, bucket);
  }

  const holdings: Holding[] = [];
  for (const bucket of grouped.values()) {
    const sample = bucket[0];
    if (!sample) {
      continue;
    }
    const walked = walkCost(bucket);
    holdings.push({
      instrumentId: sample.instrumentId,
      ticker: sample.ticker,
      name: sample.name,
      quantity: walked.quantity,
      cost: walked.cost,
    });
  }
  return holdings;
}

function walkCost(orders: StoredOrder[]): { quantity: number; cost: Money } {
  const sorted = [...orders].sort(
    (left, right) =>
      left.datetime.localeCompare(right.datetime) || left.id - right.id,
  );
  let quantity = 0;
  let cost = Money.zero();
  for (const order of sorted) {
    if (
      order.status !== 'FILLED' ||
      (order.side !== 'BUY' && order.side !== 'SELL')
    ) {
      continue;
    }
    if (order.side === 'BUY') {
      if (quantity < 0) {
        const opening = order.size - Math.min(order.size, -quantity);
        quantity += order.size;
        cost = opening > 0 ? order.price.timesInt(opening) : Money.zero();
      } else {
        cost = cost.plus(order.price.timesInt(order.size));
        quantity += order.size;
      }
      continue;
    }
    if (quantity > 0) {
      const held = Math.min(order.size, quantity);
      const average = cost.dividedByInt(quantity);
      cost = cost.minus(average.timesInt(held));
      quantity -= order.size;
      if (quantity <= 0) {
        cost = Money.zero();
      }
    } else {
      quantity -= order.size;
    }
  }
  return { quantity, cost };
}
