import { InvalidRequestError, NotFoundError } from '../errors';
import { AppLogger } from '../logging/app-logger';
import { UnitOfWork } from '../ports/unit-of-work';
import {
  availableShares,
  executedPesos,
  reservedBuyPesos,
} from '../../domain/portfolio/calculate-portfolio';
import { decideSubmit, SubmitCommand } from '../../domain/order/submit-order';
import { StoredOrder } from '../../domain/order/order';

export interface OrderResponse {
  id: number;
  accountNumber: string;
  ticker: string;
  side: StoredOrder['side'];
  type: StoredOrder['orderType'];
  quantity: number;
  price: string;
  status: StoredOrder['status'];
}

export interface SubmitOrderInput extends SubmitCommand {
  accountNumber: string;
  ticker: string;
}

export class SubmitOrder {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: SubmitOrderInput): Promise<OrderResponse> {
    return this.unitOfWork.run(input.accountNumber, async (context) => {
      const instrument = await context.findInstrument(input.ticker);
      if (!instrument) {
        throw new NotFoundError('Instrument not found');
      }
      const orders = await context.listOrders();
      const decision = decideSubmit(
        {
          side: input.side,
          orderType: input.orderType,
          quantity: input.quantity,
          amount: input.amount,
          limitPrice: input.limitPrice,
        },
        {
          instrument,
          lastClose: await context.latestClose(instrument.id),
          availablePesos: executedPesos(orders).minus(reservedBuyPesos(orders)),
          availableShares: availableShares(orders, instrument.id),
        },
      );
      if (decision.outcome === 'invalid') {
        throw new InvalidRequestError(decision.message);
      }
      const saved = await context.insertOrder({
        userId: context.userId,
        instrumentId: instrument.id,
        ticker: instrument.ticker,
        name: instrument.name,
        instrumentType: instrument.type,
        side: input.side,
        orderType: input.orderType,
        size: decision.size,
        price: decision.price,
        status: decision.status,
        datetime: new Date().toISOString(),
      });
      this.logger.info('order submitted', {
        orderId: saved.id,
        status: saved.status,
      });
      return toOrderResponse(context.accountNumber, saved);
    });
  }
}

export function toOrderResponse(
  accountNumber: string,
  order: StoredOrder,
): OrderResponse {
  return {
    id: order.id,
    accountNumber,
    ticker: order.ticker,
    side: order.side,
    type: order.orderType,
    quantity: order.size,
    price: order.price.toJson(),
    status: order.status,
  };
}
