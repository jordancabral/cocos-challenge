# Feature Specification: Documentación viva para probar en local

**Feature Branch**: `002-live-openapi-docs`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Quiero que la api levante un endpoint de swagger/openapi, con ejemplos precargados para ejecutar en local. Este swagger se deberia actualizar automaticamente cada vez que se cambie o agregue algun endpoint"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver las operaciones actuales (Priority: P1)

Una persona abre una página en el sistema que está corriendo y ve todas las
operaciones públicas, con sus datos de entrada y sus resultados, en una
descripción OpenAPI.

**Why this priority**: Sin esa página no hay un lugar único para saber qué se
puede hacer. Las demás historias se apoyan en esta vista.

**Independent Test**: Con el sistema en marcha, la persona abre la página y
encuentra portfolio, búsqueda, envío de orden, cancelación y el estado del
sistema. Cada una muestra qué datos pide y qué devuelve.

**Acceptance Scenarios**:

1. **Given** el sistema está en marcha, **When** la persona abre la página de
   documentación, **Then** ve la lista completa de operaciones públicas y
   puede leer la descripción OpenAPI de esas mismas operaciones.
2. **Given** una operación pública, **When** la persona la abre en la página,
   **Then** ve los datos que pide, los resultados posibles y el formato de
   los montos en centavos como texto.

---

### User Story 2 - Ejecutar un ejemplo local ya cargado (Priority: P2)

Una persona prueba una operación desde la misma página, sin escribir la ruta
ni armar el ejemplo. Los ejemplos ya vienen completos para el entorno local
y para los datos de referencia.

**Why this priority**: La página sirve para probar, no solo para leer. El
ejemplo precargado es lo que permite ejecutar en local en un paso.

**Independent Test**: Desde la página, la persona ejecuta el ejemplo de
portfolio de la cuenta `10001` y el de búsqueda `teco`, sin completar campos
a mano, y recibe el resultado de esa cuenta y de ese texto.

**Acceptance Scenarios**:

1. **Given** la página de documentación y los datos locales de referencia,
   **When** la persona ejecuta el ejemplo de portfolio, **Then** la consulta
   usa la cuenta `10001` y muestra el portfolio de esa cuenta.
2. **Given** la misma página, **When** la persona ejecuta el ejemplo de
   búsqueda, **Then** el texto ya cargado es `teco` y el resultado incluye
   TECO2.
3. **Given** el ejemplo de envío de orden, **When** la persona lo ejecuta,
   **Then** el ejemplo ya trae la cuenta `10001`, un activo del mercado local,
   compra a mercado y una acción, y el sistema responde con el estado de esa
   orden.
4. **Given** el ejemplo de cancelación, **When** la persona lo revisa antes
   de ejecutarlo, **Then** ya trae la cuenta `10001` y una orden pendiente de
   los datos locales.

---

### User Story 3 - La documentación sigue a las operaciones (Priority: P3)

Cuando alguien agrega una operación pública o cambia los datos que pide o
devuelve, la página y la descripción OpenAPI pasan a mostrar ese cambio sin
que haya que editar una descripción aparte a mano.

**Why this priority**: El valor de la página se pierde si queda vieja. Esta
historia se puede demostrar después de que la página ya existe.

**Independent Test**: Se agrega una operación pública de prueba y se cambia
un dato de otra. Al volver a abrir la página, la operación nueva está y el
dato cambiado se ve así. No hubo una edición manual de la descripción.

**Acceptance Scenarios**:

1. **Given** una operación pública nueva, **When** el sistema vuelve a
   ofrecer la documentación, **Then** la operación aparece con sus datos de
   entrada, sus resultados y un ejemplo precargado.
2. **Given** una operación a la que se le cambia un dato de entrada o de
   salida, **When** la persona recarga la página, **Then** ve el dato nuevo
   y ya no ve el dato viejo.
3. **Given** una operación pública que se deja de ofrecer, **When** la
   persona abre la página, **Then** esa operación no aparece.

---

### Edge Cases

- La página y la descripción OpenAPI muestran el mismo conjunto de
  operaciones. No puede haber una operación en una y no en la otra.
- Una operación sin ejemplo precargado no se considera documentada.
- Los ejemplos de montos usan centavos como texto, igual que el resto del
  sistema. Un ejemplo no usa un número suelto para un precio o un saldo.
- Ejecutar el ejemplo de envío o de cancelación cambia datos locales. La
  página lo muestra como una acción que escribe, no como una consulta.
- Si el sistema no está en marcha, la página no está disponible.
- La página no pide autenticación, igual que el resto de las operaciones.
- Un ejemplo no inventa una cuenta ni un activo que no existan en los datos
  locales de referencia.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Con el sistema en marcha, una persona MUST poder abrir una
  página de documentación y leer ahí todas las operaciones públicas.
- **FR-002**: Esa página MUST ofrecer la descripción OpenAPI de las mismas
  operaciones, y las dos vistas MUST listar exactamente las mismas
  operaciones, datos de entrada y resultados.
- **FR-003**: Cada operación pública MUST mostrarse con los datos que pide,
  los resultados de éxito y los resultados de rechazo.
- **FR-004**: Cada operación pública MUST incluir al menos un ejemplo
  precargado para el entorno local. La persona MUST poder ejecutarlo desde
  la página sin completar la ruta ni el ejemplo a mano.
- **FR-005**: El ejemplo de portfolio MUST consultar la cuenta `10001`. El
  ejemplo de búsqueda MUST usar el texto `teco`. El ejemplo de envío MUST
  ser una compra a mercado de una acción de un activo local para la cuenta
  `10001`. El ejemplo de cancelación MUST usar la cuenta `10001` y una orden
  pendiente de los datos locales.
- **FR-006**: Los montos de los ejemplos MUST escribirse como texto con
  centavos, en el mismo formato que ya usa el sistema.
- **FR-007**: Al agregar, cambiar o quitar una operación pública, la página
  y la descripción OpenAPI MUST reflejar ese cambio la próxima vez que se
  ofrecen. Una persona MUST NOT tener que mantener una segunda descripción
  a mano para que el cambio se vea.
- **FR-008**: Toda operación pública nueva MUST aparecer con un ejemplo
  precargado. Si el cambio obliga a otro ejemplo, el ejemplo viejo MUST
  dejar de mostrarse.
- **FR-009**: La documentación MUST estar disponible sin autenticación.
- **FR-010**: La documentación MUST describir solo operaciones públicas del
  sistema en marcha. MUST NOT agregar operaciones de negocio nuevas ni
  cambiar las reglas de portfolio, búsqueda, órdenes o cancelación.

### Key Entities *(include if feature involves data)*

- **Operación pública**: Algo que una persona ya puede pedirle al sistema.
  Tiene un nombre, los datos que pide, los resultados posibles y si escribe
  o solo consulta.
- **Ejemplo local**: Un pedido ya completado para esa operación, armado con
  la cuenta, el activo o la orden de los datos locales de referencia, listo
  para ejecutarse desde la página.
- **Descripción OpenAPI**: El mismo catálogo de operaciones en un formato
  que otra herramienta puede leer. Sale de las operaciones públicas
  vigentes, no de un texto mantenido aparte.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona identifica el 100 % de las operaciones públicas en
  una sola página, sin recorrer el código ni otro documento.
- **SC-002**: El 100 % de las operaciones públicas tiene un ejemplo
  precargado, y la persona ejecuta el de portfolio y el de búsqueda sin
  escribir la cuenta ni el texto.
- **SC-003**: En el 100 % de los casos de prueba, la página y la descripción
  OpenAPI nombran las mismas operaciones y los mismos datos.
- **SC-004**: Después de agregar una operación, de cambiar un dato o de
  quitar una operación, la documentación vigente coincide con ese cambio sin
  una edición manual de una segunda descripción.
- **SC-005**: El 100 % de los montos de ejemplo se lee como texto con
  centavos. Ningún ejemplo de precio o saldo queda como un número suelto.

## Assumptions

- El entorno local incluye los datos de referencia ya usados por el sistema:
  la cuenta `10001`, el activo TECO2 y al menos una orden pendiente de esa
  cuenta.
- La compra de ejemplo usa un activo de esos datos locales. No crea una
  cuenta ni un activo nuevos.
- La página se abre en el mismo sistema que está corriendo. No es un sitio
  aparte ni exige publicación manual.
- La descripción OpenAPI que se puede descargar o leer desde esa página es
  la descripción vigente. Cualquier copia guardada se produce desde ahí, no
  se redacta a mano.
- Quedan fuera de alcance la autenticación, los ejemplos para un entorno que
  no sea el local y cualquier cambio de las reglas de negocio ya definidas.
