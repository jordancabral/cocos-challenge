# Research: Rendimiento total y retorno diario

## Los dos porcentajes

- **Decision**: Cada posición sigue calculando `totalReturnPercent` contra el costo. Se agrega `dailyReturnPercent` con `(último cierre − cierre previo) / cierre previo`, usando `Money.returnPercentAgainst`. Los dos se redondean ahí, mitad alejándose de cero, a dos decimales. `null` significa que no se informa. `0.00` solo cuando el cálculo da cero.
- **Rationale**: La spec 003 pide los dos datos y no cambia la fórmula del total. `returnPercentAgainst` ya es (este valor − otro) / otro × 100 con el redondeo único del constitution. El cierre es "este valor" y el cierre previo es "el otro".
- **Alternatives considered**: Un redondeo nuevo para el diario. Duplicaría la regla monetaria. Omitir la clave en el JSON en lugar de `null`. El rendimiento total ya viaja como `null`; el diario usa la misma forma.

## De dónde sale el cierre previo

- **Decision**: La fila de `marketdata` más reciente de cada instrumento, la misma que hoy aporta `close`, también aporta `previousclose`. Las dos columnas se leen juntas con `DISTINCT ON (instrumentid) ... ORDER BY instrumentid, date DESC`.
- **Rationale**: El retorno diario de la spec usa el cierre y el cierre previo de la misma sesión más reciente. Hoy `latestCloses` solo selecciona `close`.
- **Alternatives considered**: Buscar el cierre del día anterior en otra fila. La columna `previousclose` de la fila vigente ya es ese dato, y es la que nombra el challenge.

## Cuándo se omite

- **Decision**: `dailyReturnPercent` es `null` si no hay cierre previo o si no es positivo. Se informa aunque la cantidad sea negativa. `totalReturnPercent` no cambia: `null` si la cantidad no es positiva o el costo no lo es.
- **Rationale**: El diario describe el precio, no el costo. La spec lo pide explícito para BMA en la cuenta `10001`.
- **Alternatives considered**: Ocultar el diario también cuando no hay rendimiento total. Taparía el `-1.15` de BMA.

## Contrato

- **Decision**: El portfolio gana `dailyReturnPercent` junto a `totalReturnPercent`. La página `/docs` y `specs/002-live-openapi-docs/contracts/openapi.json` se regeneran desde los controllers. No se cambia búsqueda ni órdenes.
- **Rationale**: El constitution pide que el OpenAPI versionado acompañe el cambio de contrato. La spec 003 deja la búsqueda sin cotización.
- **Alternatives considered**: Dejar el schema del portfolio sin el campo nuevo. La documentación viva quedaría mintiendo.
