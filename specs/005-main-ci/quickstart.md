# Quickstart: Control automático al actualizar la línea principal

Comprueba el contrato de [contracts/ci.md](contracts/ci.md). Primero las
mismas órdenes en local. Después, el control del push a `main`.

## Prerrequisitos

- Node.js 26
- Docker, para las pruebas de integración y para la imagen
- El checkout del cambio, sin `.env` cargado en el entorno

## Las seis partes

```bash
npm ci
npm run lint
npm run format
npm test
npm run test:integration
npm run build
docker build -t cocos-challenge:ci .
```

`npm test` tiene que superar el 80 % de sentencias, ramas, funciones y
líneas. `docker build` tiene que terminar y dejar la etiqueta
`cocos-challenge:ci`. No hace falta levantar esa imagen ni publicarla.

## El push

Publicar el cambio en `main`. El control de GitHub Actions de ese push tiene
que arrancar solo y quedar verde si las seis partes pasan.

Para ver un fallo, alcanza con repetir el control sobre un cambio que rompa
una prueba, el formato, el build o la imagen. El push queda rojo. Una imagen
creada no lo vuelve verde si otra parte falló.
