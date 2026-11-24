import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { Order } from './order.schema';

export const moneySchema = {
  type: 'string',
  pattern: '^-?\\d+\\.\\d{2}$',
  example: '627500.00',
} as const;

export const localAccountNumber = '10001';
export const localSearchText = 'teco';
export const localOrderExample = {
  accountNumber: localAccountNumber,
  ticker: 'GGAL',
  side: 'BUY',
  type: 'MARKET',
  quantity: 1,
} as const;
export const localOrderAmountExample = {
  accountNumber: localAccountNumber,
  ticker: 'GGAL',
  side: 'BUY',
  type: 'MARKET',
  amount: '1000.00',
} as const;
export const localOrderLimitExample = {
  accountNumber: localAccountNumber,
  ticker: 'GGAL',
  side: 'BUY',
  type: 'LIMIT',
  quantity: 1,
  price: '800.00',
} as const;
export const localCancelExample = {
  accountNumber: localAccountNumber,
  orderId: 5,
} as const;

export function openApiConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('Cocos Challenge API')
    .setDescription(
      'Portfolio, búsqueda y órdenes. Los montos son texto con dos decimales. Los ejemplos local pegan a http://localhost:3000.',
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3000')
    .build();
}

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(app, openApiConfig(), {
    extraModels: [Order],
  });
}

export function mountOpenApi(app: INestApplication): OpenAPIObject {
  const document = createOpenApiDocument(app);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
  });
  return document;
}
