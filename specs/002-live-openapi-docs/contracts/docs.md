# Contrato: página de documentación

La página y el documento describen las operaciones de
[data-model.md](../data-model.md). No cambian esas operaciones.

## GET /docs

Devuelve la página interactiva.

- Lista todas las operaciones públicas: salud, portfolio, búsqueda, envío y
  cancelación.
- Cada operación muestra entradas, resultados y el ejemplo `local`.
- El ejemplo se puede ejecutar contra `http://localhost:3000` sin completar
  los campos.
- Portfolio usa la cuenta `10001`.
- Búsqueda usa `q=teco`.
- Envío usa la cuenta `10001`, ticker `GGAL`, `BUY`, `MARKET` y cantidad `1`.
- Cancelación usa la cuenta `10001` y la orden `5`.
- Los montos documentados son texto con dos decimales.
- No pide autenticación.

## GET /docs-json

Devuelve la descripción OpenAPI de esas mismas operaciones.

- Es OpenAPI 3.
- Los paths de negocio coinciden con los de la página.
- Incluye los ejemplos `local`.
- No incluye `GET /docs` ni `GET /docs-json` como operaciones de negocio.

## Actualización

El documento se arma al servir, desde los controllers. Agregar, cambiar o
quitar una operación pública cambia la página y `GET /docs-json` en el
próximo arranque. La copia en `contracts/openapi.json` se genera desde ese
mismo armado; no se escribe a mano.
