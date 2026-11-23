import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadEnv } from './infrastructure/config/env';
import { correlationMiddleware } from './infrastructure/http/correlation-id.middleware';
import { HttpExceptionFilter } from './infrastructure/http/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(correlationMiddleware);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(loadEnv().PORT, '0.0.0.0');
}

void bootstrap();
