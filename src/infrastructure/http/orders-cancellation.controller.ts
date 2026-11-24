import { Body, Controller, Inject, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import { CancelOrder } from '../../application/cancel-order/cancel-order';
import { localCancelExample } from './openapi';

const paramsSchema = z.object({
  orderId: z.coerce.number().int().positive(),
});

const bodySchema = z.object({
  accountNumber: z.string().min(1),
});

@ApiTags('orders')
@Controller('orders')
export class OrdersCancellationController {
  constructor(@Inject(CancelOrder) private readonly cancelOrder: CancelOrder) {}

  @Post(':orderId/cancellation')
  @ApiOperation({
    summary: 'Cancelar una orden pendiente',
    description: 'Escribe: libera la reserva de una orden pendiente.',
  })
  @ApiParam({
    name: 'orderId',
    required: true,
    example: localCancelExample.orderId,
    examples: {
      local: { summary: 'local', value: localCancelExample.orderId },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['accountNumber'],
      properties: {
        accountNumber: {
          type: 'string',
          example: localCancelExample.accountNumber,
        },
      },
    },
    examples: {
      local: {
        summary: 'local',
        description:
          'Cancela la orden pendiente de los datos locales. Escribe.',
        value: { accountNumber: localCancelExample.accountNumber },
      },
    },
  })
  @ApiOkResponse({ description: 'La orden quedó cancelada' })
  @ApiNotFoundResponse({ description: 'La orden no existe para esa cuenta' })
  @ApiConflictResponse({ description: 'La orden no está pendiente' })
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
