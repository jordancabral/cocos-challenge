---
description: "Task list for búsquedas acotadas de cuenta, activo, órdenes y precios"
---

# Tasks: Búsquedas acotadas de cuenta, activo, órdenes y precios

**Input**: Design documents from `/specs/004-lookup-indexes/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Incluidos. El plan pide comprobar en PostgreSQL que los cuatro índices existen y que repetir `accountnumber` o `ticker` se rechaza. El portfolio de `10001` se vuelve a verificar con el test de dominio que ya existe. Cada test nuevo se escribe primero y tiene que fallar antes de la implementación.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `test/` at repository root
- Paths follow `specs/004-lookup-indexes/plan.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Keep the current persistence stack. This feature adds indexes, not a dependency

- [X] T001 Confirm `synchronize: false` stays in `src/infrastructure/persistence/data-source.ts` and that `package.json` gains no dependency. Do not index `instruments.name`, `orders.status`, `orders.side`, or `(instrumentid, date)`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: A versioned TypeORM migration can be applied by hand. Application startup does not migrate

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Register `migrations: persistenceMigrations` and `migrationsRun: false` in `postgresOptions` inside `src/infrastructure/persistence/data-source.ts`, export an empty `persistenceMigrations` array from `src/infrastructure/persistence/migrations/index.ts`, add `src/run-migrations.ts` that calls `loadEnv()`, `createDataSource(env.DATABASE_URL)`, `initialize()`, `runMigrations()`, and `destroy()`, and add `"migration:run": "tsc -p tsconfig.json && node dist/run-migrations.js"` to `package.json`. Assert `synchronize: false` and `migrationsRun: false` in `test/unit/persistence/data-source.spec.ts`. Do not call `runMigrations` from `src/main.ts` or `src/app.module.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Una cuenta y un ticker, una sola vez (Priority: P1) 🎯 MVP

**Goal**: Un segundo registro con el mismo número de cuenta o el mismo ticker se rechaza, y el registro original sigue igual.

**Independent Test**: Repetir el número de cuenta `10001` y el ticker `GGAL` se rechaza. Consultar esa cuenta o ese ticker sigue devolviendo un solo resultado.

### Tests for User Story 1

- [X] T003 [US1] Write a failing integration test in `test/integration/lookup-indexes.spec.ts` that starts its own PostgreSQL container `cocos-pg-indexes` on port `54330` (do not reuse `cocos-pg-test` or port `54329` from `test/integration/submit-order.spec.ts`), loads `db/database.sql`, and expects unique indexes `users_accountnumber_uidx` on `users (accountnumber)` and `instruments_ticker_uidx` on `instruments (ticker)`. Drop those two indexes, run the TypeORM migrations from `createDataSource`, and expect them back. A second `INSERT` of `accountnumber` `10001` and of `ticker` `GGAL` fails, and the original rows stay unchanged. Constraint from `data-model.md`: "`accountnumber` | Único. Nombre `users_accountnumber_uidx`" and "`ticker` | Único. Nombre `instruments_ticker_uidx`". "No se acepta otro registro con el mismo valor."

### Implementation for User Story 1

- [X] T004 [P] [US1] Create `src/infrastructure/persistence/migrations/1732464000000-LookupIndexes.ts` with class `LookupIndexes1732464000000` and register it in `persistenceMigrations` in `src/infrastructure/persistence/migrations/index.ts`. `up` runs `CREATE UNIQUE INDEX IF NOT EXISTS users_accountnumber_uidx ON users (accountnumber)` and `CREATE UNIQUE INDEX IF NOT EXISTS instruments_ticker_uidx ON instruments (ticker)`, using those lowercase column names. `down` drops those two indexes with `DROP INDEX IF EXISTS`. Do not delete or rewrite existing rows
- [X] T005 [P] [US1] Append those same two `CREATE UNIQUE INDEX IF NOT EXISTS` statements to `db/database.sql` after the `marketdata` `CREATE TABLE` and before the first `INSERT`
- [X] T006 [P] [US1] Declare `@Index('users_accountnumber_uidx', ['accountNumber'], { unique: true })` on `src/infrastructure/persistence/entities/user.entity.ts`. The mapped column remains `accountnumber`
- [X] T007 [P] [US1] Declare `@Index('instruments_ticker_uidx', ['ticker'], { unique: true })` on `src/infrastructure/persistence/entities/instrument.entity.ts`

**Checkpoint**: User Story 1 is testable on its own. A duplicate account number or ticker is rejected and the original row remains

---

## Phase 4: User Story 2 - Órdenes y precios de una sola persona o un solo activo (Priority: P2)

**Goal**: Las órdenes se buscan por cuenta y los precios por activo. Varias órdenes de una cuenta y varias sesiones de un activo siguen siendo válidas.

**Independent Test**: Con órdenes de más de una cuenta, el portfolio de `10001` sigue saliendo de las órdenes de esa cuenta. El precio de `GGAL` sigue siendo el último cierre de `GGAL`.

### Tests for User Story 2

- [X] T008 [US2] Extend `test/integration/lookup-indexes.spec.ts` so it fails until non-unique indexes `orders_userid_idx` on `orders (userid)` and `marketdata_instrumentid_idx` on `marketdata (instrumentid)` exist, survive a drop plus `runMigrations`, and their definitions do not include `date`, `instruments.name`, `orders.status`, or `orders.side`. Constraint from `data-model.md`: "`userid` | No único. Nombre `orders_userid_idx`" and "`instrumentid` | No único. Nombre `marketdata_instrumentid_idx`". "No se agrega `date` al índice." "No se indexan `instruments.name`, `orders.status`, `orders.side` ni una búsqueda por fragmento."

### Implementation for User Story 2

- [X] T009 [P] [US2] Add `CREATE INDEX IF NOT EXISTS orders_userid_idx ON orders (userid)` and `CREATE INDEX IF NOT EXISTS marketdata_instrumentid_idx ON marketdata (instrumentid)` to `up` in `src/infrastructure/persistence/migrations/1732464000000-LookupIndexes.ts`, and drop those two names in `down`. The `marketdata` index lists only `instrumentid`
- [X] T010 [P] [US2] Append those same two `CREATE INDEX IF NOT EXISTS` statements to `db/database.sql` next to the unique indexes added in T005
- [X] T011 [P] [US2] Declare `@Index('orders_userid_idx', ['userId'])` on `src/infrastructure/persistence/entities/order.entity.ts`. Leave the column mapped as `userid` and do not mark the index unique
- [X] T012 [P] [US2] Declare `@Index('marketdata_instrumentid_idx', ['instrumentId'])` on `src/infrastructure/persistence/entities/market-data.entity.ts`. Leave the column mapped as `instrumentid` and do not add `date` to the index

**Checkpoint**: Both stories work. Lookups are scoped, and multiple orders or price sessions for the same owner remain valid

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Tell operators how to apply the migration, then run the quickstart

- [X] T013 Document in `README.md` that a fresh local database receives the indexes from `db/database.sql`, and that an existing local volume or the Neon database needs `npm run migration:run`. State that startup does not run migrations and that `db/database.sql` is not executed against Neon
- [X] T014 Run the checks in `specs/004-lookup-indexes/quickstart.md`: the four index names exist, the two account and ticker indexes are unique, duplicate `10001` and `GGAL` are rejected, and `npm test` still shows account `10001` with available pesos `627500.00` and total value `889756.00` in `test/unit/portfolio/calculate-portfolio.spec.ts`. Also run `npm run test:integration`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Adds two indexes to the migration and seed created for US1. Independently testable by checking `orders_userid_idx` and `marketdata_instrumentid_idx` without repeating the uniqueness cases

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- The migration class exists before the non-unique indexes are added to it
- `db/database.sql` repeats the same `CREATE INDEX IF NOT EXISTS` statements as the migration
- Entity `@Index` declarations match the index names and do not create schema by themselves because `synchronize` stays false
- Story complete before moving to the next priority when working solo

### Parallel Opportunities

- T004, T005, T006, and T007 touch different files and can run together after T003
- T009, T010, T011, and T012 touch different files and can run together after T008
- US1 and US2 should not edit `src/infrastructure/persistence/migrations/1732464000000-LookupIndexes.ts`, `db/database.sql`, or `test/integration/lookup-indexes.spec.ts` at the same time
- T013 and T014 are sequential: document the command, then run the quickstart

---

## Parallel Example: User Story 1

```bash
# After T003 is failing:
Task: "T004 Create src/infrastructure/persistence/migrations/1732464000000-LookupIndexes.ts"
Task: "T005 Append the two unique indexes to db/database.sql"
Task: "T006 Declare users_accountnumber_uidx on src/infrastructure/persistence/entities/user.entity.ts"
Task: "T007 Declare instruments_ticker_uidx on src/infrastructure/persistence/entities/instrument.entity.ts"
```

---

## Parallel Example: User Story 2

```bash
# After T008 is failing:
Task: "T009 Add orders_userid_idx and marketdata_instrumentid_idx to the migration"
Task: "T010 Append those indexes to db/database.sql"
Task: "T011 Declare orders_userid_idx on src/infrastructure/persistence/entities/order.entity.ts"
Task: "T012 Declare marketdata_instrumentid_idx on src/infrastructure/persistence/entities/market-data.entity.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Duplicate `accountnumber` `10001` and `ticker` `GGAL` are rejected, and the original rows stay
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → migrations can be run by hand, and startup does not migrate
2. Add User Story 1 → unique account number and ticker (MVP)
3. Add User Story 2 → orders by account and prices by instrument
4. Polish → README explains when to run `npm run migration:run`, and the quickstart passes

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 migration, seed, and the two unique entities
   - Developer B: User Story 2 only after the migration file and `db/database.sql` from User Story 1 exist, because those two files are shared
3. Stories complete and the portfolio figures stay the ones already covered by `test/unit/portfolio/calculate-portfolio.spec.ts`

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Do not change domain money rules, portfolio formulas, or HTTP contracts
- Column names in SQL are the folded PostgreSQL names: `accountnumber`, `ticker`, `userid`, `instrumentid`
- Avoid: a second migration file, `synchronize: true`, `migrationsRun: true`, an index on `date`, and running `db/database.sql` against Neon
