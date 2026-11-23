# Implementation Plan: Portfolio, búsqueda y órdenes

**Branch**: `001-portfolio-orders` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-portfolio-orders/spec.md`

## Summary

La API deja consultar el portfolio de una cuenta, buscar activos y enviar o
cancelar órdenes, con las reservas y el rendimiento definidos en la spec.
NestJS, TypeORM y PostgreSQL viven en los adapters. El dominio calcula dinero
con decimal fijo sobre el esquema de `database.sql`, sin cambiarlo.

## Technical Context

**Language/Version**: TypeScript strict sobre Node.js 26 Active LTS

**Primary Dependencies**: NestJS, TypeORM, Zod, decimal.js, Pino,
@nestjs/swagger

**Storage**: PostgreSQL. Esquema y datos iniciales de `database.sql`. Sin
cambio de esquema en esta feature.

**Testing**: Jest. Tests de dominio sin base ni red, cobertura estrictamente
mayor al 80 % en statements, branches, functions y lines. Un test funcional
de enviar una orden contra PostgreSQL.

**Target Platform**: Contenedor Linux con la imagen oficial `node:26`, más
PostgreSQL en Docker Compose.

**Project Type**: web-service

**Performance Goals**: Ninguno. Ni el challenge ni el constitution definen
latencia ni volumen, y este plan no inventa un SLO.

**Constraints**: Sin `number` para dinero. Órdenes y reservas en una
transacción con bloqueo pesimista de la cuenta. Ese lock no frena a otras
cuentas; sí encola las órdenes simultáneas de la misma cuenta y no debe
sostenerse mientras se llama a algo externo. Sin autenticación. Logs JSON
con `correlationId`. OpenAPI, colección de Postman y README.

**Scale/Scope**: El dataset de referencia (cuatro cuentas, el catálogo de
acciones y las órdenes de ejemplo) más las órdenes que se creen encima. Un
solo proceso.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Revisión previa a research:

- Arquitectura hexagonal: el plan pone NestJS y TypeORM fuera del dominio.
- Exactitud monetaria: decimal fijo, `NUMERIC(10, 2)` ya presente, JSON en
  string. No hay float.
- Integridad transaccional: una transacción por alta o cancelación, bloqueo
  pesimista, una sola transición posterior (`NEW` → `CANCELLED`).
- Tests: Jest, umbral estricto mayor al 80 %, dominio sin infraestructura, y
  el test funcional que pide el challenge.
- Borde: TypeScript strict, Zod, ESLint y Prettier como puerta.
- Observabilidad: log JSON y `x-correlation-id`.
- Stack: Node 26, NestJS, TypeORM, Docker Compose con healthchecks.
- Documentación: OpenAPI versionado, Postman y README.

Ninguna puerta falla. No hay violación para la tabla de complejidad.

Revisión posterior al diseño:

- El contrato usa string decimal para montos y porcentajes.
- El modelo no agrega columnas: el bloqueo pesimista y el filtro de búsqueda
  en memoria evitan una migración.
- Los casos de uso siguen dependiendo de ports. El contrato HTTP no entra al
  dominio.
- Sigue sin SLO inventado.

Las puertas siguen en pie.

## Project Structure

### Documentation (this feature)

```text
specs/001-portfolio-orders/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md              # /speckit-tasks, no lo crea este comando
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── money/
│   ├── account/
│   ├── instrument/
│   ├── order/
│   └── portfolio/
├── application/
│   ├── ports/
│   ├── get-portfolio/
│   ├── search-instruments/
│   ├── submit-order/
│   └── cancel-order/
├── infrastructure/
│   ├── persistence/
│   ├── http/
│   ├── logging/
│   └── config/
└── main.ts

test/
├── unit/
└── integration/

postman/
└── cocos-challenge.postman_collection.json
```

**Structure Decision**: Un solo servicio. `domain` y `application` no importan
NestJS, TypeORM ni HTTP. `infrastructure/http` adapta el contrato de
`contracts/openapi.yaml`. `infrastructure/persistence` mapea las tablas
existentes. Los tests de unidad cubren dinero, rendimiento, reserva y
transiciones. El test de integración cubre la función de enviar una orden
contra PostgreSQL.

## Complexity Tracking

No aplica. El diseño no abre excepciones al constitution.
