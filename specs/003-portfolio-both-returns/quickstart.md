# Quickstart: Rendimiento total y retorno diario

Comprueba el portfolio descrito en [contracts/portfolio.md](contracts/portfolio.md). Las cifras salen de [data-model.md](data-model.md).

## Prerrequisitos

- Sistema en marcha en local (`npm run start:local`) o en dev (`npm run start:dev`), en `http://localhost:3000`.
- Datos de referencia cargados, con la cuenta `10001`.

## Consulta

`GET /accounts/10001/portfolio`

Los pesos disponibles y el valor total no cambian respecto del portfolio ya definido: `627500.00` y `889756.00`.

Cada posición trae los dos porcentajes:

| ticker | totalReturnPercent | dailyReturnPercent |
|--------|--------------------|--------------------|
| BMA | `null` | `-1.15` |
| METR | `-8.20` | `-1.08` |
| PAMP | `-0.45` | `0.44` |

`GET /instruments?q=teco` sigue sin devolver estos porcentajes.

## Tests

`npm test` incluye el caso de la cuenta `10001` y los casos en que falta el costo o el cierre previo. En esos casos el porcentaje que falta es `null` y el otro, si se puede calcular, viene informado.
