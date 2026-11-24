# Implementation Plan: Búsquedas acotadas de cuenta, activo, órdenes y precios

**Branch**: `004-lookup-indexes` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-lookup-indexes/spec.md`

## Summary

Se agregan cuatro índices sobre columnas que la API ya usa para buscar. El
número de cuenta y el ticker quedan únicos. Las órdenes se buscan por cuenta
y los precios por activo. No cambia ninguna respuesta de negocio.

## Technical Context

**Language/Version**: TypeScript strict sobre Node.js 26 Active LTS

**Primary Dependencies**: TypeORM, para una migración versionada. PostgreSQL
es la base ya usada.

**Storage**: PostgreSQL. Índices nuevos, sin columnas nuevas. `synchronize`
sigue apagado.

**Testing**: Comprobar en la base que los cuatro índices existen y que un
duplicado de `accountnumber` o de `ticker` se rechaza. El portfolio de
`10001` se vuelve a verificar con el test de dominio que ya existe.

**Target Platform**: La base local de Docker y la base Neon de dev.

**Project Type**: web-service

**Performance Goals**: Ninguno numérico. La spec pide que la búsqueda de una
cuenta, un ticker, las órdenes de una cuenta o los precios de un activo no
dependa del resto de las filas.

**Constraints**: Migración versionada. Los mismos `CREATE INDEX IF NOT EXISTS`
en `db/database.sql`. No indexar nombre, estado ni fecha. No tocar el
dominio.

**Scale/Scope**: Cuatro índices. Los datos de referencia se conservan.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Revisión previa a research:

- Arquitectura hexagonal: el cambio está en el adapter de persistencia y en
  el esquema. El dominio no se entera.
- Exactitud monetaria: no cambian columnas de dinero ni redondeos.
- Integridad transaccional: el bloqueo de la cuenta sigue igual. El índice
  único solo impide dos cuentas con el mismo número.
- Tests: la comprobación es de esquema y de que el portfolio no cambia.
- Migración: el constitution la exige. Va versionada, no con `synchronize`.
- Documentación: no hay contrato HTTP nuevo. El README puede decir que la
  migración se aplica en local y en Neon.

Ninguna puerta falla.

Revisión posterior al diseño:

- Los cuatro índices coinciden con los cuatro accesos de la spec.
- No se agrega índice de búsqueda por nombre ni por fecha.
- `IF NOT EXISTS` permite que Docker y la migración convivan.
- Sigue sin SLO inventado.

Las puertas siguen en pie.

## Project Structure

### Documentation (this feature)

```text
specs/004-lookup-indexes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── indexes.md
└── tasks.md              # /speckit-tasks, no lo crea este comando
```

### Source Code (repository root)

```text
db/database.sql
src/infrastructure/persistence/migrations/
└── <timestamp>-LookupIndexes.ts
src/infrastructure/persistence/entities/user.entity.ts
src/infrastructure/persistence/entities/instrument.entity.ts
src/infrastructure/persistence/entities/order.entity.ts
src/infrastructure/persistence/entities/market-data.entity.ts
```

**Structure Decision**: La migración es la fuente que se aplica a una base ya
creada. `db/database.sql` repite los índices para el primer arranque de
Docker. Las entidades declaran los mismos índices para que el mapeo no
mienta. No hay cambio de dominio ni de controllers.

## Complexity Tracking

No aplica. El diseño no abre excepciones al constitution.
