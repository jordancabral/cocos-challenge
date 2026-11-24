---
description: "Task list for control automático al actualizar la línea principal"
---

# Tasks: Control automático al actualizar la línea principal

**Input**: Design documents from `/specs/005-main-ci/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No se agregan pruebas nuevas. El control ejecuta `npm test` y `npm run test:integration`, que ya existen. La spec no pide una suite aparte para el workflow.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `test/` at repository root
- Paths follow `specs/005-main-ci/plan.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Reuse the scripts and the image the project already has

- [X] T001 Confirm `package.json` already defines `lint`, `format`, `test`, `test:integration`, and `build`, that `Dockerfile` starts `FROM node:26`, and that this feature adds no dependency

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: A push to `main` checks out that commit on Node.js 26 and installs from the lockfile

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create `.github/workflows/ci.yml` with `on.push.branches: [main]` only, one job on `ubuntu-latest`, `permissions: contents: read`, `actions/checkout@v4`, `actions/setup-node@v4` with `node-version: 26` and `cache: npm`, then `npm ci`. Do not add `pull_request`, `workflow_dispatch`, tags, `env`, secrets, or `DATABASE_URL`. Constraint from `data-model.md`: "Rama | Solo `main` dispara el control" and "Contenido | El checkout de ese push, sin `.env` y sin secretos"

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Saber si la línea principal sigue sana (Priority: P1) 🎯 MVP

**Goal**: Cada push a `main` ejecuta las pruebas unitarias y las de integración, y queda fallido si alguna no pasa.

**Independent Test**: Un cambio publicado en `main` corre `npm test` y `npm run test:integration`. Una prueba fallida o una cobertura que no supera el 80 % marca el cambio como fallido.

### Implementation for User Story 1

- [X] T003 [US1] Add `npm test` and `npm run test:integration` as steps after `npm ci` in `.github/workflows/ci.yml`. Leave the coverage gate in `npm test` as it is. Constraint from `data-model.md`: "Cobertura | Exitosa solo si sentencias, ramas, funciones y líneas superan el 80 %" and "Estado | Exitoso o fallido. No hay un tercer estado de \"parcial\""

**Checkpoint**: User Story 1 is testable on its own. A push to `main` runs both test commands and fails the check when either fails

---

## Phase 4: User Story 2 - Comprobar que la aplicación se puede entregar (Priority: P2)

**Goal**: El mismo control construye la aplicación y crea su imagen. No la publica.

**Independent Test**: Si las pruebas pasan, el control corre el build y deja creada la imagen `cocos-challenge:ci`. Si el build o la imagen fallan, el cambio queda fallido.

### Implementation for User Story 2

- [X] T004 [US2] Add `npm run build` and `docker build -t cocos-challenge:ci .` after the test steps in `.github/workflows/ci.yml`. Use the existing `Dockerfile`. Do not add `docker push` or a registry login. Constraint from `data-model.md`: "Origen | El `Dockerfile` que ya construye la aplicación", "Nombre local | `cocos-challenge:ci`", and "Destino | Se queda en el runner. No se publica"

**Checkpoint**: A successful check has built the application and created the image. A failed build or image leaves the check failed

---

## Phase 5: User Story 3 - Rechazar un cambio que no cumple el estilo del proyecto (Priority: P3)

**Goal**: El control falla si los tipos, el análisis o el formato no pasan, aunque las pruebas pasen.

**Independent Test**: Un cambio que no pasa lint, formato o el build de tipos queda marcado como fallido.

### Implementation for User Story 3

- [X] T005 [US3] Insert `npm run lint` and `npm run format` in `.github/workflows/ci.yml` immediately after `npm ci` and before `npm test`. The finished step order in that file must be `npm run lint`, `npm run format`, `npm test`, `npm run test:integration`, `npm run build`, `docker build -t cocos-challenge:ci .`, matching `specs/005-main-ci/contracts/ci.md`. `npm run build` remains the type check

**Checkpoint**: All three stories are present. Lint and format fail the check before the tests run

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tell readers when the check runs, then execute the same commands locally

- [X] T006 Document in `README.md` that a push to `main` starts the check in `.github/workflows/ci.yml`, that the check runs lint, format, unit tests, integration tests, build, and image creation, and that other branches, review requests, tags, and manual runs do not start it
- [X] T007 Run the checks in `specs/005-main-ci/quickstart.md`: `npm ci`, `npm run lint`, `npm run format`, `npm test`, `npm run test:integration`, `npm run build`, and `docker build -t cocos-challenge:ci .`

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Adds the build and the image after the test steps from US1. Independently testable by failing `npm run build` or `docker build` even when the tests are already green
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Inserts lint and format before the tests. Independently testable by a format or lint failure without waiting for the tests

### Within Each User Story

- The workflow file exists before any story adds a step
- US2 adds its steps after the test steps
- US3 inserts its steps before the test steps so the contract order is the final order
- Story complete before moving to the next priority when working solo

### Parallel Opportunities

- No task is marked [P]. T003, T004, and T005 edit `.github/workflows/ci.yml`
- T006 depends on the finished workflow. T007 depends on T006

---

## Parallel Example: User Story 1

```bash
# No parallel tasks. T003 is the only User Story 1 change,
# and it edits .github/workflows/ci.yml.
Task: "T003 Add npm test and npm run test:integration to .github/workflows/ci.yml"
```

---

## Parallel Example: User Story 2

```bash
# No parallel tasks. T004 edits the same workflow file.
Task: "T004 Add npm run build and docker build -t cocos-challenge:ci . to .github/workflows/ci.yml"
```

---

## Parallel Example: User Story 3

```bash
# No parallel tasks. T005 edits the same workflow file.
Task: "T005 Insert npm run lint and npm run format before npm test in .github/workflows/ci.yml"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: A push to `main` runs `npm test` and `npm run test:integration`, and a failing test leaves the check red
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → a push to `main` checks out Node.js 26 and runs `npm ci`
2. Add User Story 1 → unit and integration tests fail the check (MVP)
3. Add User Story 2 → the same check builds the app and creates `cocos-challenge:ci`
4. Add User Story 3 → lint and format fail the check before the tests
5. Polish → README describes the check, and the six local commands pass

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done, only one person should edit `.github/workflows/ci.yml` at a time
3. Stories complete in order P1, P2, P3 so the step order ends as in `specs/005-main-ci/contracts/ci.md`

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Do not add a pull request trigger, a registry push, or a `DATABASE_URL`
- Do not change domain code, HTTP contracts, or the existing test commands
- Avoid: a second workflow file, `docker push`, and running this check for branches other than `main`
