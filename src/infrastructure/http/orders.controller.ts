import { Body, Controller, Inject, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { z } from 'zod';
import { SubmitOrder } from '../../application/submit-order/submit-order';
import { Order } from './order.schema';
import {
  localOrderAmountExample,
  localOrderExample,
  localOrderLimitExample,
  moneySchema,
} from './openapi';

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

@ApiExtraModels(Order)
@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(@Inject(SubmitOrder) private readonly submitOrder: SubmitOrder) {}

  @Post()
  @ApiOperation({
    summary: 'Enviar una compra o una venta',
    description: 'Escribe: crea una orden ejecutada, pendiente o rechazada.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['accountNumber', 'ticker', 'side', 'type'],
      properties: {
        accountNumber: {
          type: 'string',
          example: localOrderExample.accountNumber,
        },
        ticker: { type: 'string', example: localOrderExample.ticker },
        side: { type: 'string', enum: ['BUY', 'SELL'] },
        type: { type: 'string', enum: ['MARKET', 'LIMIT'] },
        quantity: { type: 'integer', minimum: 1 },
        amount: moneySchema,
        price: moneySchema,
      },
    },
    examples: {
      local: {
        summary: 'Compra por cantidad',
        description:
          'Compra a mercado indicando la cantidad de acciones. Escribe en la cuenta.',
        value: localOrderExample,
      },
      localAmount: {
        summary: 'Compra por monto',
        description:
          'Compra a mercado indicando un monto en pesos. La cantidad es la mayor cantidad entera de acciones que ese monto alcanza. Escribe en la cuenta.',
        value: localOrderAmountExample,
      },
      localLimit: {
        summary: 'Compra límite',
        description:
          'Compra límite de una acción al precio indicado. Queda pendiente y reserva ese precio. Escribe en la cuenta.',
        value: localOrderLimitExample,
      },
    },
  })
  @ApiCreatedResponse({
    description: 'La orden quedó registrada',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiBadRequestResponse({
    description: 'El envío es inválido y no se crea una orden',
  })
  @ApiNotFoundResponse({ description: 'La cuenta o el activo no existen' })
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
