# Cambios

Las versiones siguen [SemVer](https://semver.org/lang/es/). Las decisiones que
explican el porqué de cada cosa viven en [`docs/adr/`](./docs/adr/README.md).

## 1.0.0 — 2026-08-13

Primera versión completa. Nexus deja de ser un proyecto en construcción y pasa a
poder usarse a diario.

### Qué hace

- **Panel del día.** Responde «¿qué me falta hoy?» con lo más urgente arriba y el
  estado de los siete módulos debajo. Cada aviso explica **por qué** aparece, y
  se puede descartar hasta mañana.
- **Siete módulos** con su propia pantalla: entrenamiento (rutinas, sesiones,
  series e historial), nutrición (macros, agua y coste por porción),
  **finanzas** (movimientos, pagos fijos, deudas, cuentas y topes por
  categoría), hábitos (rachas y constancia), estudio (materias y cronómetro por
  bloques), sueño y salud (ocho medidas con IMC).
- **Plan del día** con las tres reglas del motor de decisiones: recalcular el día
  cuando algo se cae, proponer un cambio de comida dentro del presupuesto y
  ofrecer una rutina alternativa.
- **Analíticas** de los siete módulos a 7, 30 o 90 días, con comparativa contra
  el tramo anterior.
- **Se instala** como aplicación (PWA) y **sigue abriéndose sin conexión**, con
  lo último que se vio.

### Cómo está construida

- **Arquitectura por dominios**, cada uno con sus capas: repositorio → servicio →
  hook → pantalla ([ADR-0001](./docs/adr/0001-arquitectura-por-capas.md)).
- **El motor de decisiones es puro**: no toca la base ni la interfaz, y funciona
  sin ninguna IA detrás ([ADR-0002](./docs/adr/0002-decision-engine-independiente.md),
  [ADR-0003](./docs/adr/0003-ia-como-capa-de-interpretacion.md)).
- **36 tablas con RLS**, sin una sola política que no filtre por usuario. Dos
  cuentas conviven sin verse, también en el dispositivo
  ([ADR-0005](./docs/adr/0005-multiusuario-desde-el-diseno.md),
  [ADR-0010](./docs/adr/0010-la-cache-lleva-firmado-su-dueno.md)).
- **627 pruebas** sobre servicios, utilidades y el motor.
- **193 KB gzip** en la primera visita; después lo sirve el service worker.
- Sin `TODO`, `FIXME`, `HACK`, `@ts-ignore` ni `any` en todo `src`.

### Lo que deliberadamente **no** trae

Está aplazado con motivo, no olvidado:

- **La capa de IA.** Necesita una función de servidor y la clave de un proveedor.
  La aplicación funciona entera sin ella, y esa es la idea
  ([ADR-0003](./docs/adr/0003-ia-como-capa-de-interpretacion.md)).
- **La cola de escrituras sin conexión.** Se puede consultar sin señal, pero para
  **registrar** hace falta. Es la parte más delicada del sistema y sólo se
  retomará si de verdad se pierde algún dato
  ([ADR-0004](./docs/adr/0004-estrategia-offline-first.md)).
- **Las notificaciones.** Lo que se pedía son recordatorios a una hora, y en la
  web eso sólo es Web Push, que es un sprint entero de servidor
  ([ADR-0008](./docs/adr/0008-notificaciones-aplazadas.md)).
- **Las fotos de progreso** de salud.

Nexus no avisa de nada, y no finge que sí.
