import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { CancelOrder } from './application/cancel-order/cancel-order';
import { GetPortfolio } from './application/get-portfolio/get-portfolio';
import { APP_LOGGER } from './application/logging/app-logger';
import {
  INSTRUMENT_READER,
  PORTFOLIO_READER,
} from './application/ports/repositories';
import { UNIT_OF_WORK } from './application/ports/unit-of-work';
import { SearchInstruments } from './application/search-instruments/search-instruments';
import { SubmitOrder } from './application/submit-order/submit-order';
import { loadEnv } from './infrastructure/config/env';
import { HealthController } from './infrastructure/http/health.controller';
import { InstrumentsController } from './infrastructure/http/instruments.controller';
import { OrdersCancellationController } from './infrastructure/http/orders-cancellation.controller';
import { OrdersController } from './infrastructure/http/orders.controller';
import { PortfolioController } from './infrastructure/http/portfolio.controller';
import { createLogger } from './infrastructure/logging/logger';
import { postgresOptions } from './infrastructure/persistence/data-source';
import { InstrumentReadAdapter } from './infrastructure/persistence/instrument-read.adapter';
import { OrderUnitOfWorkAdapter } from './infrastructure/persistence/order-unit-of-work.adapter';
import { PortfolioReadAdapter } from './infrastructure/persistence/portfolio-read.adapter';

const env = loadEnv();

@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: { autoLogging: false } }),
    TypeOrmModule.forRoot(postgresOptions(env.DATABASE_URL)),
  ],
  controllers: [
    HealthController,
    PortfolioController,
    InstrumentsController,
    OrdersController,
    OrdersCancellationController,
  ],
  providers: [
    { provide: APP_LOGGER, useFactory: () => createLogger() },
    PortfolioReadAdapter,
    InstrumentReadAdapter,
    OrderUnitOfWorkAdapter,
    { provide: PORTFOLIO_READER, useExisting: PortfolioReadAdapter },
    { provide: INSTRUMENT_READER, useExisting: InstrumentReadAdapter },
    { provide: UNIT_OF_WORK, useExisting: OrderUnitOfWorkAdapter },
    {
      provide: GetPortfolio,
      useFactory: (
        reader: PortfolioReadAdapter,
        logger: ReturnType<typeof createLogger>,
      ) => new GetPortfolio(reader, logger),
      inject: [PORTFOLIO_READER, APP_LOGGER],
    },
    {
      provide: SearchInstruments,
      useFactory: (
        reader: InstrumentReadAdapter,
        logger: ReturnType<typeof createLogger>,
      ) => new SearchInstruments(reader, logger),
      inject: [INSTRUMENT_READER, APP_LOGGER],
    },
    {
      provide: SubmitOrder,
      useFactory: (
        unitOfWork: OrderUnitOfWorkAdapter,
        logger: ReturnType<typeof createLogger>,
      ) => new SubmitOrder(unitOfWork, logger),
      inject: [UNIT_OF_WORK, APP_LOGGER],
    },
    {
      provide: CancelOrder,
      useFactory: (
        unitOfWork: OrderUnitOfWorkAdapter,
        logger: ReturnType<typeof createLogger>,
      ) => new CancelOrder(unitOfWork, logger),
      inject: [UNIT_OF_WORK, APP_LOGGER],
    },
  ],
})
export class AppModule {}
