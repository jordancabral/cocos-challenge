import { ConflictError, NotFoundError } from '../errors';
import { AppLogger } from '../logging/app-logger';
import { UnitOfWork } from '../ports/unit-of-work';
import { decideCancel } from '../../domain/order/cancel-order';
import { OrderResponse, toOrderResponse } from '../submit-order/submit-order';

export class CancelOrder {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly logger: AppLogger,
  ) {}

  async execute(
    accountNumber: string,
    orderId: number,
  ): Promise<OrderResponse> {
    return this.unitOfWork.run(accountNumber, async (context) => {
      const order = await context.findOrder(orderId);
      const decision = decideCancel(order, context.userId);
      if (decision.outcome === 'not-found') {
        throw new NotFoundError('Order not found');
      }
      if (decision.outcome === 'conflict') {
        throw new ConflictError('Only a pending order can be cancelled');
      }
      await context.cancelOrder(orderId);
      const cancelled = await context.findOrder(orderId);
      if (!cancelled) {
        throw new NotFoundError('Order not found');
      }
      this.logger.info('order cancelled', { orderId });
      return toOrderResponse(context.accountNumber, cancelled);
    });
  }
}
