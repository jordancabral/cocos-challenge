# Data Model: Documentación viva para probar en local

No hay tablas nuevas. La documentación describe las operaciones que ya
existen.

## Operación pública

Una ruta registrada en los controllers de `src/infrastructure/http`, salvo
la propia página de documentación y el documento OpenAPI.

| Dato | Regla |
|------|--------|
| Nombre | El que muestra la página para esa operación |
| Entradas | Path, query o body, con el tipo y si son obligatorias |
| Resultados | Éxito y rechazos que esa operación ya devuelve (200, 201, 400, 404, 409) |
| Efecto | Consulta, o escritura si envía o cancela una orden |

La operación de salud entra en el mismo catálogo.

## Ejemplo local

Un ejemplo nombrado `local` por operación. Viene completado. La persona no
escribe la ruta ni los campos para ejecutarlo.

| Operación | Ejemplo precargado |
|-----------|--------------------|
| Portfolio | Cuenta `10001` |
| Búsqueda | Texto `teco` |
| Envío | Cuenta `10001`, ticker `GGAL`, lado `BUY`, tipo `MARKET`, cantidad `1`. Hay un segundo ejemplo, `localAmount`, con monto `1000.00`. Hay un tercero, `localLimit`, con cantidad `1` y precio `800.00` |
| Cancelación | Cuenta `10001`, orden `5` |
| Salud | Sin datos |

Un monto del ejemplo, si aparece, es texto con dos decimales. Los ejemplos a mercado no mandan precio. El ejemplo límite manda el precio `800.00`. La cancelación y el envío se presentan como operaciones que escriben.

Si una operación nueva no tiene ejemplo `local`, no está documentada. Si un
cambio invalida el ejemplo, el ejemplo viejo se reemplaza.

## Descripción OpenAPI

El documento que sirve `GET /docs-json` y la página `GET /docs` salen del
mismo armado. Listan las mismas operaciones y los mismos datos.

| Dato | Regla |
|------|--------|
| Origen | Controllers registrados y su metadata de documentación |
| Servidor | `http://localhost:3000` |
| Copia guardada | Generada desde ese armado. No se edita a mano |
| Fuera del catálogo | `GET /docs` y `GET /docs-json` no se documentan como operaciones de negocio |

No hay estados ni transiciones. Quitar una operación pública la saca del
documento en el próximo arranque.
