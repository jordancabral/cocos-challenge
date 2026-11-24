import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadEnv } from './infrastructure/config/env';
import { correlationMiddleware } from './infrastructure/http/correlation-id.middleware';
import { HttpExceptionFilter } from './infrastructure/http/http-exception.filter';
import { mountOpenApi } from './infrastructure/http/openapi';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(correlationMiddleware);
  app.useGlobalFilters(new HttpExceptionFilter());
  mountOpenApi(app);
  await app.listen(loadEnv().PORT, '0.0.0.0');
}

void bootstrap();
