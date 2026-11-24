import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Account } from '../../domain/account/account';
import { Money } from '../../domain/money/money';
import { CloseQuote } from '../../domain/portfolio/calculate-portfolio';
import { StoredOrder } from '../../domain/order/order';
import { PortfolioReader } from '../../application/ports/repositories';
import { OrderRow, toStoredOrder } from './mappers';

const ORDER_SQL = `
  SELECT o.id, o.userid, o.instrumentid, o.size, o.price::text AS price, o.side,
         o.type AS order_type, o.status, o.datetime, i.ticker, i.name, i.type AS instrument_type
  FROM orders o
  JOIN instruments i ON i.id = o.instrumentid
`;

@Injectable()
export class PortfolioReadAdapter implements PortfolioReader {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findAccount(accountNumber: string): Promise<Account | null> {
    const rows: Array<{ id: number; accountnumber: string }> =
      await this.dataSource.query(
        'SELECT id, accountnumber FROM users WHERE accountnumber = $1',
        [accountNumber],
      );
    const row = rows[0];
    if (!row) {
      return null;
    }
    return { id: Number(row.id), accountNumber: row.accountnumber };
  }

  async listOrders(userId: number): Promise<StoredOrder[]> {
    const rows: OrderRow[] = await this.dataSource.query(
      `${ORDER_SQL} WHERE o.userid = $1`,
      [userId],
    );
    return rows.map(toStoredOrder);
  }

  async latestCloses(
    instrumentIds: number[],
  ): Promise<Map<number, CloseQuote>> {
    const closes = new Map<number, CloseQuote>();
    if (instrumentIds.length === 0) {
      return closes;
    }
    const rows: Array<{
      instrumentid: number;
      close: string;
      previous_close: string | null;
    }> = await this.dataSource.query(
      `SELECT DISTINCT ON (instrumentid) instrumentid, close::text AS close,
              previousclose::text AS previous_close
       FROM marketdata
       WHERE instrumentid = ANY($1::int[])
       ORDER BY instrumentid, date DESC`,
      [instrumentIds],
    );
    for (const row of rows) {
      closes.set(Number(row.instrumentid), {
        instrumentId: Number(row.instrumentid),
        close: Money.of(String(row.close)),
        previousClose:
          row.previous_close === null
            ? null
            : Money.of(String(row.previous_close)),
      });
    }
    return closes;
  }
}
