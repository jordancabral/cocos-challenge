# Research: Documentación viva para probar en local

## Página y documento

- **Decision**: `@nestjs/swagger` arma la descripción en el arranque con
  `SwaggerModule.createDocument` y publica la página en `GET /docs` y el
  documento en `GET /docs-json`. El servidor declarado es
  `http://localhost:3000`, así que probar un ejemplo pega al sistema local.
- **Rationale**: La librería ya está en el proyecto. Genera OpenAPI 3 desde
  los controllers registrados, que es lo que pide la spec: la página y el
  documento salen de las operaciones vigentes.
- **Alternatives considered**: Seguir editando
  `specs/001-portfolio-orders/contracts/openapi.yaml` a mano. Queda como
  contrato de esa feature, pero no puede ser la descripción viva: se
  desalinea en cuanto cambia una operación.

## Qué entra en el documento

- **Decision**: Cada controller público lleva decoradores de
  `@nestjs/swagger` (`ApiTags`, `ApiOperation`, `ApiParam`, `ApiQuery`,
  `ApiBody`, `ApiResponse`). Los montos se documentan como string con el
  patrón `^-?\d+\.\d{2}$`. Un test de Nest compara las rutas registradas con
  los paths del documento y falla si alguna operación pública no está.
- **Rationale**: El build es `tsc`, no el CLI de Nest, así que el plugin que
  infiere tipos en compilación no corre. Los decoradores son la metadata que
  `createDocument` lee. El test impide agregar una ruta y olvidar
  documentarla. No hace falta editar un segundo texto a mano.
- **Alternatives considered**: El plugin de `@nestjs/swagger` con `nest build`.
  También mantiene el documento al día, y obliga a cambiar el build sin una
  necesidad que los decoradores más el test no cubran.

## Ejemplos locales

- **Decision**: Cada operación lleva un ejemplo nombrado `local` ya
  completado: portfolio con `accountNumber` `10001`; búsqueda con `q`
  `teco`; alta con cuenta `10001`, ticker `GGAL`, `BUY`, `MARKET` y
  `quantity` `1`; cancelación con cuenta `10001` y `orderId` `5`. Try it out
  queda habilitado. Las operaciones que escriben se marcan como tales.
- **Rationale**: Esos valores existen en `db/database.sql`. La orden `5` es
  la compra límite pendiente de LOMA. `GGAL` es un activo de ese mismo
  conjunto y ya se usa en la colección de Postman.
- **Alternatives considered**: Dejar los campos vacíos para que cada persona
  los complete. No cumple el ejemplo precargado. Usar TECO2 en la compra
  también es válido; `GGAL` se elige porque el ejemplo de búsqueda ya ocupa
  `teco` y la compra queda distinguible.

## Copia versionada

- **Decision**: La descripción que se sirve en `/docs-json` es la vigente.
  El mismo armado se puede volcar a
  `specs/002-live-openapi-docs/contracts/openapi.json` cuando cambian las
  operaciones. Ese archivo se genera; no se redacta a mano.
- **Rationale**: El constitution pide un OpenAPI versionado y actualizado en
  el mismo cambio. La spec prohíbe mantener otra descripción a mano. Generar
  el archivo desde el mismo armado cumple las dos cosas.
- **Alternatives considered**: No guardar copia y dejar solo la página en
  ejecución. Cumple la spec y deja el constitution sin un archivo
  versionado de esta feature.
