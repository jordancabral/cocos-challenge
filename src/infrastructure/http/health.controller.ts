import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Estado del sistema' })
  @ApiOkResponse({
    description: 'El sistema está en marcha',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', example: 'ok' } },
        },
        examples: {
          local: { summary: 'local', value: { status: 'ok' } },
        },
      },
    },
  })
  health(): { status: string } {
    return { status: 'ok' };
  }
}
