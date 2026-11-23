import { Account } from '../../domain/account/account';
import { Instrument } from '../../domain/instrument/instrument';
import { Money } from '../../domain/money/money';
import { StoredOrder } from '../../domain/order/order';

export interface PortfolioReader {
  findAccount(accountNumber: string): Promise<Account | null>;
  listOrders(userId: number): Promise<StoredOrder[]>;
  latestCloses(instrumentIds: number[]): Promise<Map<number, Money>>;
}

export interface InstrumentReader {
  listAll(): Promise<Instrument[]>;
}

export const PORTFOLIO_READER = Symbol('PORTFOLIO_READER');
export const INSTRUMENT_READER = Symbol('INSTRUMENT_READER');
