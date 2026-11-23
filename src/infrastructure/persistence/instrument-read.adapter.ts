import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Instrument } from '../../domain/instrument/instrument';
import { InstrumentReader } from '../../application/ports/repositories';
import { toInstrument } from './mappers';

@Injectable()
export class InstrumentReadAdapter implements InstrumentReader {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async listAll(): Promise<Instrument[]> {
    const rows: Array<{
      id: number;
      ticker: string;
      name: string;
      type: string;
    }> = await this.dataSource.query(
      'SELECT id, ticker, name, type FROM instruments ORDER BY ticker',
    );
    return rows.map(toInstrument);
  }
}
