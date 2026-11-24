# Feature Specification: Portfolio, búsqueda y órdenes

**Feature Branch**: `001-portfolio-orders`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "Tomar solo las especificaciones de funcionalidad de https://github.com/cocoscap/cocos-challenge/blob/main/backend-challenge.md. Las especificaciones de tech stack quedan para después."

## Clarifications

### Session 2026-11-20

- Q: ¿Una orden límite pendiente debe reducir los pesos o las acciones que la cuenta todavía puede usar? → A: La compra pendiente reserva pesos y la venta pendiente reserva acciones. El valor total de la cuenta no cambia.
- Q: ¿El porcentaje de rendimiento de cada posición debe salir del costo de las órdenes ejecutadas, o del cambio de precio del día? → A: El rendimiento total compara el valor actual con el costo de las órdenes ejecutadas. El retorno diario se muestra además, según `specs/003-portfolio-both-returns/spec.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar el portfolio (Priority: P1)

Una persona consulta una cuenta y ve, en un solo resultado, cuánto vale la
cuenta, cuántos pesos tiene disponibles para operar y qué acciones tiene.
Cada acción muestra la cantidad, el valor en pesos y el rendimiento total.

**Why this priority**: Es la información que justifica la cuenta. Se puede
demostrar con movimientos ya registrados, sin enviar órdenes nuevas.

**Independent Test**: Con una cuenta que ya tiene ingresos de pesos, compras
y ventas ejecutadas, y órdenes canceladas o rechazadas, la consulta devuelve
el valor total, los pesos disponibles y las posiciones. Una compra pendiente
baja solo los pesos disponibles. Una venta pendiente no cambia esas cifras
mostradas y sí impide vender de nuevo las acciones reservadas.

**Acceptance Scenarios**:

1. **Given** una cuenta con un ingreso de 1.000 pesos ejecutado, una compra
   ejecutada de 2 acciones a 100 pesos y una compra cancelada de 5 acciones,
   **When** la persona consulta el portfolio, **Then** los pesos disponibles
   son 800, la posición tiene 2 acciones y la orden cancelada no modifica ni
   el efectivo ni la cantidad.
2. **Given** una cuenta sin órdenes, **When** la persona consulta el
   portfolio, **Then** el valor total es 0 pesos, los pesos disponibles son
   0 y el listado de posiciones está vacío.
3. **Given** una posición con cantidad neta positiva y un último precio
   conocido, **When** la persona consulta el portfolio, **Then** el valor de
   esa posición es la cantidad por el último precio y el rendimiento total
   sale del costo promedio de las órdenes ejecutadas.
4. **Given** una cuenta con 1.000 pesos y sin posiciones, **When** queda
   pendiente una compra límite de 2 acciones a 100 pesos, **Then** los pesos
   disponibles son 800, el valor total sigue en 1.000 y no aparece una
   posición.
5. **Given** 10 acciones ejecutadas y una venta límite pendiente de 4,
   **When** la persona consulta el portfolio, **Then** la posición sigue
   mostrando 10 acciones y el mismo valor total. Esas 4 acciones no están
   disponibles para otra venta.

---

### User Story 2 - Buscar activos (Priority: P2)

Una persona busca un activo del mercado por ticker, por nombre o por un
fragmento de cualquiera de los dos, y recibe el listado de coincidencias.

**Why this priority**: Permite elegir qué activo operar. No depende de tener
posiciones ni de enviar una orden.

**Independent Test**: Se busca un fragmento que existe en un ticker y otro
que existe solo en un nombre. Cada búsqueda devuelve las coincidencias y
excluye el instrumento de pesos.

**Acceptance Scenarios**:

1. **Given** un activo con ticker TECO2 y nombre Telecom, **When** la
   persona busca "teco", **Then** ese activo aparece una sola vez.
2. **Given** un activo cuyo nombre contiene "Galicia", **When** la persona
   busca "galicia", **Then** ese activo aparece aunque el texto no sea el
   ticker.
3. **Given** un texto que no coincide con ningún ticker ni nombre, **When**
   la persona busca, **Then** el listado vuelve vacío y no es un error.
4. **Given** el instrumento de pesos, **When** la persona busca "ARS" o
   "pesos", **Then** ese instrumento no aparece entre los activos del
   mercado.

---

### User Story 3 - Enviar una orden (Priority: P3)

Una persona envía una compra o una venta, a mercado o límite, indicando
acciones enteras o un monto en pesos. Si el disponible alcanza, la orden a
mercado queda ejecutada en el acto y la orden límite queda pendiente. Si el
monto o la cantidad superan lo disponible, la orden queda rechazada y
registrada, sin cambiar la tenencia.

**Why this priority**: Es el único flujo que modifica la cuenta. El portfolio
y la búsqueda siguen teniendo valor si este flujo todavía no existe.

**Independent Test**: Se envía una orden a mercado con pesos suficientes, otra
con pesos insuficientes y una límite con acciones suficientes. La primera
queda ejecutada y mueve la tenencia; la segunda queda rechazada sin moverla;
la tercera queda pendiente, reserva el disponible y no cambia la cantidad ni
el valor total.

**Acceptance Scenarios**:

1. **Given** pesos disponibles suficientes y un último precio conocido,
   **When** la persona envía una compra a mercado por 4 acciones, **Then**
   la orden queda ejecutada, el precio registrado es el último precio, los
   pesos bajan 4 por ese precio y la posición suma 4 acciones.
2. **Given** una orden límite de compra con precio y con pesos suficientes,
   **When** la persona la envía, **Then** la orden queda pendiente, no se
   ejecuta después por sí sola, los pesos disponibles bajan el costo de esa
   orden y ni la cantidad de acciones ni el valor total cambian.
3. **Given** un último precio de 30 pesos, **When** la persona pide comprar
   con 100 pesos, **Then** la orden es por 3 acciones, el costo es 90 pesos
   y los 10 pesos que no alcanzan para otra acción siguen disponibles.
4. **Given** un costo mayor que los pesos disponibles, **When** la persona
   envía la compra, **Then** la orden queda rechazada y registrada, y los
   pesos y las posiciones siguen iguales.
5. **Given** menos acciones ejecutadas que las que se quieren vender,
   **When** la persona envía la venta, **Then** la orden queda rechazada y
   registrada, y la posición no cambia.
6. **Given** un costo exactamente igual a los pesos disponibles, **When** la
   persona envía la compra, **Then** la orden se acepta.
7. **Given** dos compras a mercado que juntas superan los pesos disponibles
   y cada una por separado no, **When** se aceptan una después de la otra,
   **Then** la primera queda ejecutada y la segunda queda rechazada.
8. **Given** dos compras límite que juntas superan los pesos disponibles y
   cada una por separado no, **When** se envían una después de la otra,
   **Then** la primera queda pendiente y reserva esos pesos, y la segunda
   queda rechazada sin reservar.
9. **Given** 10 acciones ejecutadas y una venta límite pendiente de 4,
   **When** la persona envía otra venta de 7, **Then** la segunda queda
   rechazada y la posición sigue mostrando 10 acciones.

---

### User Story 4 - Cancelar una orden pendiente (Priority: P4)

Una persona cancela una orden propia que todavía está pendiente. La orden
pasa a cancelada, la reserva se libera y la cantidad de acciones y el valor
total no cambian.

**Why this priority**: Solo aplica a órdenes límite ya aceptadas. Consultar,
buscar y ejecutar a mercado no la necesitan.

**Independent Test**: Con una orden pendiente propia, la cancelación la deja
cancelada y devuelve al disponible los pesos o las acciones reservadas. La
misma acción sobre una orden ejecutada, rechazada o ya cancelada no cambia
nada.

**Acceptance Scenarios**:

1. **Given** una compra límite propia pendiente que reservó 200 pesos,
   **When** la persona la cancela, **Then** el estado pasa a cancelada, esos
   200 pesos vuelven a estar disponibles y la cantidad de acciones y el
   valor total siguen iguales.
2. **Given** una orden ejecutada, rechazada o ya cancelada, **When** la
   persona intenta cancelarla, **Then** el estado no cambia y la tenencia no
   cambia.
3. **Given** una orden pendiente de otra cuenta, **When** la persona intenta
   cancelarla, **Then** el estado no cambia.

---

### Edge Cases

- Un monto en pesos menor al precio de una acción no genera una orden: no se
  registran fracciones ni una orden de cero acciones.
- La persona indica cantidad de acciones y monto en pesos a la vez, o no
  indica ninguno: el envío se rechaza y no se registra una orden.
- Una orden límite sin precio, con precio negativo o con más de dos decimales
  se rechaza y no se registra.
- Una orden a mercado no lleva precio. Si la persona informa uno, se ignora
  y el precio de la orden es el último precio del activo.
- Cantidad cero o negativa, monto cero o negativo, cuenta inexistente o
  activo inexistente: el envío se rechaza y no se registra una orden.
- El activo no tiene último precio y la orden lo necesita: el envío se
  rechaza y no se registra una orden.
- Una búsqueda sin texto se rechaza. Una búsqueda sin coincidencias devuelve
  un listado vacío.
- Las órdenes canceladas y rechazadas no entran en la cantidad, el valor, el
  rendimiento ni el disponible, y no reservan.
- Una compra pendiente reserva pesos. No cambia la cantidad, el valor de
  mercado ni el valor total de la cuenta.
- Una venta pendiente reserva acciones. No cambia la cantidad mostrada ni el
  valor total, y esas acciones no quedan disponibles para otra venta.
- Cancelar una orden pendiente libera su reserva.
- Una posición cuya cantidad neta ejecutada es cero no aparece en el listado.
- Una posición con cantidad neta negativa se muestra con su valor (cantidad
  por último precio) y sin rendimiento total.
- Si el costo remanente no es positivo, el rendimiento total no se informa;
  no se informa como cero.
- Cancelar una orden que no existe no modifica ninguna orden.
- Volver a procesar una orden ya terminada no mueve los pesos ni las
  acciones una segunda vez.
- Dos envíos seguidos son dos órdenes distintas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Una persona MUST poder consultar una cuenta por su número de
  cuenta y obtener, en un solo resultado, el valor total en pesos, los pesos
  disponibles para operar y el listado de posiciones en acciones.
- **FR-002**: Cada posición MUST identificar el activo por ticker y nombre, e
  incluir la cantidad de acciones, el valor total en pesos y el rendimiento
  total porcentual cuando este se puede calcular.
- **FR-003**: La cantidad, el valor de mercado y el rendimiento de cada
  posición MUST calcularse solo con las órdenes ejecutadas de ese activo. Las
  órdenes pendientes, canceladas y rechazadas MUST NOT modificarlos.
- **FR-004**: Los pesos de la cuenta MUST calcularse solo con órdenes
  ejecutadas. Un ingreso de pesos (`CASH_IN`) y una venta suman el tamaño por
  el precio. Un egreso de pesos (`CASH_OUT`) y una compra lo restan. El
  instrumento de pesos es el de tipo moneda y MUST NOT aparecer como una
  posición de acciones.
- **FR-005**: Los pesos disponibles para operar MUST ser los pesos de las
  órdenes ejecutadas menos el costo reservado por las compras límite
  pendientes. El valor total de la cuenta MUST ser los pesos de las órdenes
  ejecutadas más el valor de mercado de las posiciones, incluidas las de
  cantidad negativa. Una reserva MUST NOT restarse del valor total.
- **FR-006**: El valor de mercado de una posición MUST ser la cantidad neta
  de acciones por el último precio del activo. El último precio MUST ser el
  cierre de la sesión más reciente. Todos los precios de activos MUST estar
  en pesos.
- **FR-007**: El costo de una posición MUST obtenerse recorriendo sus órdenes
  ejecutadas de la más antigua a la más nueva, con cantidad y costo
  remanente empezando en cero. Una compra con cantidad ya positiva suma
  acciones y suma tamaño por precio al costo. Una venta con cantidad
  positiva resta acciones y resta del costo solo las acciones que había, al
  costo promedio de ese momento; si la venta deja la cantidad en cero o
  negativa, el costo remanente queda en cero. Una venta con cantidad ya cero
  o negativa solo vuelve la cantidad más negativa y deja el costo en cero.
  Una compra con cantidad negativa suma acciones y solo abre costo por las
  acciones que superan esa cantidad negativa, al precio de esa compra; si no
  la superan, el costo sigue en cero.
- **FR-008**: El rendimiento total MUST ser (valor de mercado − costo
  remanente) / costo remanente, expresado en porcentaje con dos decimales,
  redondeado mitad alejándose de cero. Si la cantidad neta no es positiva o
  el costo remanente no es positivo, el rendimiento MUST omitirse y MUST NOT
  informarse como cero.
- **FR-009**: El rendimiento total que muestra cada posición MUST seguir siendo el resultado contra el costo de las órdenes ejecutadas. El retorno diario MUST mostrarse junto a ese rendimiento, con la fórmula y las omisiones de `specs/003-portfolio-both-returns/spec.md`.
- **FR-010**: Una persona MUST poder buscar activos con un texto. El texto
  MUST compararse con el ticker y con el nombre, de forma parcial, sin
  distinguir mayúsculas y sin distinguir acentos. Cada activo MUST aparecer
  una sola vez. El instrumento de pesos MUST NOT aparecer. Sin texto, la
  búsqueda MUST rechazarse. Sin coincidencias, el listado MUST estar vacío.
  Los resultados MUST ordenarse por ticker de la A a la Z e identificar cada
  activo con ticker, nombre y tipo.
- **FR-011**: Una persona MUST poder enviar una orden de compra (`BUY`) o de
  venta (`SELL`), de tipo mercado (`MARKET`) o límite (`LIMIT`), para una
  cuenta y un activo.
- **FR-012**: La orden MUST indicar o una cantidad entera y positiva de
  acciones, o un monto positivo en pesos, y exactamente uno de los dos. Si
  indica un monto, la cantidad MUST ser la mayor cantidad entera de acciones
  cuyo costo, al precio que corresponda, no supere ese monto. Si esa cantidad
  es cero, el envío MUST rechazarse y MUST NOT registrarse una orden.
- **FR-013**: Una orden límite MUST incluir el precio en pesos, con hasta dos
  decimales, al que la persona quiere operar. Una orden a mercado MUST NOT
  exigir precio y MUST usar el último cierre. Un precio enviado en una orden
  a mercado MUST ignorarse.
- **FR-014**: Si la orden cumple las reglas y es a mercado, MUST quedar
  registrada como ejecutada (`FILLED`) en el momento del envío. Si cumple las
  reglas y es límite, MUST quedar registrada como pendiente (`NEW`). Esta
  funcionalidad MUST NOT simular el mercado ni ejecutar después una orden
  pendiente.
- **FR-015**: Si el costo de una compra es mayor que los pesos disponibles, o
  la cantidad de una venta es mayor que las acciones disponibles, la orden
  MUST quedar registrada como rechazada (`REJECTED`) con la cantidad y el
  precio usados en la evaluación. La tenencia MUST permanecer igual. Un costo
  o una cantidad iguales al disponible MUST aceptarse.
- **FR-016**: Una compra límite pendiente MUST reservar pesos por su cantidad
  multiplicada por su precio límite. Una venta límite pendiente MUST reservar
  acciones por su cantidad. Las acciones disponibles para una venta nueva
  MUST ser la cantidad neta ejecutada menos las acciones reservadas por
  ventas pendientes. La cantidad mostrada en la posición MUST seguir siendo
  la cantidad neta ejecutada. Una orden rechazada o cancelada MUST NOT
  reservar.
- **FR-017**: Toda orden registrada MUST guardar la cuenta, el activo, el
  lado, el tipo, la cantidad entera de acciones, el precio en pesos, el
  estado y el momento del envío.
- **FR-018**: Una persona MUST poder cancelar una orden propia en estado
  pendiente. El estado MUST pasar a cancelada (`CANCELLED`) y la reserva de
  esa orden MUST liberarse. La cantidad de acciones y el valor total MUST
  permanecer iguales.
- **FR-019**: Cancelar una orden inexistente, ajena o que no está pendiente
  MUST rechazarse sin cambiar ningún estado ni la tenencia.
- **FR-020**: Un envío con cuenta inexistente, activo inexistente, datos de
  cantidad o monto inválidos, precio límite ausente o inválido, o activo sin
  último precio cuando el precio es necesario, MUST rechazarse sin registrar
  una orden. Ese rechazo MUST NOT usar el estado rechazada de una orden de
  mercado: la orden no llega a existir.
- **FR-021**: Los pesos MUST ser exactos al centavo. Las cantidades MUST ser
  acciones enteras. El mismo conjunto de órdenes y de precios MUST producir
  siempre las mismas cifras de portfolio.
- **FR-022**: El estado resultante de una orden y el efecto sobre la tenencia
  MUST ser un único resultado. Una orden rechazada o un envío inválido MUST
  NOT cambiar la tenencia. Completar otra vez una orden ya terminada MUST NOT
  volver a mover pesos ni acciones.
- **FR-023**: Dos órdenes de la misma cuenta que se aceptan una después de la
  otra MUST evaluarse sobre el disponible que deja la anterior, incluida la
  reserva de una orden límite pendiente. La segunda MUST NOT consumir pesos
  o acciones que la primera ya consumió o reservó.
- **FR-024**: Los ingresos y egresos de pesos MUST contarse cuando están
  registrados como órdenes ejecutadas sobre el instrumento de moneda. Esta
  funcionalidad MUST NOT ofrecer un alta nueva de ingresos ni de egresos.
- **FR-025**: Esta funcionalidad MUST NOT exigir autenticación. Alcanza con
  el número de cuenta indicado por quien consulta u opera.
- **FR-026**: Los estados posibles de una orden MUST ser solo pendiente,
  ejecutada, rechazada y cancelada. La única transición habilitada después
  del alta MUST ser de pendiente a cancelada.

### Key Entities *(include if feature involves data)*

- **Cuenta**: La persona que opera. Se identifica por el número de cuenta y
  tiene un correo. Todas las consultas y órdenes son de una sola cuenta.
- **Activo**: Un instrumento del mercado. Tiene ticker, nombre y tipo. Los
  tipos de esta funcionalidad son acción y moneda. La moneda representa los
  pesos y no se negocia como una acción.
- **Orden**: Un movimiento de una cuenta sobre un activo. Tiene lado
  (compra, venta, ingreso de pesos o egreso de pesos), tipo (mercado o
  límite), cantidad entera, precio en pesos, estado y momento. Las compras y
  ventas ejecutadas cambian acciones y pesos. Los ingresos y egresos
  ejecutados cambian solo los pesos. Una compra límite pendiente reserva
  pesos y una venta límite pendiente reserva acciones hasta que se cancela.
- **Precio de mercado**: El cierre y el cierre previo de un activo, en pesos, para una sesión. La sesión más reciente define el último precio con el que se valúa cada posición. El cierre previo se usa para el retorno diario definido en `specs/003-portfolio-both-returns/spec.md`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona obtiene el valor total, los pesos disponibles y el
  detalle de cada posición en una sola consulta de la cuenta.
- **SC-002**: En el 100 % de los casos verificados, los pesos disponibles
  coinciden al centavo con el neto de las órdenes ejecutadas menos las
  compras pendientes, y las cantidades mostradas coinciden a la acción con
  el neto ejecutado.
- **SC-003**: Una búsqueda por un fragmento de ticker o de nombre devuelve
  solo activos coincidentes, sin duplicados y sin el instrumento de pesos.
  Una búsqueda sin coincidencias devuelve un listado vacío.
- **SC-004**: Una orden a mercado queda ejecutada o rechazada en el mismo
  envío. Una orden límite aceptada queda pendiente y no se ejecuta sola.
- **SC-005**: El 100 % de las órdenes por encima de los pesos o de las
  acciones disponibles quedan rechazadas y la tenencia queda igual que antes
  del envío.
- **SC-006**: El 100 % de los intentos de cancelar una orden que no está
  pendiente terminan sin cambio de estado y sin cambio de tenencia.
- **SC-007**: Ninguna orden registrada tiene una fracción de acción. Un monto
  en pesos siempre se convierte a la mayor cantidad entera cuyo costo no
  supera ese monto.
- **SC-008**: Repetir la consulta de la misma cuenta, sin órdenes nuevas y
  sin precios nuevos, devuelve las mismas cifras.

## Assumptions

- El número de cuenta es el identificador que usa quien consulta u opera. No
  hay sesión ni permisos.
- Quien opera puede indicar cualquier número de cuenta existente. No se
  controla identidad.
- Los ingresos y egresos de pesos ya existen como órdenes ejecutadas sobre el
  instrumento de moneda. Crear transferencias nuevas queda fuera de alcance.
- Una orden límite aceptada permanece pendiente. No hay libro de ofertas,
  ejecución parcial ni pasaje posterior a ejecutada.
- Una compra límite pendiente reserva pesos por cantidad por precio límite, y
  una venta límite pendiente reserva acciones. El valor total de la cuenta no
  cambia. Cancelar la orden libera la reserva. Una orden rechazada no reserva.
- El rendimiento total de una posición es el resultado contra el costo promedio de sus órdenes ejecutadas. El retorno diario es otro porcentaje y se muestra junto a él, según `specs/003-portfolio-both-returns/spec.md`.
- La búsqueda usa un solo texto contra ticker o nombre. No hace falta enviar
  ticker y nombre por separado.
- La comparación de la búsqueda ignora mayúsculas y acentos.
- Los resultados de la búsqueda no incluyen cotización.
- Los precios y los montos se expresan en pesos con exactitud de centavo. Un
  precio con más de dos decimales no se acepta en una orden límite.
- El redondeo visible del rendimiento es mitad alejándose de cero, a dos
  decimales del porcentaje. El cálculo previo a ese redondeo es exacto.
- Si dos órdenes ejecutadas tienen el mismo momento, se recorren en el orden
  estable en que fueron registradas.
- Fuera de alcance: autenticación, simulación del mercado, modificar una
  orden, comisiones, impuestos, plazos de liquidación, monedas distintas del
  peso y consultar la cuenta como estaba en una fecha pasada.
- La forma de construir, documentar y ejecutar el sistema queda para la
  planificación. Esta especificación no fija tecnología.
