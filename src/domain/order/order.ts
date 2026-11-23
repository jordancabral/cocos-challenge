import { InstrumentType } from '../instrument/instrument';
import { Money } from '../money/money';

export type OrderSide = 'BUY' | 'SELL' | 'CASH_IN' | 'CASH_OUT';
export type OrderKind = 'MARKET' | 'LIMIT';
export type OrderStatus = 'NEW' | 'FILLED' | 'REJECTED' | 'CANCELLED';

export interface StoredOrder {
  id: number;
  userId: number;
  instrumentId: number;
  ticker: string;
  name: string;
  instrumentType: InstrumentType;
  side: OrderSide;
  orderType: OrderKind;
  size: number;
  price: Money;
  status: OrderStatus;
  datetime: string;
}
