# Data Model: Rendimiento total y retorno diario

No hay tablas nuevas. Se lee una columna que ya existe y no se estaba usando.

## Precio de la sesión más reciente

Una fila de `marketdata` por instrumento: la de `date` más nueva.

| Campo | Uso |
|-------|-----|
| `close` | Último precio. Valúa la posición. Entra en los dos rendimientos |
| `previousclose` | Cierre previo de esa misma fila. Solo entra en el retorno diario |

Si `previousclose` falta, es cero o es negativo, no hay retorno diario.

## Posición del portfolio

| Campo | Regla |
|-------|--------|
| `quantity` | Sin cambio. Cantidad neta ejecutada. Cero no se lista |
| `marketValue` | Sin cambio. Cantidad por último `close` |
| `totalReturnPercent` | Sin cambio de fórmula. `(valor de mercado − costo) / costo`. `null` si la cantidad no es positiva o el costo no es positivo |
| `dailyReturnPercent` | `(close − previousclose) / previousclose`. `null` si el cierre previo no es positivo. Se informa también con cantidad negativa |

Los dos porcentajes son texto con dos decimales, o `null`. `0.00` solo si el numerador es cero.

## Cuenta 10001

Sesión más reciente de cada posición:

| Ticker | close | previousclose | totalReturnPercent | dailyReturnPercent |
|--------|-------|---------------|--------------------|--------------------|
| PAMP | 925.85 | 921.80 | `-0.45` | `0.44` |
| METR | 229.50 | 232.00 | `-8.20` | `-1.08` |
| BMA | 1502.80 | 1520.25 | `null` | `-1.15` |

El costo y el valor de mercado no se recalculan distinto. BMA sigue en cantidad `-10` porque las ventas ejecutadas superan las compras ejecutadas.
