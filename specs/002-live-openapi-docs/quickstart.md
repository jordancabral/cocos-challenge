# Quickstart: Documentación viva para probar en local

Comprueba la página y el documento descritos en
[contracts/docs.md](contracts/docs.md). Los ejemplos están en
[data-model.md](data-model.md).

## Prerrequisitos

- El sistema en marcha en local (`npm run start:local`) o en dev
  (`npm run start:dev`), en `http://localhost:3000`.
- Datos de referencia cargados: cuenta `10001`, activo `GGAL`, ticker que
  contiene `teco`, orden pendiente `5`.

## Ver el catálogo

Abrir `http://localhost:3000/docs`.

Tiene que mostrar salud, portfolio, búsqueda, envío de orden y cancelación.
Cada una, menos salud, tiene el ejemplo `local` ya completado.

Abrir `http://localhost:3000/docs-json`. El JSON lista los mismos paths de
negocio y no lista `/docs` ni `/docs-json`.

## Ejecutar ejemplos

En la página, ejecutar sin editar campos:

1. Portfolio. La cuenta es `10001` y la respuesta trae el valor total, los
   pesos disponibles y las posiciones.
2. Búsqueda. El texto es `teco` y el resultado incluye TECO2.

El envío y la cancelación ya vienen cargados. Ejecutarlos escribe: la compra
crea una orden y la cancelación pasa la orden `5` a cancelada.

## Sigue a las operaciones

Con el test que compara las rutas registradas y el documento OpenAPI, una
ruta pública sin metadata o sin ejemplo `local` hace fallar el test. Después
de corregirla, `/docs` y `/docs-json` muestran el cambio al volver a
arrancar, sin editar `contracts/openapi.json` a mano.
