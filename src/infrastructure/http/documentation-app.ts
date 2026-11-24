import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CancelOrder } from '../../application/cancel-order/cancel-order';
import { GetPortfolio } from '../../application/get-portfolio/get-portfolio';
import { SearchInstruments } from '../../application/search-instruments/search-instruments';
import { SubmitOrder } from '../../application/submit-order/submit-order';
import { HealthController } from './health.controller';
import { InstrumentsController } from './instruments.controller';
import { OrdersCancellationController } from './orders-cancellation.controller';
import { OrdersController } from './orders.controller';
import { PortfolioController } from './portfolio.controller';

export async function createDocumentationApplication(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [
      HealthController,
      PortfolioController,
      InstrumentsController,
      OrdersController,
      OrdersCancellationController,
    ],
    providers: [
      { provide: GetPortfolio, useValue: { execute: async () => ({}) } },
      {
        provide: SearchInstruments,
        useValue: { execute: async () => ({ items: [] }) },
      },
      { provide: SubmitOrder, useValue: { execute: async () => ({}) } },
      { provide: CancelOrder, useValue: { execute: async () => ({}) } },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}
