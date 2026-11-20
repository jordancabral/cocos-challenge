
# Cocos Challenge API Constitution

## Core Principles

### I. Arquitectura Hexagonal

El dominio y los casos de uso MUST permanecer libres de NestJS, TypeORM, HTTP
y de cualquier SDK de infraestructura. Las dependencias hacia el exterior MUST
declararse como ports (interfaces) y MUST implementarse en adapters. La
dirección de dependencia MUST apuntar hacia el dominio.

Rationale: NestJS y TypeORM son detalles de entrega y de persistencia. Si el
dominio los importa, las reglas de negocio dejan de poder probarse sin
infraestructura y cambiar un adapter obliga a reescribir el núcleo.

### II. Exactitud Monetaria (NON-NEGOTIABLE)

Todo monto, precio, saldo y comisión MUST representarse con exactitud decimal
fija, tanto en código como en base de datos. Lo mismo aplica a cualquier
factor que se multiplique o divida para obtener uno de esos valores.

- En código, un valor monetario MUST ser un entero en unidad mínima o un
  decimal de precisión fija (librería decimal o string decimal canónico).
  `number` de JavaScript está prohibido para esos valores.
- En base de datos, una columna monetaria MUST ser `numeric` o `decimal` con
  precisión y escala explícitas, o un entero de unidad mínima. `float`,
  `double precision` y `real` están prohibidos.
- La aritmética MUST ser decimal. El redondeo MUST vivir en un único lugar,
  ser explícito y determinista. `Math.round`, `toFixed` y cualquier cuenta
  sobre un float binario están prohibidos para dinero.
- En JSON, un valor monetario MUST viajar como string decimal o como entero
  de unidad mínima. MUST NOT viajar como número JSON.
- Dos representaciones del mismo valor MUST convertirse solo en el borde, con
  una función única y testeada.

Rationale: IEEE-754 no representa en forma exacta la mayoría de los decimales
monetarios. Un centavo de diferencia en un saldo es un defecto de correctitud.

### III. Integridad Transaccional de Saldos y Estados (NON-NEGOTIABLE)

Toda actualización de saldo y toda transición de estado transaccional MUST
ejecutarse dentro de una transacción de base de datos. El saldo y el estado
que dependen uno del otro MUST confirmarse o revertirse juntos.

- MUST prevenir actualizaciones perdidas con bloqueo pesimista o con versión
  optimista.
- Una transición MUST pertenecer al conjunto explícito de transiciones
  permitidas. Una transición ilegal MUST fallar sin modificar el saldo.
- Una operación que pueda reintentarse MUST ser idempotente.

Rationale: el saldo y su estado son un solo hecho. Confirmar uno sin el otro
deja un estado que no se puede reconciliar.

### IV. Tests Unitarios Obligatorios (NON-NEGOTIABLE)

Toda lógica de dominio y todo caso de uso MUST tener tests unitarios en Jest,
ejecutados sin base de datos y sin red. La cobertura de `statements`,
`branches`, `functions` y `lines` MUST ser estrictamente mayor al 80 %. Un
resultado igual o inferior a 80.00 % en cualquiera de esas cuatro métricas
MUST hacer fallar la integración continua.

Los caminos de exactitud monetaria, de transición de estado y de actualización
de saldo MUST tener tests del resultado exacto y del rollback ante un fallo.

Rationale: el umbral es una puerta de integración, no una meta aspiracional.
Sin tests del dominio aislados, la arquitectura hexagonal no se verifica.

### V. Tipado Estricto, Validación y Estilo

- `strict` MUST estar habilitado en TypeScript. `any`, `@ts-ignore` y
  `@ts-expect-error` MUST NOT usarse, salvo una excepción justificada en el
  mismo cambio.
- Todo dato que cruza un borde —body, query, params, headers relevantes,
  variables de entorno y payloads externos— MUST validarse con Zod antes de
  entrar a un caso de uso. Un dato inválido MUST rechazarse en el adapter.
- ESLint MUST pasar sin errores y el formato con Prettier MUST estar limpio.
  La integración continua MUST fallar si el chequeo de tipos, el lint o el
  formato no pasan.

Rationale: el borde es el único lugar donde un dato externo todavía no
pertenece al dominio. Validarlo más adentro mezcla contrato con negocio.

### VI. Observabilidad con correlationId

Los logs de la aplicación MUST escribirse en JSON estructurado. Cada request
MUST tener un `correlationId`: se reutiliza el header `x-correlation-id`
cuando viene, y el adapter de entrada MUST generarlo cuando no viene. Todo
log emitido durante ese procesamiento MUST incluir `correlationId`.
`console.log` y cualquier log no estructurado están prohibidos en el código
de aplicación.

Rationale: sin un identificador por operación no se puede seguir un cambio de
saldo a través de adapters, transacción y error.

## Stack Tecnológico y Entorno de Ejecución

La línea de runtime MUST ser Node.js 26 Active LTS (Lithium), la última LTS
estable al ratificar esta constitución. `engines`, la imagen base de Docker y
la integración continua MUST fijar la línea 26 y MUST seguir su último parche
estable. Adoptar una LTS Active posterior MUST hacerse mediante enmienda.

- NestJS es el framework de los adapters de entrada y de la inyección de
  dependencias. MUST NOT ser dependencia del dominio.
- TypeORM es el único mecanismo de persistencia. Las entidades MUST vivir en
  el adapter de persistencia y MUST mapearse a modelos de dominio. Todo cambio
  de esquema MUST incluir una migración versionada.
- Zod es la única librería de validación de esquemas en los bordes.
- Jest es el único runner de tests unitarios.
- La aplicación MUST construirse y ejecutarse como imagen Docker basada en una
  imagen oficial de Node.js 26. `docker-compose` MUST levantar la aplicación y
  sus dependencias, incluida la base de datos, con variables, red y
  healthchecks definidos en el propio compose.

## Documentación y Puertas de Calidad

- La API pública MUST estar descrita en un documento OpenAPI versionado. Todo
  cambio de contrato MUST actualizar ese documento en el mismo cambio.
- El repositorio MUST incluir una Postman Collection versionada que cubra los
  endpoints públicos y MUST actualizarse junto con el contrato.
- El README MUST alcanzar para que una persona nueva levante el sistema:
  propósito, vista de la arquitectura hexagonal, requisito de Node.js 26,
  arranque con Docker Compose, ejecución de tests y la regla de exactitud
  monetaria.
- Un cambio MUST NOT integrarse si falla el chequeo de tipos, ESLint,
  Prettier, los tests de Jest o el umbral de cobertura.

## Governance

Esta constitución prevalece sobre cualquier práctica o convención que la
contradiga. Una spec, un plan o una tarea que la viole MUST corregirse antes
de implementarse.

Enmiendas:

- MUST proponerse en un cambio que actualice este archivo.
- MUST incrementar la versión según semver. MAJOR cuando se elimina o se
  redefine un principio de forma incompatible. MINOR cuando se agrega un
  principio o se amplía una regla. PATCH cuando solo se clarifica el texto.
- MUST incluir el Sync Impact Report mientras el cambio está en revisión. Ese
  reporte se retira antes de integrar la enmienda.
- `LAST_AMENDED_DATE` MUST ser la fecha de la enmienda. `RATIFICATION_DATE`
  no se modifica.

Cada revisión MUST comprobar el cumplimiento de estos principios. Una
desviación MUST justificarse en una enmienda o MUST rechazarse. La complejidad
que no protege la exactitud monetaria, la integridad transaccional o un borde
de la arquitectura MUST justificarse en el mismo cambio.

**Version**: 1.0.0 | **Ratified**: 2026-11-20 | **Last Amended**: 2026-11-20
