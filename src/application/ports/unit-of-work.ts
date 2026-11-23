import { Instrument } from '../../domain/instrument/instrument';
import { Money } from '../../domain/money/money';
import { StoredOrder } from '../../domain/order/order';

export interface TradingContext {
  userId: number;
  accountNumber: string;
  findInstrument(ticker: string): Promise<Instrument | null>;
  listOrders(): Promise<StoredOrder[]>;
  latestClose(instrumentId: number): Promise<Money | null>;
  insertOrder(draft: Omit<StoredOrder, 'id'>): Promise<StoredOrder>;
  findOrder(id: number): Promise<StoredOrder | null>;
  cancelOrder(id: number): Promise<void>;
}

export interface UnitOfWork {
  run<T>(
    accountNumber: string,
    work: (context: TradingContext) => Promise<T>,
  ): Promise<T>;
}

export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');
