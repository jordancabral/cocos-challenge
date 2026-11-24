import { Controller, Get, Inject, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import { GetPortfolio } from '../../application/get-portfolio/get-portfolio';
import { localAccountNumber, moneySchema } from './openapi';

const accountNumberSchema = z.string().min(1);

@ApiTags('portfolio')
@Controller('accounts')
export class PortfolioController {
  constructor(
    @Inject(GetPortfolio) private readonly getPortfolio: GetPortfolio,
  ) {}

  @Get(':accountNumber/portfolio')
  @ApiOperation({ summary: 'Consultar el portfolio de una cuenta' })
  @ApiParam({
    name: 'accountNumber',
    required: true,
    example: localAccountNumber,
    examples: {
      local: { summary: 'local', value: localAccountNumber },
    },
  })
  @ApiOkResponse({
    description: 'Valor total, pesos disponibles y posiciones',
    schema: {
      type: 'object',
      required: ['accountNumber', 'totalValue', 'availablePesos', 'positions'],
      properties: {
        accountNumber: { type: 'string', example: localAccountNumber },
        totalValue: moneySchema,
        availablePesos: moneySchema,
        positions: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'La cuenta está vacía o es inválida' })
  @ApiNotFoundResponse({ description: 'La cuenta no existe' })
  async show(@Param('accountNumber') accountNumber: string) {
    return this.getPortfolio.execute(accountNumberSchema.parse(accountNumber));
  }
}
