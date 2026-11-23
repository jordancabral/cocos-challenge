# Research: Portfolio, búsqueda y órdenes

Las decisiones salen de la spec, del constitution y de las definiciones
técnicas de `backend-challenge.md` más el esquema de `database.sql`. Donde
esas fuentes dejan una alternativa, se elige la que no cambia el esquema
entregado. No se inventa un objetivo de rendimiento: ninguna fuente lo define.

## Runtime y framework

- **Decision**: Node.js 26 Active LTS y NestJS solo en los adapters HTTP y
  de composición. TypeScript con `strict`.
- **Rationale**: El constitution fija Node.js 26 y NestJS. El challenge
  permite Express o NestJS; el constitution desempata.
- **Alternatives considered**: Express, permitido por el challenge, queda
  descartado porque el constitution exige NestJS en los adapters.

## Base de datos

- **Decision**: PostgreSQL, con el esquema y los datos de `database.sql` tal
  como están. TypeORM mapea esas tablas. `synchronize` queda apagado. No hay
  migración inicial porque no hay cambio de esquema.
- **Rationale**: El script usa `SERIAL`, `NUMERIC(10, 2)` y comillas en
  identificadores camelCase. Eso es PostgreSQL. El challenge dice que el
  modelo sirve como está y que un cambio de esquema se justifica. El
  constitution exige migración solo cuando el esquema cambia.
- **Alternatives considered**: Otro motor obligaría a reescribir el script.
  Pasar precios a enteros en centavos sería un cambio de esquema sin una
  necesidad que el script no cubra.

## Dinero

- **Decision**: En dominio, decimal de precisión fija con `decimal.js` y
  redondeo `ROUND_HALF_UP` (mitad alejándose de cero) en un solo módulo. En
  base, las columnas monetarias siguen en `NUMERIC(10, 2)` y TypeORM las
  entrega como string. En JSON, todo monto y todo porcentaje viajan como
  string con dos decimales. `number` no se usa para dinero ni para un factor
  que produzca dinero. La cantidad de acciones sigue siendo un entero.
- **Rationale**: El constitution permite centavos enteros o decimal fijo. El
  esquema ya es `NUMERIC(10, 2)` y la spec exige exactitud al centavo. El
  decimal fijo calza con esas columnas y con el string JSON que el
  constitution exige. `ROUND_HALF_UP` de decimal.js es el redondeo de la spec.
- **Alternatives considered**: Enteros en centavos. Cumple el constitution,
  pero obliga a traducir todas las columnas `NUMERIC` y a justificar un
  cambio que el script no necesita.

## Concurrencia de órdenes

- **Decision**: Cada alta o cancelación corre en una transacción de base.
  Antes de leer el disponible se toma un bloqueo pesimista de la fila del
  usuario (`SELECT … FOR UPDATE`). La orden y su efecto sobre el disponible
  se confirman juntos. No se agrega columna de versión.
- **Rationale**: El constitution exige bloqueo pesimista u optimista. La spec
  exige que la segunda orden vea la reserva de la primera. El bloqueo de la
  fila del usuario serializa las órdenes de esa cuenta sin tocar el esquema.
- **Alternatives considered**: Versión optimista. También cumple, y exige una
  columna nueva. Se descarta mientras el esquema entregado alcance. Se deja
  esta elección a propósito, con el warning de abajo.
- **Warning**: El bloqueo es de una fila, la de esa cuenta, y solo mientras
  dura la transacción. Órdenes de cuentas distintas no se esperan, y una
  lectura de portfolio no toma ese lock. Si muchas órdenes llegan juntas a la
  misma cuenta, esas peticiones hacen fila y la latencia de esa cuenta crece
  con la cola. Una ráfaga sobre una sola cuenta también puede ocupar
  conexiones del pool mientras esperan. La transacción debe hacer solo el
  trabajo de base: no se llama a nada externo con el lock tomado. Si más
  adelante el tráfico por cuenta deja de ser aceptable, la alternativa sigue
  siendo una columna de versión.

## Arquitectura

- **Decision**: Dominio y casos de uso sin imports de NestJS, TypeORM, HTTP
  ni del driver. Los casos de uso dependen de ports. TypeORM, Zod, el logger
  y los controllers son adapters.
- **Rationale**: Principio I del constitution.
- **Alternatives considered**: Servicios Nest que usan el repositorio directo.
  Se descarta porque el dominio dejaría de poder probarse sin infraestructura.

## Validación de entrada

- **Decision**: Zod valida body, query, params y variables de entorno en el
  borde HTTP. Un dato inválido responde error y no inserta una orden. Una
  orden de negocio rechazada sí se inserta con estado `REJECTED`.
- **Rationale**: El constitution pone Zod en el borde. La spec separa el
  envío inválido (no hay orden) del rechazo de mercado (hay orden).
- **Alternatives considered**: class-validator. Se descarta porque el
  constitution fija Zod.

## Búsqueda

- **Decision**: Se leen los instrumentos que no son moneda y se filtran en el
  caso de uso. La comparación ignora mayúsculas y acentos. El resultado se
  ordena por ticker.
- **Rationale**: El catálogo de referencia tiene decenas de filas. Filtrar en
  memoria cumple la spec y no pide la extensión `unaccent` ni un cambio de
  esquema.
- **Alternatives considered**: `unaccent` en PostgreSQL. Sirve con un catálogo
  grande y aquí agrega una migración sin cambio funcional.

## Pruebas

- **Decision**: Jest. Los tests de dominio y de casos de uso corren sin base
  y sin red. La cobertura de statements, branches, functions y lines debe ser
  estrictamente mayor al 80 %; el umbral de CI rechaza 80.00 % o menos. Además
  hay un test funcional de la función de enviar una orden contra PostgreSQL,
  cubriendo ejecución, rechazo y reserva de una orden límite.
- **Rationale**: El constitution fija Jest, el umbral y los tests de dominio
  sin infraestructura. El challenge pide un test funcional de esa función.
  `coverageThreshold` de Jest trata el número como mínimo inclusivo, así que
  el control del umbral estricto no puede ser solo `80`.
- **Alternatives considered**: Un único test HTTP como sustituto de los tests
  de dominio. No alcanza el constitution.

## Logs

- **Decision**: Logs JSON con Pino. El adapter HTTP toma `x-correlation-id` o
  genera un identificador, lo guarda durante el procesamiento y lo incluye en
  cada log. La respuesta lo devuelve en el mismo header.
- **Rationale**: El constitution exige JSON estructurado y `correlationId`.
  No nombra la librería. Pino es el encaje habitual con NestJS para ese
  formato.
- **Alternatives considered**: Winston, o el logger de Nest en texto. El
  primero también sirve; el segundo no cumple el formato estructurado.

## Documentación de la API

- **Decision**: OpenAPI se genera con `@nestjs/swagger` y se versiona en
  `contracts/openapi.yaml` como contrato de esta feature. La colección de
  Postman se versiona en `postman/cocos-challenge.postman_collection.json` y
  se actualiza con el contrato. El README explica arquitectura, Node.js 26,
  Docker Compose, tests y la regla de dinero.
- **Rationale**: El constitution pide los tres artefactos. El challenge pide
  documentar supuestos y, como opcional, una colección; el constitution lo
  vuelve obligatorio.
- **Alternatives considered**: Dejar OpenAPI solo como endpoint en vivo. No
  cumple el documento versionado.

## Ejecución

- **Decision**: Imagen `node:26` y `docker-compose` con la API y PostgreSQL.
  El compose define variables, red y healthchecks. Postgres inicia con
  `database.sql`. La API expone `GET /health` para su healthcheck. El puerto
  local de la API es 3000.
- **Rationale**: El constitution pide la imagen oficial de Node 26 y
  healthchecks de las dependencias. El puerto no está definido; 3000 es el
  valor local de este plan, no un requisito de negocio.
- **Alternatives considered**: `node:latest`. El constitution lo prohíbe al
  fijar la línea 26.

## Identidad y alcance

- **Decision**: No hay autenticación. El número de cuenta viaja en cada
  operación. No hay objetivo numérico de latencia ni de volumen: el alcance
  es el dataset de referencia y las órdenes que se creen sobre esa base, en
  un solo proceso.
- **Rationale**: El challenge dice que la autenticación no hace falta. Ni el
  challenge ni el constitution definen un SLO. Inventar uno no cambia el
  diseño de esta feature.
- **Alternatives considered**: Un SLO de ejemplo. Se descarta porque ninguna
  fuente lo respalda.

## Idempotencia

- **Decision**: Aplicar una orden ya confirmada no mueve el disponible dos
  veces: el efecto ocurre una sola vez dentro de la transacción, antes del
  commit. Un nuevo envío HTTP es otra orden. No hay clave de idempotencia.
- **Rationale**: La spec dice que dos envíos seguidos son dos órdenes, y que
  completar de nuevo una orden ya terminada no repite el movimiento. El
  constitution exige idempotencia del reintento interno, no del alta.
- **Alternatives considered**: Exigir una clave de idempotencia del cliente.
  La spec no la pide y cambiaría el contrato.
