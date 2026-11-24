# Research: Búsquedas acotadas de cuenta, activo, órdenes y precios

## Índices

- **Decision**: Una migración TypeORM crea cuatro índices, con los mismos
  `CREATE INDEX` en `db/database.sql` para que una base nueva también los
  tenga. Los nombres de columna son los reales de PostgreSQL, en minúscula,
  porque el script original no los citó:
  - `UNIQUE` sobre `users (accountnumber)`
  - `UNIQUE` sobre `instruments (ticker)`
  - índice sobre `orders (userid)`
  - índice sobre `marketdata (instrumentid)`
  Cada `CREATE` usa `IF NOT EXISTS`.
- **Rationale**: El constitution exige migración versionada en todo cambio de
  esquema. `database.sql` es el esquema que carga Docker la primera vez. Sin
  copiarlo ahí, un volumen nuevo no tendría los índices hasta correr la
  migración. `IF NOT EXISTS` permite aplicar las dos vías sin chocarse.
- **Alternatives considered**: Solo editar `database.sql`. No actualiza Neon
  ni un volumen que ya existe. Solo la migración. Deja el arranque local
  nuevo distinto de una base ya creada.

## Qué no se indexa

- **Decision**: No hay índice por nombre de activo, por fragmento de ticker,
  por estado de orden ni por `(instrumentid, date)`.
- **Rationale**: La spec limita los accesos a cuenta, ticker, órdenes de una
  cuenta y precios de un activo. La búsqueda por texto sigue en memoria. El
  orden por fecha no fue pedido.
- **Alternatives considered**: `(instrumentid, date DESC)` para el último
  cierre. Sirve cuando hay muchas sesiones, y esta spec pide el acceso por
  instrumento, no ese orden.

## Unicidad y datos actuales

- **Decision**: Los índices únicos se crean sobre los datos ya cargados. No
  se borran filas ni se reescriben órdenes. Si apareciera un duplicado, la
  migración falla y no deja el esquema a medias.
- **Rationale**: La spec exige conservar los datos y rechazar duplicados
  nuevos. El seed no repite números de cuenta ni tickers.
- **Alternatives considered**: Limpiar duplicados antes de crear el índice.
  No hay duplicados que limpiar.

## Cómo se comprueba

- **Decision**: El catálogo de PostgreSQL debe listar los cuatro índices. Un
  segundo `INSERT` con el mismo `accountnumber` o el mismo `ticker` debe
  fallar. El portfolio de `10001` y el último cierre de `GGAL` deben seguir
  igual.
- **Rationale**: La spec mide unicidad y que el resultado de negocio no
  cambie. No pide un número de milisegundos.
- **Alternatives considered**: Un test de tiempo. No hay SLO en la spec ni en
  el constitution.
