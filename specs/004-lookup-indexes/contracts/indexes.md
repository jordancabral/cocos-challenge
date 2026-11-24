# Contrato: índices de búsqueda

No cambia ninguna operación pública. El contrato es el del esquema descrito
en [data-model.md](../data-model.md).

## Índices que deben existir

| Nombre | Tabla | Columnas | Único |
|--------|-------|----------|-------|
| `users_accountnumber_uidx` | `users` | `accountnumber` | sí |
| `instruments_ticker_uidx` | `instruments` | `ticker` | sí |
| `orders_userid_idx` | `orders` | `userid` | no |
| `marketdata_instrumentid_idx` | `marketdata` | `instrumentid` | no |

## Rechazos

- Insertar otra fila en `users` con un `accountnumber` ya usado se rechaza.
  La fila original no cambia.
- Insertar otra fila en `instruments` con un `ticker` ya usado se rechaza.
  La fila original no cambia.

## Lo que no cambia

- `GET /accounts/10001/portfolio` sigue con los mismos pesos, posiciones y
  rendimientos.
- Una orden a mercado de `GGAL` sigue usando el último cierre de ese activo.
- La búsqueda por texto no gana un índice.
