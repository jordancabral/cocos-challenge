import { ApiProperty } from '@nestjs/swagger';

export class Order {
  @ApiProperty({ type: 'integer' })
  id!: number;

  @ApiProperty({ type: 'string', example: '10001' })
  accountNumber!: string;

  @ApiProperty({ type: 'string', example: 'GGAL' })
  ticker!: string;

  @ApiProperty({ enum: ['BUY', 'SELL', 'CASH_IN', 'CASH_OUT'] })
  side!: 'BUY' | 'SELL' | 'CASH_IN' | 'CASH_OUT';

  @ApiProperty({ enum: ['MARKET', 'LIMIT'] })
  type!: 'MARKET' | 'LIMIT';

  @ApiProperty({
    type: 'integer',
    description: 'Acciones enteras registradas en size.',
  })
  quantity!: number;

  @ApiProperty({
    type: 'string',
    pattern: '^-?\\d+\\.\\d{2}$',
    example: '627500.00',
  })
  price!: string;

  @ApiProperty({ enum: ['NEW', 'FILLED', 'REJECTED', 'CANCELLED'] })
  status!: 'NEW' | 'FILLED' | 'REJECTED' | 'CANCELLED';
}
