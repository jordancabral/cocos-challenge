# Data Model: Portfolio, búsqueda y órdenes

El almacenamiento es el esquema de `database.sql`. Este modelo describe las
reglas de negocio sobre esas tablas. Los nombres de columna se conservan.

## Dinero y cantidades

- Un monto o un precio es un decimal exacto al centavo. En base es
  `NUMERIC(10, 2)`. En el dominio es un decimal fijo. En JSON es un string
  con dos decimales.
- Una cantidad de acciones es un entero. En base, `orders.size` es entero.
- El redondeo del porcentaje visible es mitad alejándose de cero, a dos
  decimales, y vive en un solo lugar del dominio.

## Cuenta (`users`)

| Campo | Significado | Regla |
|-------|-------------|--------|
| `id` | Identidad interna | La genera la base |
| `email` | Correo | No se usa para operar |
| `accountNumber` | Número de cuenta | Identifica la cuenta en cada operación |

Relación: una cuenta tiene muchas órdenes.

No se agrega unicidad nueva. El dataset de referencia no repite números de
cuenta. Quien opera indica ese número; no hay sesión.

## Activo (`instruments`)

| Campo | Significado | Regla |
|-------|-------------|--------|
| `id` | Identidad interna | |
| `ticker` | Código | Se muestra y se usa para operar |
| `name` | Nombre | Entra en la búsqueda |
| `type` | `ACCIONES` o `MONEDA` | La moneda es el peso (`ARS`) y no es una posición ni un resultado de búsqueda |

## Precio (`marketdata`)

| Campo | Significado | Regla |
|-------|-------------|--------|
| `instrumentId` | Activo | |
| `date` | Sesión | La más reciente define el último precio |
| `close` | Último precio en pesos | Valúa la posición y ejecuta la orden a mercado |
| `previousClose` | Cierre previo | No se muestra |
| `open`, `high`, `low` | Rango de la sesión | No entran en esta feature |

Si el activo no tiene `close` en la sesión más reciente, una orden que
necesita precio se rechaza y no se inserta.

## Orden (`orders`)

| Campo | Significado | Regla |
|-------|-------------|--------|
| `id` | Identidad interna | Se usa para cancelar |
| `userId` | Cuenta | |
| `instrumentId` | Activo | |
| `side` | `BUY`, `SELL`, `CASH_IN`, `CASH_OUT` | El alta de esta feature solo crea `BUY` y `SELL` |
| `type` | `MARKET` o `LIMIT` | |
| `size` | Cantidad entera de acciones, o pesos cuando el lado es de efectivo y el precio es 1 | Siempre entero y positivo en un alta válida |
| `price` | Precio en pesos usado para evaluar y registrar | Mercado: último `close`. Límite: precio enviado |
| `status` | Estado | Ver transiciones |
| `datetime` | Momento del envío | Ordena el costo promedio si hay empate de negocio; el desempate final es el `id` |

### Transiciones

Estados: `NEW`, `FILLED`, `REJECTED`, `CANCELLED`.

En el alta:

- Compra o venta válida a mercado → `FILLED`.
- Compra o venta válida límite → `NEW`.
- Costo mayor que los pesos disponibles, o cantidad mayor que las acciones
  disponibles → `REJECTED`. El registro guarda size y price evaluados. No
  reserva.

Después del alta solo existe esta transición:

- `NEW` de la misma cuenta → `CANCELLED`.

`FILLED`, `REJECTED` y `CANCELLED` no cambian. Cancelar una orden ajena, inexistente
o que no está en `NEW` no escribe.

### Efecto de cada estado

- `FILLED` de `CASH_IN` o `SELL`: suma `size * price` a los pesos ejecutados.
- `FILLED` de `CASH_OUT` o `BUY`: resta `size * price` de los pesos ejecutados.
- `FILLED` de `BUY`: suma `size` a la cantidad del activo.
- `FILLED` de `SELL`: resta `size` de la cantidad del activo.
- `NEW` de `BUY`: reserva `size * price` pesos. No cambia la cantidad ni el
  valor total.
- `NEW` de `SELL`: reserva `size` acciones. La cantidad mostrada sigue siendo
  la neta ejecutada.
- `REJECTED` y `CANCELLED`: no mueven pesos ni acciones y no reservan.
- Cancelar un `NEW` libera su reserva.

Los pesos disponibles son los pesos ejecutados menos las reservas de compras
`NEW`. El valor total es los pesos ejecutados más la suma de cantidades
netas por el último `close`. La reserva no se resta del valor total.

Las acciones disponibles para una venta nueva son la cantidad neta ejecutada
menos las ventas `NEW` de ese activo.

### Costo y rendimiento

Se recorren las órdenes `FILLED` de compra y venta del activo, de la más
antigua a la más nueva (`datetime`, luego `id`).

- Cantidad y costo empiezan en cero.
- Compra con cantidad positiva: suma acciones y suma `size * price` al costo.
- Venta con cantidad positiva: resta acciones y resta del costo solo las
  acciones que había, al costo promedio de ese momento. Si la cantidad queda
  en cero o negativa, el costo queda en cero.
- Venta con cantidad ya cero o negativa: la cantidad baja y el costo sigue
  en cero.
- Compra con cantidad negativa: solo abre costo por las acciones que superan
  esa cantidad, al precio de la compra.

El valor de mercado es cantidad neta por último `close`. El rendimiento total
es `(valor de mercado − costo) / costo`, en porcentaje con dos decimales. Si
la cantidad no es positiva o el costo no es positivo, el rendimiento se omite
y no se informa como cero.

Una posición con cantidad neta cero no aparece. La moneda no aparece. Una
cantidad negativa sí aparece, con su valor y sin rendimiento.

## Reglas del alta

- Lado `BUY` o `SELL`. Tipo `MARKET` o `LIMIT`.
- Exactamente uno de: cantidad entera positiva, o monto positivo en pesos.
- Con monto, la cantidad es el mayor entero cuyo costo no supera el monto.
  Si es cero, no se inserta orden.
- El límite exige precio con hasta dos decimales. El mercado no lo exige; si
  viene, se ignora y se usa el último `close`.
- Costo o cantidad iguales al disponible se aceptan. Mayores, quedan
  `REJECTED`.
- Cuenta inexistente, activo inexistente, cantidad o monto inválidos, precio
  límite inválido, o activo sin último precio: no se inserta orden.
- Dos altas de la misma cuenta se evalúan en serie gracias al bloqueo de la
  fila del usuario. La segunda ve la reserva o el débito de la primera. El
  lock dura solo esa transacción y no incluye llamadas externas. Órdenes de
  otras cuentas no esperan ese lock. Una ráfaga sobre la misma cuenta encola
  esas órdenes y puede retener conexiones del pool.

## Fuera de este modelo

No se crean `CASH_IN` ni `CASH_OUT` nuevos. No se ejecuta después una orden
`NEW`. No se modifica una orden salvo la cancelación descrita.
