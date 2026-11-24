---
description: "Task list for documentación viva OpenAPI"
---

# Tasks: Documentación viva para probar en local

**Input**: Design documents from `/specs/002-live-openapi-docs/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Incluidos. La spec pide comprobar que la documentación sigue a las operaciones, y el plan fija un test de Jest que compara las rutas públicas con el documento generado. Cada test se escribe primero y tiene que fallar antes de la implementación.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `test/` at repository root
- Paths follow `specs/002-live-openapi-docs/plan.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the documentation library already chosen for the HTTP adapter

- [X] T001 Confirm `@nestjs/swagger` is a dependency in `package.json` and is not imported from `src/domain` or `src/application`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: One document builder shared by the page and the JSON

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create `src/infrastructure/http/openapi.ts` with the OpenAPI builder, server `http://localhost:3000`, and money fields documented as the pattern `^-?\d+\.\d{2}$`
- [X] T003 Serve the page at `GET /docs` and the document at `GET /docs-json` from `src/main.ts` using `src/infrastructure/http/openapi.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Ver las operaciones actuales (Priority: P1) 🎯 MVP

**Goal**: La página y el JSON muestran todas las operaciones públicas, con entradas y resultados.

**Independent Test**: Con el sistema en marcha, `/docs` lista salud, portfolio, búsqueda, envío y cancelación, y `/docs-json` describe las mismas operaciones.

### Tests for User Story 1

- [X] T004 [US1] Write a failing test in `test/unit/http/openapi-catalog.spec.ts` that the document includes `/health`, `/accounts/{accountNumber}/portfolio`, `/instruments`, `/orders` and `/orders/{orderId}/cancellation`, with money fields matching `^-?\d+\.\d{2}$`

### Implementation for User Story 1

- [X] T005 [P] [US1] Document inputs and success plus rejection responses on `src/infrastructure/http/health.controller.ts`
- [X] T006 [P] [US1] Document inputs and success plus rejection responses on `src/infrastructure/http/portfolio.controller.ts`
- [X] T007 [P] [US1] Document inputs and success plus rejection responses on `src/infrastructure/http/instruments.controller.ts`
- [X] T008 [P] [US1] Document inputs and the 201, 400 and 404 responses on `src/infrastructure/http/orders.controller.ts`
- [X] T009 [P] [US1] Document inputs and the 200, 404 and 409 responses on `src/infrastructure/http/orders-cancellation.controller.ts`

**Checkpoint**: User Story 1 is testable without preloaded examples

---

## Phase 4: User Story 2 - Ejecutar un ejemplo local ya cargado (Priority: P2)

**Goal**: Cada operación trae un ejemplo `local` completado para los datos de referencia.

**Independent Test**: En `/docs`, ejecutar sin editar campos el portfolio de la cuenta `10001` y la búsqueda `teco`.

### Tests for User Story 2

- [X] T010 [US2] Write a failing test in `test/unit/http/openapi-examples.spec.ts` for an example named `local` on every business operation

### Implementation for User Story 2

- [X] T011 [P] [US2] Set the portfolio example `local` to account `10001` in `src/infrastructure/http/portfolio.controller.ts`
- [X] T012 [P] [US2] Set the search example `local` to the text `teco` in `src/infrastructure/http/instruments.controller.ts`
- [X] T013 [P] [US2] Set the submit example `local` to account `10001`, ticker `GGAL`, side `BUY`, type `MARKET` and quantity `1`, and mark it as a write, in `src/infrastructure/http/orders.controller.ts`
- [X] T014 [P] [US2] Set the cancel example `local` to account `10001` and order `5`, and mark it as a write, in `src/infrastructure/http/orders-cancellation.controller.ts`

**Checkpoint**: User Stories 1 and 2 work. Examples can be executed against the local reference data

---

## Phase 5: User Story 3 - La documentación sigue a las operaciones (Priority: P3)

**Goal**: Agregar, cambiar o quitar una operación pública actualiza el documento sin editar una segunda descripción a mano.

**Independent Test**: Una ruta pública sin metadata o sin ejemplo `local` hace fallar el test. `/docs` y `/docs-json` no figuran como operaciones de negocio.

### Tests for User Story 3

- [X] T015 [US3] Write a failing test in `test/unit/http/openapi-coverage.spec.ts` that every registered public route except `GET /docs` and `GET /docs-json` is present in the document and has an example named `local`

### Implementation for User Story 3

- [X] T016 [US3] Compare Nest routes with `createOpenApiDocument` in `test/unit/http/openapi-coverage.spec.ts`, and fail when a public operation has no example `local`
- [X] T017 [US3] Add a generator script that writes `specs/002-live-openapi-docs/contracts/openapi.json` from `src/infrastructure/http/openapi.ts`, and register it in `package.json`. The JSON file must not be hand-edited

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Leave the generated contract and the README aligned with the page

- [X] T018 Generate `specs/002-live-openapi-docs/contracts/openapi.json` with the script from T017
- [X] T019 [P] Document `GET /docs` and `GET /docs-json` in `README.md`
- [X] T020 Run the checks in `specs/002-live-openapi-docs/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Adds examples on the controllers documented in US1. Independently testable by reading the example values
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - The coverage test is meaningful once US1 and US2 have metadata and examples

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- The shared builder in `src/infrastructure/http/openapi.ts` exists before controller metadata
- Story complete before moving to the next priority when working solo

### Parallel Opportunities

- T005, T006, T007, T008 and T009 touch different controllers and can run in parallel after T004
- T011, T012, T013 and T014 can run in parallel after T010
- Once Foundational completes, US1 can start while US2 waits only if the same controller files are still being edited
- T019 can run in parallel with T018

---

## Parallel Example: User Story 1

```bash
Task: "T005 Document src/infrastructure/http/health.controller.ts"
Task: "T006 Document src/infrastructure/http/portfolio.controller.ts"
Task: "T007 Document src/infrastructure/http/instruments.controller.ts"
Task: "T008 Document src/infrastructure/http/orders.controller.ts"
Task: "T009 Document src/infrastructure/http/orders-cancellation.controller.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: `/docs` and `/docs-json` list the five public operations
5. Demo the catalog before adding examples

### Incremental Delivery

1. Setup + Foundational → page and JSON exist
2. User Story 1 → catalog matches the public operations (MVP)
3. User Story 2 → examples `local` can be executed
4. User Story 3 → a new route cannot ship without documentation
5. Polish → generated `contracts/openapi.json` and README

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 controllers
   - Developer B: User Story 2 examples, after the matching controller from US1 is no longer being edited
   - Developer C: User Story 3 coverage test
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Zod remains the runtime validation. Swagger decorators only document
- Do not import `@nestjs/swagger` from `src/domain` or `src/application`
- `GET /docs` and `GET /docs-json` are not business operations
- Verify tests fail before implementing
- Avoid: vague tasks, same file conflicts, hand-editing `contracts/openapi.json`
