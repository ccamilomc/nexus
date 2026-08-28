# Cambios

Las versiones siguen [SemVer](https://semver.org/lang/es/). Las decisiones que
explican el porqué de cada cosa viven en [`docs/adr/`](./docs/adr/README.md).

## 1.1.0 — 2026-08-28

Finanzas deja de ser un cuaderno donde apuntar y pasa a contestar preguntas. Y de
paso salieron dos cosas que llevaban tiempo rotas sin que nadie lo notara.

### Lo que la lista de movimientos escondía

**Sólo se veían ocho movimientos del mes, y nada lo decía.** Con ciento y pico al
mes, casi todo lo apuntado era invisible: no es que las cifras estuvieran mal, es
que la lista enseñaba un trozo y parecía entera. Ahora se ven todos, y cuando un
filtro recorta, la pantalla dice cuántos de cuántos.

Con eso llegaron el **buscador** —por nota, categoría, cuenta y también por el
monto, porque uno se acuerda de «fueron como cuarenta y cinco mil» antes que de
lo que escribió— y los **filtros por tipo y por categoría**, con «sin categoría»
como opción propia para repasar lo que quedó a medias.

### Lo nuevo de Finanzas

- **Abonar una deuda desde su tarjeta.** El botón abre el movimiento ya relleno y
  apuntando a esa deuda; antes había que apuntarlo a mano y acordarse de
  vincularlo.
- **Las cuotas por fin calculan.** Se guardaban y se escribían —«12 cuotas»— sin
  hacer ninguna cuenta. Ahora dicen cuánto toca al mes, cuántas van y si vas
  atrasado, con **tres fórmulas distintas** según cómo corra el interés: un
  millón al 2 % en doce cuotas sale a $103.333 de una forma y a $94.560 de otra.
- **Presupuesto del mes**, además de los topes por categoría. La suma de los
  topes no contestaba «¿cuánto puedo gastar en total?», porque la mayor parte del
  gasto no tiene tope.
- **Repartir un gasto entre varias categorías.** La compra del súper con el jabón
  dentro. Las partes se recortan del total y no lo sustituyen, así que el saldo
  no puede descuadrar; sólo se teclea lo que se recorta y el resto se calcula.
- **Exportar a un archivo que abre Excel.** Con punto y coma y marca UTF-8, que
  es donde estos exportadores fallan en español, y una fila por categoría para
  que una tabla dinámica cuente bien un gasto repartido.

### Lo demás

- **Los campos de dinero se agrupan mientras se escribe**: «1.000.000» y no
  «1000000». Un cero de más se ve al momento, que es el error que más caro sale.
- **Leer el código de barras** para dar de alta un alimento, sin ninguna
  dependencia nueva: usa el lector que ya trae el teléfono, y donde no existe el
  botón no se ofrece.
- **El aviso de versión nueva tapaba la barra de navegación** en pantallas de
  375 px. Estaba anotado como «puede solaparse» y se solapaban enteros, siempre.
- **Se felicitaba a quien acababa de crear la cuenta.** El motor callaba en dos
  situaciones distintas —«no te falta nada» y «no hay contra qué compararte»— y
  las dos pantallas lo contaban igual.
- **La caché guardada en el teléfono tumbaba la pantalla** tras el despliegue:
  traía datos con la forma vieja y recargar no arreglaba nada. Se descarta al
  cambiar de versión, como estaba previsto y como se me olvidó hacer.
- **Zustand sale del stack** sin haberse llegado a usar
  ([ADR-0013](./docs/adr/0013-sin-zustand.md)).

## 1.0.0 — 2026-08-27

Primera versión completa. Nexus deja de ser un proyecto en construcción y pasa a
poder usarse a diario. Está **en producción y con dos cuentas reales**.

### Qué hace

- **Se entra con un enlace al correo**, sin contraseña. La pantalla arranca
  pidiendo sólo el correo y la contraseña queda a un toque, porque lo que
  molestaba de verdad era teclearla en el teléfono. La respuesta es la misma
  exista o no la cuenta —si no, sería una forma de averiguar quién está
  registrado— y el enlace **entra pero no crea cuentas**, para que un correo mal
  escrito no abra una cuenta vacía en silencio.
- **Bienvenida al entrar por primera vez.** Tres a cinco pantallas, según lo que
  digas que vas a seguir, y todas se pueden saltar. Termina diciendo **por dónde
  empezar** en cada módulo que hayas marcado, que es lo que faltaba: antes se
  entraba a una pantalla en blanco.
- **«Hoy»** responde «¿qué me falta?» con lo más urgente arriba y el estado de
  los módulos debajo. Cada aviso explica **por qué** aparece y se puede descartar
  hasta mañana.
- **Siete módulos** con su pantalla: entrenamiento (rutinas, sesiones, series e
  historial, con **303 ejercicios: 302 ilustrados y los 303 con instrucciones
  escritas**), nutrición (macros, agua y coste por porción), finanzas
  (movimientos, pagos fijos, deudas, cuentas y topes), hábitos (rachas y
  constancia, **por días de la semana** si quieres), estudio (materias y
  cronómetro), sueño y salud (ocho medidas con IMC).
- **Cada ejercicio explica cómo se hace y qué se suele hacer mal.** El dibujo
  enseña la postura; debajo, dos frases y un «Cuida:» con el error que de verdad
  se comete. Escritas a mano una por una, no generadas del nombre.
- **Al apuntar una serie se puede decir que fue de calentamiento y cuánto
  costó.** El calentamiento no cuenta para el volumen ni gasta número de serie, y
  el esfuerzo se pregunta en repeticiones que te quedaban, que es lo único que
  uno sabe contestar frente a la barra.
- **Plan del día** con las tres reglas del motor: recalcular el día cuando algo
  se cae, proponer un cambio de comida dentro del presupuesto y ofrecer una
  rutina alternativa.
- **Dashboard** de los siete módulos a 7, 30 o 90 días, con comparativa contra el
  tramo anterior y la posibilidad de retroceder en el tiempo. Cada dato lleva la
  forma que le corresponde: barras lo que se acumula, líneas lo que se mide, y un
  calendario los hábitos, para ver si hay un día de la semana que siempre falla.
- **Se instala** como aplicación y **se puede apuntar sin conexión**: los siete
  registros —agua, comidas, series, hábitos, gastos, estudio y sueño— esperan en
  cola y salen solos al volver la red.

### Cómo está construida

- **Arquitectura por dominios**, cada uno con sus capas: repositorio → servicio →
  hook → pantalla ([ADR-0001](./docs/adr/0001-arquitectura-por-capas.md)).
- **El motor de decisiones es puro**: no toca la base ni la interfaz, y funciona
  sin ninguna IA detrás ([ADR-0002](./docs/adr/0002-decision-engine-independiente.md),
  [ADR-0003](./docs/adr/0003-ia-como-capa-de-interpretacion.md)).
- **36 tablas con RLS**, sin una sola política que no filtre por usuario.
  **Comprobado con las dos cuentas reales**: consultando la base como el segundo
  usuario, ve cero de todo lo del primero
  ([ADR-0005](./docs/adr/0005-multiusuario-desde-el-diseno.md),
  [ADR-0010](./docs/adr/0010-la-cache-lleva-firmado-su-dueno.md)).
- **La cola de escrituras sin conexión es la de TanStack Query**, no una propia:
  ya pausaba las mutaciones y ya las persistía
  ([ADR-0011](./docs/adr/0011-la-cola-offline-es-la-de-tanstack-query.md)).
- **Un solo tema, oscuro.** El claro se retiró: no lo usaba nadie y obligaba a
  comprobar cada pantalla dos veces
  ([ADR-0012](./docs/adr/0012-un-solo-tema.md)).
- **964 pruebas** sobre servicios, utilidades y el motor.
- **451 KB comprimidos en la primera visita**, en la que se descarga el cascarón
  entero para que a partir de ahí abra sin red. Las 906 ilustraciones de los
  ejercicios quedan **fuera** de esa descarga: se guardan al verlas.
- **La marca es un nudo de tres anillos entrelazados**: ninguno sujeta a los
  otros dos por sí solo. El cruce se dibuja con un hueco del color del fondo y no
  con sombras, que es lo que le permite aguantar a 32 px.
- Sin `TODO`, `FIXME`, `HACK`, `@ts-ignore` ni `any` en todo `src`.

### Lo que deliberadamente **no** trae

Está aplazado con motivo, no olvidado:

- **La capa de IA.** Necesita una función de servidor y la clave de un proveedor.
  La aplicación funciona entera sin ella, y esa es la idea
  ([ADR-0003](./docs/adr/0003-ia-como-capa-de-interpretacion.md)).
- **Las notificaciones.** Lo que se pedía son recordatorios a una hora, y en la
  web eso sólo es Web Push, que es un sprint entero de servidor
  ([ADR-0008](./docs/adr/0008-notificaciones-aplazadas.md)).
- **El lector de códigos de barras** para la comida empacada. Antes de
  construirlo hay que medir cuántos productos colombianos aparecen de verdad en
  Open Food Facts; si no aparecen, no sirve de nada.
- **Las fotos de progreso** de salud y el **peso objetivo**, descartados los dos.
- **El tema claro** ([ADR-0012](./docs/adr/0012-un-solo-tema.md)).

Nexus no avisa de nada, y no finge que sí.
