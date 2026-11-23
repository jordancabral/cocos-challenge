import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { NotFoundError } from '../../application/errors';
import {
  TradingContext,
  UnitOfWork,
} from '../../application/ports/unit-of-work';
import { Instrument } from '../../domain/instrument/instrument';
import { Money } from '../../domain/money/money';
import { StoredOrder } from '../../domain/order/order';
import { UserEntity } from './entities/user.entity';
import { OrderRow, toInstrument, toStoredOrder } from './mappers';

const ORDER_SQL = `
  SELECT o.id, o.userid, o.instrumentid, o.size, o.price::text AS price, o.side,
         o.type AS order_type, o.status, o.datetime, i.ticker, i.name, i.type AS instrument_type
  FROM orders o
  JOIN instruments i ON i.id = o.instrumentid
`;

@Injectable()
export class OrderUnitOfWorkAdapter implements UnitOfWork {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async run<T>(
    accountNumber: string,
    work: (context: TradingContext) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(UserEntity)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.accountNumber = :accountNumber', { accountNumber })
        .getOne();
      if (!user) {
        throw new NotFoundError('Account not found');
      }
      return work(
        new TypeOrmTradingContext(manager, user.id, user.accountNumber),
      );
    });
  }
}

class TypeOrmTradingContext implements TradingContext {
  constructor(
    private readonly manager: EntityManager,
    readonly userId: number,
    readonly accountNumber: string,
  ) {}

  async findInstrument(ticker: string): Promise<Instrument | null> {
    const rows: Array<{
      id: number;
      ticker: string;
      name: string;
      type: string;
    }> = await this.manager.query(
      'SELECT id, ticker, name, type FROM instruments WHERE ticker = $1',
      [ticker],
    );
    const row = rows[0];
    return row ? toInstrument(row) : null;
  }

  async listOrders(): Promise<StoredOrder[]> {
    const rows: OrderRow[] = await this.manager.query(
      `${ORDER_SQL} WHERE o.userid = $1`,
      [this.userId],
    );
    return rows.map(toStoredOrder);
  }

  async latestClose(instrumentId: number): Promise<Money | null> {
    const rows: Array<{ close: string }> = await this.manager.query(
      `SELECT close::text AS close FROM marketdata WHERE instrumentid = $1 ORDER BY date DESC LIMIT 1`,
      [instrumentId],
    );
    const row = rows[0];
    return row ? Money.of(String(row.close)) : null;
  }

  async insertOrder(draft: Omit<StoredOrder, 'id'>): Promise<StoredOrder> {
    const rows: Array<{ id: number }> = await this.manager.query(
      `INSERT INTO orders (instrumentid, userid, size, price, type, side, status, datetime)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        draft.instrumentId,
        draft.userId,
        draft.size,
        draft.price.toJson(),
        draft.orderType,
        draft.side,
        draft.status,
        new Date(draft.datetime),
      ],
    );
    const id = Number(rows[0]?.id);
    return { ...draft, id };
  }

  async findOrder(id: number): Promise<StoredOrder | null> {
    const rows: OrderRow[] = await this.manager.query(
      `${ORDER_SQL} WHERE o.id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toStoredOrder(row) : null;
  }

  async cancelOrder(id: number): Promise<void> {
    await this.manager.query(
      `UPDATE orders SET status = 'CANCELLED' WHERE id = $1`,
      [id],
    );
  }
}
