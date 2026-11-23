import { Money } from '../money/money';

export interface MarketPrice {
  instrumentId: number;
  close: Money;
}
