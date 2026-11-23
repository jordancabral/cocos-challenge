import { Instrument, InstrumentType } from '../../domain/instrument/instrument';
import { Money } from '../../domain/money/money';
import {
  OrderKind,
  OrderSide,
  OrderStatus,
  StoredOrder,
} from '../../domain/order/order';

export interface OrderRow {
  id: number;
  userid: number;
  instrumentid: number;
  size: number;
  price: string;
  side: string;
  order_type: string;
  status: string;
  datetime: Date | string;
  ticker: string;
  name: string;
  instrument_type: string;
}

export function toMoney(value: string): Money {
  return Money.of(value);
}

export function toStoredOrder(row: OrderRow): StoredOrder {
  return {
    id: Number(row.id),
    userId: Number(row.userid),
    instrumentId: Number(row.instrumentid),
    ticker: row.ticker,
    name: row.name,
    instrumentType: row.instrument_type as InstrumentType,
    side: row.side as OrderSide,
    orderType: row.order_type as OrderKind,
    size: Number(row.size),
    price: Money.of(String(row.price)),
    status: row.status as OrderStatus,
    datetime:
      row.datetime instanceof Date
        ? row.datetime.toISOString()
        : String(row.datetime),
  };
}

export function toInstrument(row: {
  id: number;
  ticker: string;
  name: string;
  type: string;
}): Instrument {
  return {
    id: Number(row.id),
    ticker: row.ticker,
    name: row.name,
    type: row.type as InstrumentType,
  };
}
