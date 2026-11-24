# Data Model: Búsquedas acotadas de cuenta, activo, órdenes y precios

No hay columnas ni tablas nuevas. Se agregan cuatro índices sobre columnas
que ya existen.

## Cuenta (`users`)

| Columna | Índice |
|---------|--------|
| `accountnumber` | Único. Nombre `users_accountnumber_uidx` |

El número de cuenta sigue siendo la identidad de la cuenta. No se acepta
otro registro con el mismo valor.

## Activo (`instruments`)

| Columna | Índice |
|---------|--------|
| `ticker` | Único. Nombre `instruments_ticker_uidx` |

El ticker sigue siendo la identidad del activo. No se acepta otro registro
con el mismo valor.

## Orden (`orders`)

| Columna | Índice |
|---------|--------|
| `userid` | No único. Nombre `orders_userid_idx` |

Varias órdenes pueden pertenecer a la misma cuenta. El índice solo acota la
lectura a esa cuenta.

## Precio (`marketdata`)

| Columna | Índice |
|---------|--------|
| `instrumentid` | No único. Nombre `marketdata_instrumentid_idx` |

Varias sesiones pueden pertenecer al mismo activo. El índice solo acota la
lectura a ese activo. No se agrega `date` al índice.

## Fuera de este modelo

No se indexan `instruments.name`, `orders.status`, `orders.side` ni una
búsqueda por fragmento. No cambian tipos, nulos ni claves foráneas.
