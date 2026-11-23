import { Controller, Get, Inject, Param } from '@nestjs/common';
import { z } from 'zod';
import { GetPortfolio } from '../../application/get-portfolio/get-portfolio';

const accountNumberSchema = z.string().min(1);

@Controller('accounts')
export class PortfolioController {
  constructor(
    @Inject(GetPortfolio) private readonly getPortfolio: GetPortfolio,
  ) {}

  @Get(':accountNumber/portfolio')
  async show(@Param('accountNumber') accountNumber: string) {
    return this.getPortfolio.execute(accountNumberSchema.parse(accountNumber));
  }
}
