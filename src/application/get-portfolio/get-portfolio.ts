import { NotFoundError } from '../errors';
import { AppLogger } from '../logging/app-logger';
import { PortfolioReader } from '../ports/repositories';
import {
  calculatePortfolio,
  PortfolioView,
} from '../../domain/portfolio/calculate-portfolio';

export class GetPortfolio {
  constructor(
    private readonly reader: PortfolioReader,
    private readonly logger: AppLogger,
  ) {}

  async execute(accountNumber: string): Promise<PortfolioView> {
    const account = await this.reader.findAccount(accountNumber);
    if (!account) {
      throw new NotFoundError('Account not found');
    }
    const orders = await this.reader.listOrders(account.id);
    const instrumentIds = [
      ...new Set(orders.map((order) => order.instrumentId)),
    ];
    const closes = await this.reader.latestCloses(instrumentIds);
    this.logger.info('portfolio consulted', { accountNumber });
    return calculatePortfolio({
      accountNumber,
      orders,
      closes: [...closes.values()],
    });
  }
}
