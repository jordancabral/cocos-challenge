import { Controller, Get, Inject, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import { SearchInstruments } from '../../application/search-instruments/search-instruments';
import { localSearchText } from './openapi';

const querySchema = z.object({
  q: z.string().trim().min(1, 'Search text is required'),
});

@ApiTags('instruments')
@Controller('instruments')
export class InstrumentsController {
  constructor(
    @Inject(SearchInstruments)
    private readonly searchInstruments: SearchInstruments,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Buscar activos por ticker o nombre' })
  @ApiQuery({
    name: 'q',
    required: true,
    example: localSearchText,
    examples: {
      local: { summary: 'local', value: localSearchText },
    },
  })
  @ApiOkResponse({ description: 'Activos que coinciden, sin la moneda' })
  @ApiBadRequestResponse({ description: 'Falta el texto de búsqueda' })
  async search(@Query() query: Record<string, unknown>) {
    const parsed = querySchema.parse(query);
    return this.searchInstruments.execute(parsed.q);
  }
}
