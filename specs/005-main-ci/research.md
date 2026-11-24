# Research: Control automático al actualizar la línea principal

## Dónde corre el control

- **Decision**: Un solo workflow de GitHub Actions,
  `.github/workflows/ci.yml`, se dispara con `push` a la rama `main`. Corre
  en `ubuntu-latest`, en un solo job.
- **Rationale**: La spec limita el disparo a un push a `main`. El runner de
  GitHub ya trae Docker, que las pruebas de integración usan para levantar
  PostgreSQL. Un solo job deja un resultado visible por cambio. Si un paso
  falla, el job falla y los pasos siguientes no corren.
- **Alternatives considered**: Agregar `pull_request`, tags o ejecución
  manual. La spec los deja fuera. Varios jobs en paralelo. El resultado
  seguiría siendo uno solo, y las pruebas de integración y la imagen no
  ganan nada con partir el job.

## Qué ejecuta

- **Decision**: Sobre un checkout limpio, con Node.js 26 y `npm ci`, el job
  corre en este orden los scripts que ya existen:
  1. `npm run lint`
  2. `npm run format`
  3. `npm test`
  4. `npm run test:integration`
  5. `npm run build`
  6. `docker build -t cocos-challenge:ci .`
  No se agrega otro script. `npm run build` es `tsc` y cubre el chequeo de
  tipos. La imagen usa el `Dockerfile` actual, basado en `node:26`, y no se
  publica.
- **Rationale**: Esas órdenes son las que el proyecto ya usa en local. La
  cobertura de `npm test` ya corta en más del 80 % de sentencias, ramas,
  funciones y líneas. La imagen no sale del runner, así que no hace falta un
  registro ni un secreto.
- **Alternatives considered**: Un `tsc --noEmit` aparte del build. Repite el
  mismo chequeo. Publicar la imagen en GHCR. La spec dice que crearla
  alcanza. Fijar un parche de Node dentro de la línea 26. El constitution
  pide seguir el último parche estable de esa línea, y `node-version: 26`
  junto con `FROM node:26` lo hacen.

## Qué no usa

- **Decision**: El workflow no define `DATABASE_URL`, no lee `.env` y no
  tiene secretos. Las pruebas de integración siguen levantando su propio
  PostgreSQL con los puertos `54329` y `54330`.
- **Rationale**: La spec prohíbe depender de la base de Neon. Esos tests ya
  traen la URL local armada.
- **Alternatives considered**: Un servicio de PostgreSQL del workflow. Los
  tests actuales no se conectan a un servicio externo: ellos mismos ejecutan
  `docker run`. Cambiarlos para usar un servicio sería otro comportamiento.

## Cómo se comprueba

- **Decision**: En local se corren las mismas seis órdenes. En GitHub, el
  check del push a `main` queda verde solo si las seis terminan, y rojo si
  una falla. La imagen se comprueba con que `docker build` termina con
  éxito. No hace falta un número de minutos.
- **Rationale**: La spec mide que el control exista, que falle cuando
  corresponde y que uno exitoso haya construido la aplicación y creado la
  imagen. No pide un SLO.
- **Alternatives considered**: Medir la duración del job. No hay un límite
  en la spec ni en el constitution.
