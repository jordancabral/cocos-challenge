import { Body, Controller, Inject, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { CancelOrder } from '../../application/cancel-order/cancel-order';

const paramsSchema = z.object({
  orderId: z.coerce.number().int().positive(),
});

const bodySchema = z.object({
  accountNumber: z.string().min(1),
});

@Controller('orders')
export class OrdersCancellationController {
  constructor(@Inject(CancelOrder) private readonly cancelOrder: CancelOrder) {}

  @Post(':orderId/cancellation')
  async cancel(
    @Param() params: Record<string, unknown>,
    @Body() body: unknown,
  ) {
    const parsedParams = paramsSchema.parse(params);
    const parsedBody = bodySchema.parse(body);
    return this.cancelOrder.execute(
      parsedBody.accountNumber,
      parsedParams.orderId,
    );
  }
}
