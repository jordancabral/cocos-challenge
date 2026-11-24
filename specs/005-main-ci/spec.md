# Feature Specification: Control automático al actualizar la línea principal

**Feature Branch**: `005-main-ci`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Agregar github actions con CI. Ante cada push a main, ejecutar tests unitarios y de integracion. Ejecutar build y crear imagen"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saber si la línea principal sigue sana (Priority: P1)

Cada vez que la línea principal recibe un cambio, se ejecutan solas las
pruebas unitarias y las de integración. Quien mira ese cambio ve si pasó o
falló, sin correrlas en su máquina.

**Why this priority**: Un cambio puede llegar a la línea principal con una
prueba rota. El aviso automático es lo que evita descubrirlo recién al
arrancar el sistema.

**Independent Test**: Se publica un cambio en la línea principal. El control
corre las pruebas unitarias, incluida la cobertura que el proyecto ya exige,
y las pruebas de integración. Si una falla, el cambio queda marcado como
fallido.

**Acceptance Scenarios**:

1. **Given** un cambio nuevo en la línea principal, **When** queda publicado,
   **Then** arranca un control automático que ejecuta las pruebas unitarias y
   las de integración.
2. **Given** ese control, **When** las pruebas unitarias y las de integración
   pasan y la cobertura supera el 80 % en sentencias, ramas, funciones y
   líneas, **Then** esa parte del control queda aprobada.
3. **Given** ese control, **When** falla una prueba unitaria, una prueba de
   integración o la cobertura no supera el 80 % en alguna de esas cuatro
   medidas, **Then** el cambio queda marcado como fallido.

---

### User Story 2 - Comprobar que la aplicación se puede entregar (Priority: P2)

El mismo control construye la aplicación y arma la imagen con la que se
entrega. Un cambio que no se puede construir no queda como exitoso.

**Why this priority**: Las pruebas pueden pasar y la entrega igual puede
romperse. La imagen demuestra que el cambio se puede empaquetar.

**Independent Test**: Con las pruebas ya en verde, el control construye la
aplicación y deja creada su imagen. Si la construcción o la imagen fallan, el
cambio queda marcado como fallido.

**Acceptance Scenarios**:

1. **Given** un cambio en la línea principal cuyas pruebas pasan, **When**
   termina el control, **Then** la aplicación fue construida y su imagen fue
   creada.
2. **Given** un cambio que no se puede construir o cuya imagen no se puede
   crear, **When** corre el control, **Then** el cambio queda marcado como
   fallido aunque las pruebas hayan pasado.

---

### User Story 3 - Rechazar un cambio que no cumple el estilo del proyecto (Priority: P3)

El control también revisa que el cambio respete las reglas de tipos, de
análisis y de formato que el proyecto ya exige. Un desvío marca el cambio
como fallido aunque las pruebas pasen.

**Why this priority**: Esas reglas ya son obligatorias. El control nuevo tiene
que aplicarlas, pero el aviso de pruebas y de imagen sigue teniendo valor si
esta revisión se agrega después.

**Independent Test**: Se publica un cambio que no compila, que rompe el
análisis o que no está formateado. Las pruebas no hacen falta para ver el
resultado: el control lo marca como fallido.

**Acceptance Scenarios**:

1. **Given** un cambio con un error de tipos, **When** corre el control,
   **Then** el cambio queda marcado como fallido.
2. **Given** un cambio que no pasa el análisis o el formato, **When** corre
   el control, **Then** el cambio queda marcado como fallido.

---

### Edge Cases

- Un cambio en otra línea no dispara este control.
- Una solicitud de revisión, un tag o una ejecución manual no disparan este
  control.
- El control se puede repetir sobre el mismo cambio. El resultado corresponde
  a ese contenido.
- Si falla cualquiera de las partes obligatorias, el resultado total es
  fallido. Una imagen creada no convierte en exitoso un cambio con pruebas
  rotas.
- Una cobertura de exactamente 80,00 % en cualquiera de las cuatro medidas es
  un fallo.
- El control no necesita las credenciales de la base de la nube. Las pruebas
  de integración usan una base propia de esa ejecución.
- El control no publica la imagen. Crearla alcanza.
- Un cambio que solo toca documentación igual dispara el control completo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada cambio publicado en la línea principal MUST disparar un
  control automático.
- **FR-002**: Ese control MUST ejecutar las pruebas unitarias y MUST fallar
  si la cobertura de sentencias, ramas, funciones o líneas no es
  estrictamente mayor al 80 %.
- **FR-003**: Ese control MUST ejecutar las pruebas de integración y MUST
  fallar si alguna no pasa.
- **FR-004**: Ese control MUST construir la aplicación y MUST fallar si la
  construcción no termina.
- **FR-005**: Ese control MUST crear la imagen de la aplicación y MUST fallar
  si la imagen no se crea.
- **FR-006**: Ese control MUST revisar tipos, análisis y formato, y MUST
  fallar si alguno no pasa.
- **FR-007**: El resultado total MUST ser exitoso solo cuando las pruebas, la
  cobertura, la construcción, la imagen, los tipos, el análisis y el formato
  pasan. Si una parte falla, el resultado total MUST ser fallido.
- **FR-008**: El resultado MUST quedar visible junto al cambio que lo
  disparó.
- **FR-009**: Un cambio que no está en la línea principal MUST NOT disparar
  este control.
- **FR-010**: El control MUST NOT publicar la imagen y MUST NOT depender de
  las credenciales de la base de la nube.

### Key Entities

- **Cambio de la línea principal**: Una publicación sobre la línea que el
  equipo trata como principal. Es lo único que dispara este control.
- **Resultado del control**: El veredicto visible de esa publicación. Es
  exitoso o fallido, y dice cuál parte no pasó cuando falla.
- **Imagen de la aplicación**: El paquete entregable que el control crea
  cuando la construcción llega a ese paso. No sale de la ejecución.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los cambios publicados en la línea principal
  disparan el control.
- **SC-002**: El 100 % de los cambios con una prueba unitaria fallida, una
  prueba de integración fallida o una cobertura de 80,00 % o menos en
  sentencias, ramas, funciones o líneas quedan marcados como fallidos.
- **SC-003**: El 100 % de los controles exitosos incluyen la aplicación
  construida y su imagen creada.
- **SC-004**: El 100 % de los cambios con un error de tipos, de análisis o de
  formato quedan marcados como fallidos.
- **SC-005**: El 100 % de las publicaciones fuera de la línea principal no
  disparan este control.
- **SC-006**: El 100 % de las ejecuciones del control terminan sin usar
  credenciales de la base de la nube y sin publicar la imagen.

## Assumptions

- La línea principal es la rama `main`. El control corre en GitHub Actions
  ante un push a esa rama.
- Las pruebas unitarias, las de integración, la construcción y la imagen son
  las que el proyecto ya tiene. Este control no agrega pruebas ni otra forma
  de entregar la aplicación.
- La cobertura exigida es la del proyecto: estrictamente mayor al 80 % en
  sentencias, ramas, funciones y líneas.
- Los tipos, el análisis y el formato son las revisiones que el proyecto ya
  exige. El control las aplica porque un control de la línea principal no
  puede ignorarlas.
- La imagen se crea dentro de la ejecución y no se envía a un registro.
- Las pruebas de integración disponen de una base propia de esa ejecución.
  No usan la base de la nube ni un archivo de secretos local.
- Quedan fuera de alcance los controles de otras ramas, de solicitudes de
  revisión, de tags y las ejecuciones manuales. También queda fuera publicar
  o desplegar la imagen.
