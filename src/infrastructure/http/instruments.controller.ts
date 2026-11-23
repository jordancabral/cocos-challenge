import { Controller, Get, Inject, Query } from '@nestjs/common';
import { z } from 'zod';
import { SearchInstruments } from '../../application/search-instruments/search-instruments';

const querySchema = z.object({
  q: z.string().trim().min(1, 'Search text is required'),
});

@Controller('instruments')
export class InstrumentsController {
  constructor(
    @Inject(SearchInstruments)
    private readonly searchInstruments: SearchInstruments,
  ) {}

  @Get()
  async search(@Query() query: Record<string, unknown>) {
    const parsed = querySchema.parse(query);
    return this.searchInstruments.execute(parsed.q);
  }
}
