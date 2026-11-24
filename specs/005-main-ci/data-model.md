# Data Model: Control automático al actualizar la línea principal

No hay tablas ni columnas nuevas. El control describe tres hechos de una
publicación.

## Cambio de la línea principal

| Dato | Regla |
|------|--------|
| Rama | Solo `main` dispara el control |
| Contenido | El checkout de ese push, sin `.env` y sin secretos |

Una publicación en otra rama no crea un control de esta feature.

## Resultado del control

| Dato | Regla |
|------|--------|
| Estado | Exitoso o fallido. No hay un tercer estado de "parcial" |
| Partes | Lint, formato, pruebas unitarias con cobertura, pruebas de integración, build y creación de la imagen |
| Cobertura | Exitosa solo si sentencias, ramas, funciones y líneas superan el 80 % |
| Visibilidad | Queda asociado al push que lo disparó |

El resultado es exitoso solo cuando las seis partes terminan bien. Si una
falla, el resultado es fallido y las partes que no llegaron a correr no lo
salvan.

## Imagen de la aplicación

| Dato | Regla |
|------|--------|
| Origen | El `Dockerfile` que ya construye la aplicación |
| Nombre local | `cocos-challenge:ci` |
| Destino | Se queda en el runner. No se publica |

La imagen existe como parte de un control que llegó a ese paso. No es un
artefacto de despliegue.
