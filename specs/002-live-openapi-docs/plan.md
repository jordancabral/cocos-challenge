# Implementation Plan: Documentación viva para probar en local

**Branch**: `002-live-openapi-docs` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-live-openapi-docs/spec.md`

## Summary

El sistema publica una página en `/docs` y la descripción OpenAPI en
`/docs-json`, armadas al arrancar desde los controllers. Cada operación
pública trae un ejemplo `local` listo para ejecutar contra
`http://localhost:3000`. Un test impide que una ruta nueva quede fuera del
documento.

## Technical Context

**Language/Version**: TypeScript strict sobre Node.js 26 Active LTS

**Primary Dependencies**: NestJS y `@nestjs/swagger` (ya declarado en el
proyecto). Zod sigue validando el borde.

**Storage**: Ninguno nuevo. Los ejemplos usan los datos de referencia ya
cargados.

**Testing**: Jest. Un test del módulo HTTP compara las rutas públicas
registradas con el documento generado.

**Target Platform**: El mismo servicio que ya corre en local o en dev.

**Project Type**: web-service

**Performance Goals**: Ninguno. Ni la spec ni el constitution definen un SLO
para esta página.

**Constraints**: La documentación vive en el adapter HTTP. El dominio no
importa Swagger. Los montos de ejemplo son strings con dos decimales. La
copia versionada se genera; no se edita a mano.

**Scale/Scope**: Las operaciones públicas actuales (salud, portfolio,
búsqueda, envío y cancelación) y las que se agreguen después en los
controllers.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Revisión previa a research:

- Arquitectura hexagonal: Swagger queda en `src/infrastructure/http` y en el
  arranque. El dominio y los casos de uso no lo importan.
- Exactitud monetaria: los ejemplos de montos son texto con centavos.
- Integridad transaccional: no cambia. Envío y cancelación siguen en su
  transacción.
- Tests: Jest cubre que cada ruta pública esté en el documento.
- Borde: Zod sigue siendo quien valida. Los decoradores solo documentan.
- Stack: `@nestjs/swagger` ya está permitido como librería del adapter HTTP.
  No hace falta otra dependencia.
- Documentación: el OpenAPI versionado de esta feature se genera desde el
  mismo armado que sirve la página.

Ninguna puerta falla.

Revisión posterior al diseño:

- `GET /docs` y `GET /docs-json` salen del mismo documento.
- Los ejemplos `local` coinciden con la spec y con los datos de referencia.
- `/docs` y `/docs-json` no se publican como operaciones de negocio.
- Sigue sin SLO inventado.

Las puertas siguen en pie.

## Project Structure

### Documentation (this feature)

```text
specs/002-live-openapi-docs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── docs.md
└── tasks.md              # /speckit-tasks, no lo crea este comando
```

### Source Code (repository root)

```text
src/infrastructure/http/
├── openapi.ts            # armado del documento y ejemplos local
├── health.controller.ts
├── portfolio.controller.ts
├── instruments.controller.ts
├── orders.controller.ts
└── orders-cancellation.controller.ts
src/main.ts               # publica /docs y /docs-json
test/unit/http/
└── openapi.spec.ts       # rutas públicas presentes en el documento
```

**Structure Decision**: No hay módulo de dominio nuevo. La metadata vive
junto a cada controller y el armado común vive en `openapi.ts`, que `main.ts`
usa para servir la página y el JSON.

## Complexity Tracking

No aplica. El diseño no abre excepciones al constitution.
