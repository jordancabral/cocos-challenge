import { Instrument } from '../../domain/instrument/instrument';
import { searchInstruments } from '../../domain/instrument/search-instruments';
import { InvalidRequestError } from '../errors';
import { AppLogger } from '../logging/app-logger';
import { InstrumentReader } from '../ports/repositories';

export class SearchInstruments {
  constructor(
    private readonly reader: InstrumentReader,
    private readonly logger: AppLogger,
  ) {}

  async execute(
    query: string,
  ): Promise<{ items: Pick<Instrument, 'ticker' | 'name' | 'type'>[] }> {
    if (query.trim().length === 0) {
      throw new InvalidRequestError('Search text is required');
    }
    const instruments = await this.reader.listAll();
    const items = searchInstruments(instruments, query).map((instrument) => ({
      ticker: instrument.ticker,
      name: instrument.name,
      type: instrument.type,
    }));
    this.logger.info('instruments searched', { count: items.length });
    return { items };
  }
}
