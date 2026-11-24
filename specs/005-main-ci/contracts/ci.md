# Contrato: control de la línea principal

No cambia ninguna operación pública. El contrato es el del control descrito
en [data-model.md](../data-model.md).

## Disparo

| Hecho | Efecto |
|-------|--------|
| Push a `main` | Empieza el control |
| Push a otra rama, solicitud de revisión, tag o ejecución manual | Este control no empieza |

## Partes obligatorias, en orden

1. `npm run lint`
2. `npm run format`
3. `npm test`
4. `npm run test:integration`
5. `npm run build`
6. `docker build -t cocos-challenge:ci .`

Cada una usa el proyecto como está. El build es el chequeo de tipos. La
imagen no se publica. No se inyecta `DATABASE_URL` ni otro secreto.

## Resultado

- El control queda verde solo si las seis partes terminan con éxito.
- Si una parte falla, el control queda rojo.
- El resultado se ve en el push que lo disparó.
