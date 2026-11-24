# Contrato: portfolio con dos rendimientos

`GET /accounts/{accountNumber}/portfolio` agrega un porcentaje. El resto de la respuesta no cambia. La búsqueda y las órdenes no cambian.

## Posición

Además de `ticker`, `name`, `quantity`, `marketValue` y `totalReturnPercent`, cada posición incluye:

| Campo | Tipo | Significado |
|-------|------|-------------|
| `dailyReturnPercent` | string con dos decimales, o `null` | Retorno diario del precio. `null` si no se puede calcular. Nunca `"0.00"` salvo que el cálculo sea cero |

`totalReturnPercent` conserva su significado actual.

## Cuenta 10001

Con los datos de referencia, las posiciones incluyen:

| ticker | totalReturnPercent | dailyReturnPercent |
|--------|--------------------|--------------------|
| BMA | `null` | `-1.15` |
| METR | `-8.20` | `-1.08` |
| PAMP | `-0.45` | `0.44` |

Los montos siguen siendo texto con centavos. El detalle de precios y costos está en [data-model.md](../data-model.md).
