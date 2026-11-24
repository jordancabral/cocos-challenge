import { INestApplication } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { createDocumentationApplication } from '../../../src/infrastructure/http/documentation-app';
import { createOpenApiDocument } from '../../../src/infrastructure/http/openapi';
import { hasLocalExample } from './openapi-support';

interface ExpressRoute {
  path?: string | string[];
  methods?: Record<string, boolean>;
}

interface ExpressLayer {
  route?: ExpressRoute;
}

interface ExpressLike {
  router?: { stack?: ExpressLayer[] };
  _router?: { stack?: ExpressLayer[] };
}

function registeredRoutes(app: INestApplication): string[] {
  const instance = app.getHttpAdapter().getInstance() as ExpressLike;
  const stack = instance.router?.stack ?? instance._router?.stack ?? [];
  const routes: string[] = [];
  for (const layer of stack) {
    const route = layer.route;
    if (!route?.path || !route.methods) {
      continue;
    }
    const paths = Array.isArray(route.path) ? route.path : [route.path];
    for (const path of paths) {
      for (const [method, enabled] of Object.entries(route.methods)) {
        if (enabled) {
          routes.push(`${method.toLowerCase()} ${normalizePath(path)}`);
        }
      }
    }
  }
  return routes;
}

function normalizePath(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function documentedOperations(document: OpenAPIObject): string[] {
  const operations: string[] = [];
  for (const [path, item] of Object.entries(document.paths ?? {})) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      if (item?.[method]) {
        operations.push(`${method} ${path}`);
      }
    }
  }
  return operations;
}

describe('OpenAPI stays aligned with public routes', () => {
  it('includes every public route and rejects a route without a local example', async () => {
    const app = await createDocumentationApplication();
    const document = createOpenApiDocument(app);
    const documented = new Set(documentedOperations(document));

    expect(documented.has('get /docs')).toBe(false);
    expect(documented.has('get /docs-json')).toBe(false);

    const businessRoutes = registeredRoutes(app).filter(
      (route) => route !== 'get /docs' && route !== 'get /docs-json',
    );
    expect(businessRoutes.length).toBeGreaterThan(0);
    for (const route of businessRoutes) {
      expect(documented.has(route)).toBe(true);
      const [method, path] = route.split(' ');
      const operation =
        document.paths?.[path ?? '']?.[method as 'get' | 'post'];
      expect(hasLocalExample(operation)).toBe(true);
    }
    await app.close();
  });
});
