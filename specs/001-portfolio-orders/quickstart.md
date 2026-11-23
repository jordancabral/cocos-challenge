# Quickstart: Portfolio, búsqueda y órdenes

Guía para comprobar la feature de punta a punta. El detalle de campos está en
[contracts/openapi.yaml](contracts/openapi.yaml) y las cifras salen de
[data-model.md](data-model.md) aplicado a `database.sql`.

## Prerrequisitos

- Docker, con Compose.
- Node.js 26 para correr los tests en el host.

## Levantar

Desde la raíz del repositorio, cuando la implementación exista:

```bash
docker compose up --build
```

Eso debe dejar PostgreSQL cargado con `database.sql` y la API en
`http://localhost:3000`. `GET /health` responde 200. Cada respuesta trae
`x-correlation-id`.

## Tests

```bash
npm test
npm run test:integration
```

`npm test` corre los tests de dominio y de casos de uso sin base. La
cobertura de statements, branches, functions y lines queda por encima del
80 %; 80.00 % o menos falla.

`npm run test:integration` ejecuta el test funcional de enviar una orden
contra PostgreSQL. Tiene que cubrir una orden a mercado ejecutada, una
rechazada por falta de disponible y una límite que reserva sin cambiar la
cantidad ni el valor total.

## Portfolio de la cuenta 10001

`GET /accounts/10001/portfolio`

Con los datos de referencia y las reservas de las órdenes `NEW`:

- Pesos disponibles: `627500.00`
- Valor total: `889756.00`
- BMA: cantidad `-10`, valor de mercado `-15028.00`, sin rendimiento
- METR: cantidad `500`, valor de mercado `114750.00`, rendimiento `-8.20`
- PAMP: cantidad `40`, valor de mercado `37034.00`, rendimiento `-0.45`

LOMA no aparece: su compra sigue pendiente. Los montos llegan como string,
no como número JSON.

## Búsqueda

`GET /instruments?q=teco` devuelve TECO2 una sola vez.

`GET /instruments?q=galicia` devuelve el activo cuyo nombre contiene Galicia.

`GET /instruments?q=pesos` no devuelve el instrumento ARS.

`GET /instruments` sin `q`, o con `q` vacío, responde 400.

## Órdenes

Compra a mercado válida: `POST /orders` con la cuenta, el ticker, `BUY`,
`MARKET` y una cantidad. La respuesta es 201, estado `FILLED`, y el precio
es el último cierre. El portfolio posterior baja los pesos en cantidad por
ese precio y sube la cantidad de acciones.

Compra por encima del disponible: 201 con estado `REJECTED`. El portfolio no
cambia.

Compra límite válida: 201 con estado `NEW`. Los pesos disponibles bajan el
costo (`cantidad * precio límite`). La cantidad de acciones y el valor total
no cambian. Una segunda compra límite que ya no entra en el disponible que
dejó la primera responde 201 `REJECTED` y no reserva.

`POST /orders` con cantidad y monto a la vez, sin ninguno, o con un precio
límite de más de dos decimales: 400 y no se crea orden.

## Cancelar

La quinta orden del script de referencia es la compra límite pendiente de
LOMA, 50 acciones a 710 pesos. `POST /orders/5/cancellation` con
`accountNumber` `10001` responde 200 y estado `CANCELLED`. Los pesos
disponibles de esa cuenta pasan a `663000.00`. El valor total no cambia.

Cancelar de nuevo esa orden responde 409 y no modifica el portfolio.
Cancelar una orden de otra cuenta responde 404.
