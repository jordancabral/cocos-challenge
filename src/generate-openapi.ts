import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { createDocumentationApplication } from './infrastructure/http/documentation-app';
import { createOpenApiDocument } from './infrastructure/http/openapi';

async function generate(): Promise<void> {
  const app = await createDocumentationApplication();
  const document = createOpenApiDocument(app);
  writeFileSync(
    'specs/002-live-openapi-docs/contracts/openapi.json',
    `${JSON.stringify(document, null, 2)}\n`,
  );
  await app.close();
}

void generate();
