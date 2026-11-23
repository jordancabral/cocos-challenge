# Cocos Challenge API

API para consultar el portfolio de una cuenta, buscar activos y enviar o cancelar órdenes.

## Arquitectura

La arquitectura es hexagonal. Las reglas de negocio viven en el centro y no conocen el framework, la base ni HTTP. Esos detalles se enchufan por afuera, a través de puertos, así el dominio se puede probar sin levantar infraestructura.

- El dominio y los casos de uso no importan NestJS, TypeORM, HTTP ni ningún SDK de infraestructura.
- Toda salida del dominio se declara como un puerto (una interfaz) y se implementa en un adapter.
- La dependencia apunta hacia el dominio: los adapters conocen el dominio, el dominio no conoce a los adapters.
- NestJS es el adapter de HTTP y de inyección de dependencias.
- TypeORM es el adapter de persistencia. Las entidades viven ahí y se mapean a modelos de dominio.
- Zod valida body, query, params y variables de entorno en el borde, antes de entrar a un caso de uso.
- El dinero usa decimal fijo en el código y `numeric` en la base. En JSON viaja como string con dos decimales. No se usa `number` para precios ni saldos.
- Alta y cancelación de órdenes corren en una transacción con bloqueo de la fila de la cuenta, y solo mientras dura el trabajo de base.

## Requisitos

- Node.js 26
- Docker y Docker Compose, solo para el arranque local

## Arranque local

Todo corre en la máquina: la API y PostgreSQL. La base se crea con `db/database.sql`. No hace falta un `.env`.

```bash
npm run start:local
```

Eso ejecuta `docker compose up --build`. La API queda en `http://localhost:3000`. `GET /health` responde 200.

## Arranque dev

La API corre en la máquina y usa la base de Neon que pasó Cocos. El host ya está en `.env.example`. El usuario y la contraseña van solo en `.env`, que no se commitea.

```bash
cp .env.example .env
```

Completar `USER` y `PASSWORD` en `DATABASE_URL`. Si la contraseña tiene caracteres reservados de una URL, hay que escribirlos codificados.

```bash
npm run start:dev
```

La API queda en `http://localhost:3000`. Esta base ya tiene el esquema y los datos: el proceso no la recrea ni corre `db/database.sql` contra Neon.

## Tests

```bash
npm test
npm run test:integration
```

`npm test` cubre dominio y casos de uso sin base. La cobertura de statements, branches, functions y lines tiene que superar el 80 %. `npm run test:integration` ejecuta el envío de una orden contra PostgreSQL.

## Contrato

El contrato HTTP está en `specs/001-portfolio-orders/contracts/openapi.yaml`. La colección de Postman está en `postman/cocos-challenge.postman_collection.json`.
