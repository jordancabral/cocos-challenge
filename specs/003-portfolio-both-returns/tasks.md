---
description: "Task list for rendimiento total y retorno diario"
---

# Tasks: Rendimiento total y retorno diario

**Input**: Design documents from `/specs/003-portfolio-both-returns/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Incluidos. El plan fija el caso de la cuenta `10001` y las omisiones en `test/unit/portfolio/calculate-portfolio.spec.ts`. El constitution exige tests del resultado monetario exacto. Cada test se escribe primero y tiene que fallar antes de la implementación.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `test/` at repository root
- Paths follow `specs/003-portfolio-both-returns/plan.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Reuse the existing money rounding. Do not add a second one

- [X] T001 Confirm `Money.returnPercentAgainst` in `src/domain/money/money.ts` is the only percentage rounding, half away from zero to two decimals, and that this feature adds no dependency in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Carry the previous close next to the latest close

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Extend the quote passed into `src/domain/portfolio/calculate-portfolio.ts` and `src/application/ports/repositories.ts` so each instrument has `close` and `previousClose`, where "`previousclose` solo entra en el retorno diario" and "Si `previousclose` falta, es cero o es negativo, no hay retorno diario."
- [X] T003 Read `close` and `previousclose` from the same latest `marketdata` row in `src/infrastructure/persistence/portfolio-read.adapter.ts`, keeping `DISTINCT ON (instrumentid) ... ORDER BY instrumentid, date DESC`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Ver los dos rendimientos de una posición (Priority: P1) 🎯 MVP

**Goal**: Cada posición informa el rendimiento total ya definido y el retorno diario del precio.

**Independent Test**: La cuenta `10001` muestra PAMP total `-0.45` y diario `0.44`, METR total `-8.20` y diario `-1.08`, BMA total `null` y diario `-1.15`.

### Tests for User Story 1

- [X] T004 [US1] Write a failing test in `test/unit/portfolio/calculate-portfolio.spec.ts` for account `10001` with closes PAMP `925.85`/`921.80`, METR `229.50`/`232.00` and BMA `1502.80`/`1520.25`, expecting `dailyReturnPercent` `0.44`, `-1.08` and `-1.15` while `totalReturnPercent` stays `-0.45`, `-8.20` and `null`

### Implementation for User Story 1

- [X] T005 [US1] Add `dailyReturnPercent` in `src/domain/portfolio/calculate-portfolio.ts` as "`(close − previousclose) / previousclose`", using `Money.returnPercentAgainst`, and keep `totalReturnPercent` as "`(valor de mercado − costo) / costo`"
- [X] T006 [US1] Pass the previous close through `src/application/get-portfolio/get-portfolio.ts` into the portfolio calculation
- [X] T007 [P] [US1] Document `dailyReturnPercent` as a two-decimal string or `null` on the portfolio response in `src/infrastructure/http/portfolio.controller.ts`

**Checkpoint**: User Story 1 is testable with the reference account. Omissions can still be wrong

---

## Phase 4: User Story 2 - Omitir un rendimiento sin ocultar el otro (Priority: P2)

**Goal**: Si falta el costo o el cierre previo, se omite solo ese porcentaje y la posición sigue visible.

**Independent Test**: Sin costo, hay valor y retorno diario, y el total es `null`. Sin cierre previo positivo, hay rendimiento total cuando corresponde y el diario es `null`.

### Tests for User Story 2

- [X] T008 [US2] Write failing tests in `test/unit/portfolio/calculate-portfolio.spec.ts` for a missing or non-positive `previousclose` (`dailyReturnPercent` `null`, not `"0.00"`), equal closes (`"0.00"`), and a non-positive cost (`totalReturnPercent` `null` while `dailyReturnPercent` is still informed)

### Implementation for User Story 2

- [X] T009 [US2] Apply the omission rules in `src/domain/portfolio/calculate-portfolio.ts`: "`totalReturnPercent` es `null` si la cantidad no es positiva o el costo no es positivo" and "`dailyReturnPercent` es `null` si el cierre previo no es positivo. Se informa también con cantidad negativa."

**Checkpoint**: Both percentages follow the contract, including omissions

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Publish the new portfolio field in the generated OpenAPI document

- [X] T010 Regenerate `specs/002-live-openapi-docs/contracts/openapi.json` with `npm run openapi:generate` so `GET /accounts/{accountNumber}/portfolio` includes `dailyReturnPercent`
- [X] T011 Run the checks in `specs/003-portfolio-both-returns/quickstart.md`

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends the same calculation as US1. Independently testable with positions that are not the `10001` fixture

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- The quote must include `previousClose` before the percentage is calculated
- Domain calculation before the HTTP documentation
- Story complete before moving to the next priority when working solo

### Parallel Opportunities

- T007 documents the controller and can run in parallel with T006 after T005, because they are different files
- US1 and US2 should not edit `src/domain/portfolio/calculate-portfolio.ts` at the same time
- T010 and T011 are sequential: generate the document, then check the quickstart

---

## Parallel Example: User Story 1

```bash
# After the domain calculation exists:
Task: "T006 Pass the previous close through src/application/get-portfolio/get-portfolio.ts"
Task: "T007 Document dailyReturnPercent in src/infrastructure/http/portfolio.controller.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Account `10001` returns both percentages with the figures in `contracts/portfolio.md`
5. Demo that result before the omission cases

### Incremental Delivery

1. Setup + Foundational → previous close is available to the calculation
2. User Story 1 → both percentages for the reference account (MVP)
3. User Story 2 → a missing input omits only its percentage
4. Polish → OpenAPI shows `dailyReturnPercent`

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 calculation and test
   - Developer B: User Story 1 controller documentation after the field name is fixed
3. User Story 2 follows on the same calculation file

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Do not change search results or order submission
- Do not add a second rounding path for percentages
- `null` means the percentage is not reported. `"0.00"` means the calculated change is zero
- Verify tests fail before implementing
- Avoid: vague tasks, same file conflicts, reading `previousclose` from a different market-data row than `close`
