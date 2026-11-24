# Implementation Plan: Control automático al actualizar la línea principal

**Branch**: `005-main-ci` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-main-ci/spec.md`

## Summary

Un workflow de GitHub Actions corre en cada push a `main`. Usa Node.js 26,
ejecuta lint, formato, pruebas unitarias con cobertura, pruebas de
integración y el build, y crea la imagen con el Dockerfile actual. No la
publica y no usa secretos.

## Technical Context

**Language/Version**: TypeScript strict sobre Node.js 26 Active LTS, en el
runner y en la imagen

**Primary Dependencies**: GitHub Actions, el `Dockerfile` y los scripts de
`package.json`. No se agregan dependencias de npm.

**Storage**: Ninguno nuevo. Las pruebas de integración levantan su propio
PostgreSQL y lo tiran al terminar.

**Testing**: `npm test` y `npm run test:integration`, más `npm run lint`,
`npm run format` y `npm run build`.

**Target Platform**: GitHub Actions sobre `ubuntu-latest`

**Project Type**: web-service

**Performance Goals**: Ninguno numérico. La spec pide que el control corra y
que el resultado sea el de todas sus partes.

**Constraints**: Solo push a `main`. Node.js 26. Cobertura estrictamente
mayor al 80 % en sentencias, ramas, funciones y líneas. Sin `DATABASE_URL`,
sin `.env` y sin publicar la imagen. `synchronize` y el dominio no se tocan.

**Scale/Scope**: Un workflow y una mención en el README. No cambia la API.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Revisión previa a research:

- Arquitectura hexagonal: el control no entra al dominio ni a los adapters.
- Exactitud monetaria: no cambia cálculos ni columnas.
- Integridad transaccional: no cambia el bloqueo ni las órdenes.
- Tests: el control ejecuta las pruebas unitarias y hace fallar la
  integración continua si la cobertura no supera el 80 % en las cuatro
  medidas.
- Tipos, lint y formato: `npm run build`, `npm run lint` y `npm run format`
  hacen fallar el control.
- Runtime: el job fija la línea Node.js 26 y la imagen sigue saliendo de
  `node:26`.
- Secretos: el workflow no los declara. Las pruebas de integración no usan
  Neon.
- Documentación: el README cuenta que un push a `main` dispara este control.
  No hay contrato HTTP nuevo.

Ninguna puerta falla.

Revisión posterior al diseño:

- El disparo es un push a `main`, como fija la spec.
- Las seis partes del contrato cubren pruebas, cobertura, tipos, lint,
  formato, build e imagen.
- La imagen se crea y no se publica.
- Sigue sin SLO inventado y sin dependencia de la base de la nube.

Las puertas siguen en pie.

## Project Structure

### Documentation (this feature)

```text
specs/005-main-ci/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ci.md
└── tasks.md              # /speckit-tasks, no lo crea este comando
```

### Source Code (repository root)

```text
.github/workflows/ci.yml
README.md
Dockerfile
package.json
```

**Structure Decision**: El workflow es el único archivo nuevo de ejecución.
Reusa los scripts y el Dockerfile. El README explica cuándo corre. No hay
cambio de dominio, de controllers ni de esquema.

## Complexity Tracking

No aplica. El diseño no abre excepciones al constitution.
