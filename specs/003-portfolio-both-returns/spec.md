# Feature Specification: Rendimiento total y retorno diario

**Feature Branch**: `003-portfolio-both-returns`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "El challenge pide rendimiento total y luego menciona previousClose para el retorno diario. La implementación muestra solo retorno total y no muestra retorno diario; previousClose no se lee. Es una decisión documentada en spec.md. Deberiamos retornar ambos valores, modificar o crear nuevo spec si es necesario"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver los dos rendimientos de una posición (Priority: P1)

Una persona consulta el portfolio y, en cada posición, ve el rendimiento
total contra lo que costó la tenencia y el retorno diario del precio.

**Why this priority**: El challenge pide las dos lecturas. Hoy solo se
entrega una, así que la consulta no informa el cambio del día.

**Independent Test**: Con la cuenta `10001` y los precios de la sesión más
reciente, PAMP muestra rendimiento total `-0.45` y retorno diario `0.44`;
METR muestra `-8.20` y `-1.08`; BMA no tiene rendimiento total y muestra
retorno diario `-1.15`.

**Acceptance Scenarios**:

1. **Given** una posición con cantidad positiva, costo positivo, último
   cierre y cierre previo positivo, **When** la persona consulta el
   portfolio, **Then** la posición trae los dos porcentajes.
2. **Given** la cuenta `10001`, **When** la persona consulta el portfolio,
   **Then** PAMP muestra rendimiento total `-0.45` y retorno diario `0.44`,
   y METR muestra rendimiento total `-8.20` y retorno diario `-1.08`.
3. **Given** una posición con cantidad negativa y cierre previo positivo,
   **When** la persona consulta el portfolio, **Then** el rendimiento total
   se omite y el retorno diario sí se informa. En la cuenta `10001`, BMA
   muestra retorno diario `-1.15`.

---

### User Story 2 - Omitir un rendimiento sin ocultar el otro (Priority: P2)

Si uno de los dos porcentajes no se puede calcular, la posición sigue
visible y el otro porcentaje se informa cuando sí se puede calcular.

**Why this priority**: Mezclar las dos omisiones escondería un dato que sí
existe. Se puede probar aparte de la cuenta de referencia.

**Independent Test**: Una posición sin costo muestra valor y retorno diario,
y no muestra rendimiento total. Una posición sin cierre previo muestra
rendimiento total, si corresponde, y no muestra retorno diario.

**Acceptance Scenarios**:

1. **Given** una posición cuyo costo remanente no es positivo, **When** la
   persona consulta el portfolio, **Then** el rendimiento total no aparece y
   no se informa como cero.
2. **Given** una posición sin cierre previo, o con cierre previo cero o
   negativo, **When** la persona consulta el portfolio, **Then** el retorno
   diario no aparece y no se informa como cero.
3. **Given** que solo falta uno de los dos datos, **When** la persona
   consulta el portfolio, **Then** la posición sigue en el listado con su
   cantidad y su valor.

---

### Edge Cases

- El rendimiento total sigue la regla ya definida: (valor de mercado − costo
  remanente) / costo remanente. No se reemplaza por el retorno diario.
- El retorno diario es (último cierre − cierre previo) / cierre previo de la
  sesión más reciente. No usa el costo de las órdenes.
- Los dos porcentajes se redondean mitad alejándose de cero, a dos decimales.
- Si el último cierre es igual al cierre previo, el retorno diario es `0.00`.
- Una posición de cantidad neta cero sigue sin aparecer.
- El instrumento de pesos no es una posición y no lleva estos porcentajes.
- La búsqueda de activos no agrega cotización ni estos porcentajes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada posición del portfolio MUST informar el rendimiento total
  y el retorno diario como dos datos distintos.
- **FR-002**: El rendimiento total MUST seguir siendo (valor de mercado −
  costo remanente) / costo remanente, en porcentaje con dos decimales,
  redondeado mitad alejándose de cero. Si la cantidad neta no es positiva o
  el costo remanente no es positivo, MUST omitirse y MUST NOT informarse
  como cero.
- **FR-003**: El retorno diario MUST ser (último cierre − cierre previo) /
  cierre previo de la sesión más reciente, en porcentaje con dos decimales,
  redondeado mitad alejándose de cero.
- **FR-004**: El retorno diario MUST usar el cierre y el cierre previo de la
  misma sesión más reciente. MUST NOT usar el costo de las órdenes.
- **FR-005**: Si no hay cierre previo, o no es positivo, el retorno diario
  MUST omitirse y MUST NOT informarse como cero.
- **FR-006**: La falta de uno de los dos porcentajes MUST NOT ocultar la
  posición ni el otro porcentaje cuando este sí se puede calcular.
- **FR-007**: El valor de mercado, la cantidad y los pesos de la cuenta MUST
  permanecer como ya están definidos. Esta funcionalidad solo agrega el
  retorno diario al resultado de cada posición.

### Key Entities *(include if feature involves data)*

- **Posición**: Tenencia de un activo en una cuenta. Muestra cantidad, valor
  en pesos, rendimiento total y retorno diario.
- **Rendimiento total**: Resultado de la tenencia contra su costo, a partir
  de las órdenes ejecutadas y del último cierre.
- **Retorno diario**: Cambio del precio entre el cierre previo y el último
  cierre de la sesión más reciente. No depende del costo de la posición.
- **Precio de mercado**: Último cierre y cierre previo de un activo, en
  pesos, para una sesión.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de las posiciones de la cuenta `10001` que tienen
  cierre y cierre previo, el retorno diario informado coincide con
  (último cierre − cierre previo) / cierre previo, a dos decimales.
- **SC-002**: En el 100 % de esas posiciones, el rendimiento total sigue
  igual que antes de esta funcionalidad: PAMP `-0.45`, METR `-8.20` y BMA
  sin rendimiento total.
- **SC-003**: En el 100 % de los casos en que falta el costo o falta el
  cierre previo, se omite solo el porcentaje que no se puede calcular, y la
  posición sigue visible si su cantidad neta no es cero.
- **SC-004**: Ningún porcentaje que no se puede calcular se informa como
  cero. El `0.00` aparece solo cuando el cálculo da cero.

## Assumptions

- Esta spec reemplaza la decisión de `specs/001-portfolio-orders/spec.md`
  que dejaba el retorno diario definido pero oculto. El rendimiento total no
  cambia de fórmula.
- Los cierres de la cuenta `10001` en la sesión más reciente son: PAMP
  `925.85` contra `921.80`, METR `229.50` contra `232.00` y BMA `1502.80`
  contra `1520.25`.
- El retorno diario se muestra también en una posición de cantidad negativa,
  porque describe el precio y no el costo.
- La búsqueda de activos sigue sin cotización.
- Quedan fuera de alcance otros períodos de rendimiento, comisiones e
  impuestos.
