# Quickstart: Búsquedas acotadas de cuenta, activo, órdenes y precios

Comprueba el esquema de [contracts/indexes.md](contracts/indexes.md). No hace
falta un caso nuevo de negocio: el portfolio de referencia tiene que seguir
igual.

## Prerrequisitos

- Base en marcha, local o Neon, con la migración de esta feature aplicada.
- Datos de referencia cargados.

## Índices

En la base, estos cuatro nombres tienen que existir:

- `users_accountnumber_uidx`
- `instruments_ticker_uidx`
- `orders_userid_idx`
- `marketdata_instrumentid_idx`

Los dos primeros son únicos.

## Unicidad

Insertar un usuario con `accountnumber` `10001` falla y la fila original
sigue. Insertar un instrumento con `ticker` `GGAL` falla y la fila original
sigue.

## Resultado de negocio

`GET /accounts/10001/portfolio` mantiene disponibles `627500.00`, valor total
`889756.00` y las posiciones ya conocidas, incluidos los retornos diario y
total. Una orden a mercado de `GGAL` sigue tomando el último cierre de ese
activo.
