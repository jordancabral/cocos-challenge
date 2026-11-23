---
description: "Task list for portfolio, búsqueda y órdenes"
---

# Tasks: Portfolio, búsqueda y órdenes

**Input**: Design documents from `/specs/001-portfolio-orders/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Incluidos. El constitution exige Jest y cobertura estrictamente mayor al 80 % en statements, branches, functions y lines. El challenge exige un test funcional de enviar una orden. Cada test se escribe primero y tiene que fallar antes de la implementación.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `test/` at repository root
- Paths follow `specs/001-portfolio-orders/plan.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create `package.json` with `"engines": { "node": ">=26.0.0 <27" }` and scripts `test`, `test:integration`, `lint` and `format`
- [X] T002 Create `tsconfig.json` with `"strict": true` covering `src/` and `test/`
- [X] T003 Add NestJS, TypeORM, `pg`, Zod, `decimal.js`, `nestjs-pino`, `@nestjs/swagger`, Jest, ESLint and Prettier to `package.json`
- [X] T004 [P] Configure ESLint to fail on errors and Prettier in `eslint.config.js` and `.prettierrc`
- [X] T005 [P] Configure Jest in `jest.config.ts` with projects `test/unit` and `test/integration`, and fail when statements, branches, functions or lines are `<= 80.00`
- [X] T006 [P] Add `Dockerfile` from `node:26` and `docker-compose.yml` with the API on port 3000, PostgreSQL, `DATABASE_URL`, network, healthchecks, and a mount of `db/database.sql` into the database init directory
- [X] T007 [P] Add the challenge schema and seed to `db/database.sql` (`users`, `instruments`, `orders`, `marketdata`; `price`, `close` and `previousClose` as `NUMERIC(10, 2)`; `orders.size` integer)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Write failing unit tests in `test/unit/domain/money.spec.ts` for exact centavos, no JavaScript `number`, and half-away-from-zero rounding to two decimals
- [X] T009 Implement `src/domain/money/money.ts` with `decimal.js` and `ROUND_HALF_UP`, satisfying "Un monto o un precio es un decimal exacto al centavo. En base es `NUMERIC(10, 2)`. En el dominio es un decimal fijo. En JSON es un string con dos decimales." and "El redondeo del porcentaje visible es mitad alejándose de cero, a dos decimales, y vive en un solo lugar del dominio."
- [X] T010 [P] Create domain types in `src/domain/account/account.ts`, `src/domain/instrument/instrument.ts`, `src/domain/order/order.ts` and `src/domain/market/market-price.ts` with `accountNumber` as the operation identity, `type` `ACCIONES` or `MONEDA`, `side` `BUY` `SELL` `CASH_IN` `CASH_OUT`, `type` `MARKET` or `LIMIT`, and `status` `NEW` `FILLED` `REJECTED` `CANCELLED`
- [X] T011 [P] Define repository and unit-of-work ports in `src/application/ports/repositories.ts` and `src/application/ports/unit-of-work.ts` with no NestJS, TypeORM or HTTP imports
- [X] T012 [P] Validate `DATABASE_URL` and `PORT` with Zod in `src/infrastructure/config/env.ts`
- [X] T013 [P] Add a JSON Pino logger that always includes `correlationId` in `src/infrastructure/logging/logger.ts`
- [X] T014 Read or generate `x-correlation-id` and echo it on the response in `src/infrastructure/http/correlation-id.middleware.ts`
- [X] T015 Map the existing tables with `synchronize: false` and numeric columns as strings in `src/infrastructure/persistence/data-source.ts` and `src/infrastructure/persistence/entities/`
- [X] T016 Convert database strings to domain money only at the edge in `src/infrastructure/persistence/mappers.ts`
- [X] T017 Map invalid input to 400, missing account, instrument or order to 404, and an illegal status change to 409 in `src/infrastructure/http/http-exception.filter.ts`
- [X] T018 Wire `src/app.module.ts`, `src/main.ts` and `GET /health` in `src/infrastructure/http/health.controller.ts` per `specs/001-portfolio-orders/contracts/openapi.yaml`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Consultar el portfolio (Priority: P1) 🎯 MVP

**Goal**: Una consulta devuelve el valor total, los pesos disponibles y las posiciones de una cuenta.

**Independent Test**: Con los datos de `db/database.sql`, `GET /accounts/10001/portfolio` devuelve disponibles `627500.00`, valor total `889756.00`, BMA `-10` / `-15028.00` sin rendimiento, METR `500` / `114750.00` / `-8.20` y PAMP `40` / `37034.00` / `-0.45`.

### Tests for User Story 1

- [X] T019 [P] [US1] Write failing portfolio tests in `test/unit/portfolio/calculate-portfolio.spec.ts` for the 10001 figures and for a pending buy that lowers only available pesos

### Implementation for User Story 1

- [X] T020 [US1] Implement `src/domain/portfolio/calculate-portfolio.ts` so that "Los pesos disponibles son los pesos ejecutados menos las reservas de compras `NEW`. El valor total es los pesos ejecutados más la suma de cantidades netas por el último `close`. La reserva no se resta del valor total." and "El rendimiento total es `(valor de mercado − costo) / costo`, en porcentaje con dos decimales. Si la cantidad no es positiva o el costo no es positivo, el rendimiento se omite y no se informa como cero."
- [X] T021 [US1] Implement `src/application/get-portfolio/get-portfolio.ts` using the ports, returning 404 when `accountNumber` does not exist
- [X] T022 [US1] Load filled and pending orders plus the latest `close` per instrument in `src/infrastructure/persistence/portfolio-read.adapter.ts`, ignoring `previousClose` because "No se muestra"
- [X] T023 [US1] Add `GET /accounts/:accountNumber/portfolio` in `src/infrastructure/http/portfolio.controller.ts` with Zod on the path and money fields as strings, matching `specs/001-portfolio-orders/contracts/openapi.yaml`

**Checkpoint**: User Story 1 is functional and testable without search, submit or cancel

---

## Phase 4: User Story 2 - Buscar activos (Priority: P2)

**Goal**: Un texto devuelve activos cuyo ticker o nombre coinciden, sin la moneda.

**Independent Test**: `q=teco` devuelve TECO2 una vez, `q=galicia` encuentra el nombre, `q=pesos` no devuelve ARS, y un `q` vacío responde 400.

### Tests for User Story 2

- [X] T024 [P] [US2] Write failing search tests in `test/unit/instrument/search-instruments.spec.ts` for partial, case-insensitive, accent-insensitive matches, ticker sort, and exclusion of `MONEDA`

### Implementation for User Story 2

- [X] T025 [US2] Implement `src/domain/instrument/search-instruments.ts` so that "`type` `ACCIONES` o `MONEDA`. La moneda es el peso (`ARS`) y no es una posición ni un resultado de búsqueda." and "`name` entra en la búsqueda"
- [X] T026 [US2] Implement `src/application/search-instruments/search-instruments.ts` rejecting an empty query before filtering
- [X] T027 [US2] Add `GET /instruments` in `src/infrastructure/http/instruments.controller.ts` with required query `q` (`minLength: 1`) and response fields `ticker`, `name` and `type` per `specs/001-portfolio-orders/contracts/openapi.yaml`

**Checkpoint**: User Stories 1 and 2 work independently

---

## Phase 5: User Story 3 - Enviar una orden (Priority: P3)

**Goal**: Una compra o venta a mercado queda ejecutada, una límite queda pendiente y reserva, y el exceso de disponible queda rechazado y registrado.

**Independent Test**: Contra PostgreSQL, una orden a mercado con disponible suficiente queda `FILLED` y mueve la tenencia; una por encima del disponible queda `REJECTED` sin moverla; una límite válida queda `NEW`, reserva el disponible y no cambia la cantidad ni el valor total.

### Tests for User Story 3

- [X] T028 [P] [US3] Write failing domain tests in `test/unit/order/submit-order.spec.ts` for market fill, limit reserve, equal-to-available acceptance, peso-amount flooring to whole shares, and invalid input that inserts nothing
- [X] T029 [P] [US3] Write the functional test in `test/integration/submit-order.spec.ts` against PostgreSQL for one `FILLED` market order, one `REJECTED` order, and one `NEW` limit order that reserves cash

### Implementation for User Story 3

- [X] T030 [US3] Implement `src/domain/order/submit-order.ts` with "Compra o venta válida a mercado → `FILLED`.", "Compra o venta válida límite → `NEW`.", "Costo mayor que los pesos disponibles, o cantidad mayor que las acciones disponibles → `REJECTED`.", "Exactamente uno de: cantidad entera positiva, o monto positivo en pesos.", "Con monto, la cantidad es el mayor entero cuyo costo no supera el monto. Si es cero, no se inserta orden.", and "El límite exige precio con hasta dos decimales. El mercado no lo exige; si viene, se ignora y se usa el último `close`."
- [X] T031 [US3] Implement `src/application/submit-order/submit-order.ts` inside one database transaction that locks the user row with `SELECT … FOR UPDATE` before reading availability. The lock lasts only that transaction, performs no external calls, does not block other accounts, and queues same-account orders
- [X] T032 [US3] Implement the transactional adapter in `src/infrastructure/persistence/order-unit-of-work.adapter.ts`, persisting `size` as a positive integer and `price` as `NUMERIC(10, 2)`
- [X] T033 [US3] Add `POST /orders` in `src/infrastructure/http/orders.controller.ts` with Zod, returning 201 for `FILLED`, `NEW` and `REJECTED`, 400 when no order is stored, and 404 for an unknown account or ticker, per `specs/001-portfolio-orders/contracts/openapi.yaml`

**Checkpoint**: Submit order is independently testable. Cancelling is not required yet because the seed already contains `NEW` orders

---

## Phase 6: User Story 4 - Cancelar una orden pendiente (Priority: P4)

**Goal**: Cancelar una orden propia `NEW` la pasa a `CANCELLED` y libera la reserva. Cualquier otro caso no escribe.

**Independent Test**: `POST /orders/5/cancellation` con la cuenta `10001` deja esa orden `CANCELLED` y los disponibles en `663000.00`. Repetir la cancelación responde 409. Cancelar una orden de otra cuenta responde 404.

### Tests for User Story 4

- [X] T034 [P] [US4] Write failing tests in `test/unit/order/cancel-order.spec.ts` for releasing a `NEW` buy reserve, a 409 on `FILLED`, `REJECTED` or `CANCELLED`, and a 404 for another account or a missing order

### Implementation for User Story 4

- [X] T035 [US4] Implement `src/domain/order/cancel-order.ts` with "Después del alta solo existe esta transición: `NEW` de la misma cuenta → `CANCELLED`." and "`FILLED`, `REJECTED` y `CANCELLED` no cambian."
- [X] T036 [US4] Implement `src/application/cancel-order/cancel-order.ts` in the same short user-row transaction as submit, so "Cancelar un `NEW` libera su reserva."
- [X] T037 [US4] Add `POST /orders/:orderId/cancellation` in `src/infrastructure/http/orders-cancellation.controller.ts` with body `accountNumber`, returning 200, 409 or 404 per `specs/001-portfolio-orders/contracts/openapi.yaml`

**Checkpoint**: All user stories are independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T038 Check the running API against `specs/001-portfolio-orders/contracts/openapi.yaml` and update that file in the same change if the contract moved
- [X] T039 [P] Add `postman/cocos-challenge.postman_collection.json` covering portfolio, search, submit and cancel
- [X] T040 [P] Write `README.md` with the purpose, the hexagonal layout, Node.js 26, Docker Compose, tests and the money rule
- [X] T041 Run lint, format, `npm test`, `npm run test:integration` and the checks in `specs/001-portfolio-orders/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independently testable; the seed already has cash and prices
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Independently testable against the seed `NEW` order id 5; does not require US3

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Domain policy before the use case
- Use case before the HTTP adapter
- Story complete before moving to the next priority when working solo

### Parallel Opportunities

- T004, T005, T006 and T007 can run in parallel after T003
- T010, T011, T012 and T013 can run in parallel after T009
- Once Foundational completes, US1, US2, US3 and US4 can start in parallel
- T028 and T029 can run in parallel
- T039 and T040 can run in parallel

---

## Parallel Example: User Story 3

```bash
# Tests first, together:
Task: "T028 Write failing domain tests in test/unit/order/submit-order.spec.ts"
Task: "T029 Write the functional test in test/integration/submit-order.spec.ts"

# After both fail for the missing behavior:
Task: "T030 Implement src/domain/order/submit-order.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: `GET /accounts/10001/portfolio` matches the independent test
5. Demo the portfolio before search and orders

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. User Story 1 → portfolio demo (MVP)
3. User Story 2 → search demo
4. User Story 3 → submit-order demo, including the functional PostgreSQL test
5. User Story 4 → cancel demo
6. Polish → OpenAPI, Postman, README and quickstart

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
   - Developer D: User Story 4
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The same-account pessimistic lock stays. Do not hold it across external calls
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
