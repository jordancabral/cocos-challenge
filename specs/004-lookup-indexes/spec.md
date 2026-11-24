# Feature Specification: Búsquedas acotadas de cuenta, activo, órdenes y precios

**Feature Branch**: `004-lookup-indexes`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Agregar indices a las columnas que se usaran para la busqueda desde la api: users (accountnumber) unique, instruments (ticker) unique, orders (userid), marketdata (instrumentid)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Una cuenta y un ticker, una sola vez (Priority: P1)

Una persona no puede crear una segunda cuenta con el mismo número ni un
segundo activo con el mismo ticker. Buscar esa cuenta o ese ticker sigue
encontrando un solo resultado.

**Why this priority**: Sin unicidad, el portfolio y las órdenes pueden mezclar
dos personas o dos activos. Eso es un defecto de correctitud, no solo de
velocidad.

**Independent Test**: Intentar repetir un número de cuenta existente y un
ticker existente. Los dos intentos se rechazan. Los datos previos no cambian.
Consultar la cuenta `10001` y el ticker `GGAL` sigue devolviendo un solo
resultado.

**Acceptance Scenarios**:

1. **Given** una cuenta con número `10001`, **When** se intenta registrar
   otra cuenta con ese mismo número, **Then** el alta se rechaza y la cuenta
   original sigue igual.
2. **Given** un activo con ticker `GGAL`, **When** se intenta registrar otro
   activo con ese ticker, **Then** el alta se rechaza y el activo original
   sigue igual.
3. **Given** los datos de referencia, **When** se consulta la cuenta `10001`
   o se envía una orden con ticker `GGAL`, **Then** se usa una sola cuenta y
   un solo activo.

---

### User Story 2 - Órdenes y precios de una sola persona o un solo activo (Priority: P2)

Al crecer el historial, ver las órdenes de una cuenta no depende de las
órdenes de las demás. Ver los precios de un activo no depende de los precios
de los demás.

**Why this priority**: Las consultas de hoy ya filtran por cuenta y por
activo. El valor aparece cuando hay muchas órdenes y muchas sesiones de
precio. Se puede comprobar sin cambiar las reglas de negocio.

**Independent Test**: Con varias cuentas y varios activos, el portfolio de
`10001` solo usa las órdenes de esa cuenta, y el precio de un activo solo
usa las sesiones de ese activo. Agregar órdenes de otra cuenta o precios de
otro activo no cambia ese resultado.

**Acceptance Scenarios**:

1. **Given** órdenes de más de una cuenta, **When** se consulta el portfolio
   de `10001`, **Then** el disponible, el valor y las posiciones coinciden
   con las órdenes de esa cuenta.
2. **Given** precios de más de un activo, **When** se envía una orden a
   mercado de `GGAL`, **Then** el precio usado es el último cierre de `GGAL`.
3. **Given** un historial más largo de la misma cuenta o del mismo activo,
   **When** se repite la consulta, **Then** el resultado sigue siendo el de
   esa cuenta o ese activo, no el del conjunto completo.

---

### Edge Cases

- Los datos de referencia no tienen números de cuenta repetidos ni tickers
  repetidos. La unicidad se puede aplicar sin rechazar lo que ya existe.
- Un número de cuenta vacío o un ticker vacío no se vuelve una identidad
  válida por esta funcionalidad.
- Dos cuentas distintas pueden tener órdenes del mismo activo. El portfolio
  de cada una sigue usando solo sus órdenes.
- Varias sesiones de precio del mismo activo siguen siendo válidas. Esta
  funcionalidad no elimina historia.
- La búsqueda por nombre o por un fragmento de ticker no cambia. No se agrega
  un acceso nuevo para esa búsqueda.
- Las reglas de dinero, reservas, estados y rendimientos no cambian.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El número de cuenta MUST ser único. Un segundo registro con el
  mismo número MUST rechazarse sin modificar la cuenta existente.
- **FR-002**: El ticker MUST ser único. Un segundo activo con el mismo ticker
  MUST rechazarse sin modificar el activo existente.
- **FR-003**: Consultar una cuenta, sus órdenes o su portfolio MUST usar solo
  las órdenes de esa cuenta, también cuando existan órdenes de otras cuentas.
- **FR-004**: Obtener el precio de un activo MUST usar solo las sesiones de
  precio de ese activo, también cuando existan precios de otros activos.
- **FR-005**: El costo de encontrar una cuenta, un ticker, las órdenes de una
  cuenta o los precios de un activo MUST depender de esa cuenta o de ese
  activo, no del tamaño del resto de la información.
- **FR-006**: Los datos ya cargados MUST conservarse. Esta funcionalidad MUST
  NOT cambiar saldos, órdenes, precios ni rendimientos.
- **FR-007**: MUST NOT agregarse un acceso nuevo para la búsqueda por nombre
  ni por fragmento de texto. Esa búsqueda sigue como está.

### Key Entities *(include if feature involves data)*

- **Cuenta**: Se identifica por el número de cuenta. Ese número no se
  repite.
- **Activo**: Se identifica por el ticker. Ese ticker no se repite.
- **Orden**: Pertenece a una cuenta. Las consultas de una persona recorren
  las órdenes de esa cuenta.
- **Precio de mercado**: Pertenece a un activo. Las consultas de precio
  recorren las sesiones de ese activo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los intentos de repetir un número de cuenta o un
  ticker existente se rechazan, y el registro original queda igual.
- **SC-002**: En el 100 % de los casos de prueba con varias cuentas, el
  portfolio de `10001` coincide con el calculado solo con sus órdenes.
- **SC-003**: En el 100 % de los casos de prueba con varios activos, el
  precio usado para una orden de `GGAL` es el último cierre de `GGAL`.
- **SC-004**: Al multiplicar las órdenes de otras cuentas o los precios de
  otros activos, el resultado de la cuenta `10001` y del activo `GGAL` no
  cambia.
- **SC-005**: Los saldos, las órdenes, los precios y los rendimientos ya
  calculados para los datos de referencia permanecen iguales.

## Assumptions

- Los cuatro accesos acordados son: cuenta por número de cuenta, activo por
  ticker, órdenes por cuenta y precios por activo. El número de cuenta y el
  ticker son únicos. Los otros dos no exigen unicidad.
- Los datos de referencia ya cumplen esa unicidad.
- No se pide un acceso para buscar por nombre, por fragmento ni por estado
  de la orden.
- No se reordena ni se borra el historial de precios. Sigue habiendo más de
  una sesión por activo.
- Quedan fuera de alcance nuevas operaciones de negocio y cambios en las
  fórmulas de disponible, valor total y rendimientos.
