import { Body, Controller, Inject, Post } from '@nestjs/common';
import { z } from 'zod';
import { SubmitOrder } from '../../application/submit-order/submit-order';

const money = z.string().regex(/^\d+\.\d{2}$/, 'Money must have two decimals');

export const submitOrderSchema = z
  .object({
    accountNumber: z.string().min(1),
    ticker: z.string().min(1),
    side: z.enum(['BUY', 'SELL']),
    type: z.enum(['MARKET', 'LIMIT']),
    quantity: z.number().int().positive().optional(),
    amount: money.optional(),
    price: money.optional(),
  })
  .superRefine((value, context) => {
    const modes =
      Number(value.quantity !== undefined) + Number(value.amount !== undefined);
    if (modes !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide exactly one of quantity or amount',
      });
    }
    if (value.type === 'LIMIT' && value.price === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Limit orders require a price',
      });
    }
  });

@Controller('orders')
export class OrdersController {
  constructor(@Inject(SubmitOrder) private readonly submitOrder: SubmitOrder) {}

  @Post()
  async create(@Body() body: unknown) {
    const parsed = submitOrderSchema.parse(body);
    return this.submitOrder.execute({
      accountNumber: parsed.accountNumber,
      ticker: parsed.ticker,
      side: parsed.side,
      orderType: parsed.type,
      quantity: parsed.quantity,
      amount: parsed.amount,
      limitPrice: parsed.price,
    });
  }
}
