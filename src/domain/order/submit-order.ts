import { Instrument } from '../instrument/instrument';
import { Money } from '../money/money';
import { OrderKind, OrderStatus } from './order';

export interface SubmitCommand {
  side: 'BUY' | 'SELL';
  orderType: OrderKind;
  quantity?: number;
  amount?: string;
  limitPrice?: string;
}

export type SubmitDecision =
  | { outcome: 'invalid'; message: string }
  | {
      outcome: 'persist';
      status: Extract<OrderStatus, 'FILLED' | 'NEW' | 'REJECTED'>;
      size: number;
      price: Money;
    };

export function decideSubmit(
  command: SubmitCommand,
  context: {
    instrument: Instrument | null;
    lastClose: Money | null;
    availablePesos: Money;
    availableShares: number;
  },
): SubmitDecision {
  if (!context.instrument) {
    return { outcome: 'invalid', message: 'Instrument not found' };
  }
  if (context.instrument.type === 'MONEDA') {
    return { outcome: 'invalid', message: 'Currency is not a tradable asset' };
  }

  const hasQuantity = command.quantity !== undefined;
  const hasAmount = command.amount !== undefined;
  if (hasQuantity === hasAmount) {
    return {
      outcome: 'invalid',
      message: 'Provide exactly one of quantity or amount',
    };
  }
  if (
    hasQuantity &&
    (!Number.isInteger(command.quantity) || (command.quantity ?? 0) <= 0)
  ) {
    return {
      outcome: 'invalid',
      message: 'Quantity must be a positive integer',
    };
  }

  let amount: Money | undefined;
  if (command.amount !== undefined) {
    try {
      amount = Money.of(command.amount);
    } catch {
      return { outcome: 'invalid', message: 'Amount is invalid' };
    }
    if (!amount.isPositive()) {
      return { outcome: 'invalid', message: 'Amount must be positive' };
    }
  }

  let limitPrice: Money | undefined;
  if (command.orderType === 'LIMIT') {
    if (command.limitPrice === undefined) {
      return { outcome: 'invalid', message: 'Limit orders require a price' };
    }
    try {
      limitPrice = Money.of(command.limitPrice);
    } catch {
      return { outcome: 'invalid', message: 'Limit price is invalid' };
    }
    if (!limitPrice.isPositive() || limitPrice.decimalPlaces() > 2) {
      return {
        outcome: 'invalid',
        message: 'Limit price must be positive with at most two decimals',
      };
    }
  }

  const price =
    command.orderType === 'MARKET' ? context.lastClose : (limitPrice ?? null);
  if (!price || !price.isPositive()) {
    return { outcome: 'invalid', message: 'Instrument has no last price' };
  }

  const size = command.quantity ?? amount?.wholeSharesAt(price) ?? 0;
  if (size < 1) {
    return { outcome: 'invalid', message: 'Amount does not buy a whole share' };
  }

  const cost = price.timesInt(size);
  const insufficient =
    (command.side === 'BUY' && cost.greaterThan(context.availablePesos)) ||
    (command.side === 'SELL' && size > context.availableShares);
  if (insufficient) {
    return { outcome: 'persist', status: 'REJECTED', size, price };
  }

  return {
    outcome: 'persist',
    status: command.orderType === 'MARKET' ? 'FILLED' : 'NEW',
    size,
    price,
  };
}
