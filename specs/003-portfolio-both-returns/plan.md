# Implementation Plan: Rendimiento total y retorno diario

**Branch**: `003-portfolio-both-returns` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-portfolio-both-returns/spec.md`

## Summary

El portfolio de cada posición sigue informando el rendimiento total contra el costo y agrega el retorno diario del precio. El cierre previo sale de la misma fila de `marketdata` que ya aporta el último cierre. El cálculo reutiliza el redondeo monetario existente.

## Technical Context

**Language/Version**: TypeScript strict sobre Node.js 26 Active LTS

**Primary Dependencies**: Las ya usadas. `decimal.js` a través de `Money`. TypeORM solo como adapter de lectura.

**Storage**: PostgreSQL. Se lee `marketdata.previousclose` junto con `close`. No hay cambio de esquema.

**Testing**: Jest, sin base para el cálculo. El caso de la cuenta `10001` y las omisiones quedan en `test/unit/portfolio/calculate-portfolio.spec.ts`.

**Target Platform**: El mismo servicio local o dev.

**Project Type**: web-service

**Performance Goals**: Ninguno. La spec no define un SLO. La lectura agrega una columna a la consulta que ya existe.

**Constraints**: Sin `number` para precios ni porcentajes. Un solo lugar de redondeo. El dominio no importa TypeORM. `dailyReturnPercent` es `null` cuando no se calcula, nunca un cero inventado.

**Scale/Scope**: Una columna nueva en la posición del portfolio. La búsqueda y las órdenes no cambian.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Revisión previa a research:

- Arquitectura hexagonal: el retorno se calcula en el dominio. El adapter solo lee `close` y `previousclose`.
- Exactitud monetaria: ambos porcentajes pasan por `Money.returnPercentAgainst`. No hay un segundo redondeo.
- Integridad transaccional: no se escriben saldos ni estados.
- Tests: el caso `10001` y las omisiones son tests de dominio, sin base.
- Borde: el JSON sigue siendo string decimal o `null`.
- Documentación: el campo nuevo entra en el OpenAPI generado.

Ninguna puerta falla.

Revisión posterior al diseño:

- El contrato nombra `dailyReturnPercent` y fija las cifras de `10001`.
- BMA lleva diario `-1.15` y total `null`.
- La búsqueda queda fuera.
- Sigue sin SLO inventado.

Las puertas siguen en pie.

## Project Structure

### Documentation (this feature)

```text
specs/003-portfolio-both-returns/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── portfolio.md
└── tasks.md              # /speckit-tasks, no lo crea este comando
```

### Source Code (repository root)

```text
src/domain/portfolio/calculate-portfolio.ts
src/application/ports/repositories.ts
src/application/get-portfolio/get-portfolio.ts
src/infrastructure/persistence/portfolio-read.adapter.ts
src/infrastructure/http/portfolio.controller.ts
test/unit/portfolio/calculate-portfolio.spec.ts
```

**Structure Decision**: No hay módulo nuevo. El puerto de lectura pasa de un mapa de cierres a un mapa de cotizaciones con cierre y cierre previo. El dominio calcula el porcentaje nuevo. El controller lo documenta para que `/docs` lo muestre.

## Complexity Tracking

No aplica. El diseño no abre excepciones al constitution.
