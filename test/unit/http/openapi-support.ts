import { INestApplication } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { createDocumentationApplication } from '../../../src/infrastructure/http/documentation-app';
import { createOpenApiDocument } from '../../../src/infrastructure/http/openapi';

export async function documentedApp(): Promise<{
  app: INestApplication;
  document: OpenAPIObject;
}> {
  const app = await createDocumentationApplication();
  return { app, document: createOpenApiDocument(app) };
}

export function operation(
  document: OpenAPIObject,
  path: string,
  method: 'get' | 'post',
) {
  return document.paths?.[path]?.[method];
}

export function hasLocalExample(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (
    'examples' in value &&
    value.examples &&
    typeof value.examples === 'object' &&
    'local' in value.examples
  ) {
    return true;
  }
  return Object.values(value).some((child) => hasLocalExample(child));
}
