# 11 · UX/UI y diseño

El diseño transmite **calma, orden, claridad y profesionalismo**. Cada elemento
tiene una razón para existir; se elimina el ruido visual. La simplicidad siempre
gana: entre dos diseños válidos, se elige el de **menor carga cognitiva**.

## Principios de experiencia

Toda interacción debe ser **rápida, clara, intuitiva y consistente**. Cada
pantalla responde por sí sola a: ¿dónde estoy?, ¿qué puedo hacer?, ¿qué es
importante?, ¿cuál es la siguiente acción? El usuario nunca debería preguntarse
"¿y ahora qué?".

## Mobile-first y responsive

- Se diseña primero para **móvil**, luego tablet, luego desktop. Nunca al revés.
- Funciona correctamente desde **320px** hasta ultra-wide.
- Layouts fluidos; nada de tamaños fijos innecesarios.
- Navegación: barra inferior en móvil, barra lateral en desktop (mismo destino,
  distinta disposición).

## Design tokens y temas

- **Dark mode es el tema principal**; light mode está soportado.
- **Prohibido** usar colores absolutos o hex repetidos en el código. Todo pasa por
  **design tokens** (variables CSS mapeadas en Tailwind):

  `--background`, `--foreground`, `--card`, `--muted`, `--primary`,
  `--secondary`, `--accent`, `--success`, `--warning`, `--danger`, `--border`,
  `--ring`.

- El tema se implementa en `core/theme`; los componentes consumen tokens, nunca
  valores crudos. Cambiar de tema no debe requerir tocar componentes.

### El color de Nexus es el índigo

`--primary: 255 70% 52%` en claro y `255 85% 68%` en oscuro (más claro, porque
sobre negro la marca ilumina en vez de rellenar).

**Se eligió por descarte razonado, y por eso no conviene «mejorarlo» sin releer
esto.** El verde ya significa «bien» (`--success`) y el ámbar «cuidado»
(`--warning`). Con la marca en cualquiera de los dos, **cada botón parecería un
juicio** y la interfaz opinaría sin querer, que es justo lo que evita el resto
del diseño (Salud no opina, las comparativas van en gris). El índigo no colisiona
con ningún estado.

Contraste **medido en el navegador**, no calculado: 7,36:1 sobre el fondo claro y
5,09:1 sobre el oscuro, así que sirve también como color de texto
(`text-primary`) y no sólo de relleno. El texto sobre el botón da 7,05 y 4,93.

Alcanza a `--ring` (el anillo de foco es de la marca) y a `--accent` (los hover
llevan un punto de color en vez del gris neutro). Lo demás sigue neutro a
propósito: una aplicación de siete secciones se cansa si todo grita.

**`--chart-4` se movió de 265 a 292** (magenta) al adoptar el índigo: era el
morado del sueño y quedaba casi idéntico a la marca, con el título índigo de la
sección justo encima de esa línea. Sigue por encima del 3:1 que pide WCAG para un
elemento gráfico (5,14:1 en claro, 8,10:1 en oscuro).

## Sistema visual

| Aspecto            | Regla                                                                            |
| ------------------ | -------------------------------------------------------------------------------- |
| **Espaciado**      | Escala consistente (múltiplos definidos por Tailwind). Sin márgenes arbitrarios. |
| **Tipografía**     | Jerarquía clara, pocos tamaños y pesos, alta legibilidad. No abusar del texto.   |
| **Iconografía**    | **Sólo Lucide React.** No mezclar librerías de iconos.                           |
| **Sombras/Bordes** | Del sistema de tokens; coherentes en toda la app.                                |
| **Componentes**    | Base en `shared/components/ui` (shadcn). No recrear variantes ad-hoc.            |

Todos los módulos comparten el mismo lenguaje visual: el usuario nunca debe sentir
que "cambió de aplicación" al pasar de Workout a Nutrition.

## Animaciones

- Con **Framer Motion**. Deben **guiar, explicar y suavizar**; nunca distraer ni
  ralentizar.
- Toda animación puede eliminarse sin romper la funcionalidad y respeta
  `prefers-reduced-motion`.

### Movimiento reducido

Implementado de forma global en `src/styles/globals.css`. La regla no apaga
todo: **el color y la opacidad se conservan** porque comunican estado (cargando,
foco, error) sin desplazar nada; **lo que desaparece es el movimiento**, que es
lo que molesta o marea. Los indicadores de carga siguen latiendo en opacidad
para no perder la señal de «estamos trabajando».

## Estados de UI (obligatorios)

Cada pantalla/consulta contempla **los cinco**:

| Estado      | Tratamiento                                                                |
| ----------- | -------------------------------------------------------------------------- |
| **Loading** | Skeleton/placeholder, nunca pantalla vacía en blanco.                      |
| **Success** | Datos + acción siguiente clara.                                            |
| **Empty**   | Mensaje humano + acción para empezar (CTA).                                |
| **Error**   | Mensaje claro de qué pasó y cómo resolverlo (no técnico).                  |
| **Offline** | Indicador y confirmación de que el dato se guardó local y se sincronizará. |

## Feedback

Toda acción importante (guardar, eliminar, actualizar, sincronizar) produce
respuesta visual inmediata (toast, cambio de estado, animación breve). El usuario
nunca queda sin saber qué ocurrió.

## Formularios

- Pocos campos; pedir sólo lo necesario.
- Validación en tiempo real con Zod + React Hook Form.
- Mensajes claros que indican **cómo** corregir; nunca jerga técnica.
- Respuesta optimista cuando sea seguro (con reversión si falla).

## Dashboard

Es el centro del sistema. Responde de inmediato: ¿cómo voy?, ¿qué hago hoy?, ¿qué
está pendiente?, ¿qué mejoró/empeoró? No muestra información innecesaria.

**«Registrar rápido» registra de verdad cuando puede.** Lo que se resuelve en un
toque se hace ahí mismo (el agua); lo que exige elegir algo —qué comiste, qué
entrenaste— lleva a su pantalla. Un panel llamado «registrar» que sólo navega
promete lo que no cumple. Las dos clases de acción se ven y se tocan igual: quien
las usa no tiene por qué adivinar de cuál se trata.

Las acciones que registran **no viven en el dashboard**: cada feature expone
desde su barrel un hook con etiquetas ya formadas y una acción sin argumentos
(`useQuickWater`), igual que con los resúmenes. El dashboard no sabe de
mililitros ni de unidades.

## Gamificación

Debe **motivar, no manipular ni castigar**. Foco en rachas, logros, progreso y
objetivos, con celebraciones **discretas**. Nunca presión ni patrones oscuros.

## Accesibilidad

Requisito, no opcional. **Auditada en el Sprint 16** sobre las diez pantallas,
con formularios abiertos y a 320 px: sin campos sin etiqueta, sin controles sin
nombre, sin referencias ARIA rotas, sin ids duplicados, sin saltos en la
jerarquía de encabezados, un único `h1` por pantalla y `lang`/`main` en su sitio.
El **foco visible** se comprobó con `Tab` de verdad —no con `focus()`, que no
activa `:focus-visible` y da falsos negativos— en 14 elementos seguidos: contorno
de 2 px y anillo en todos. Lo único que salió fueron **objetivos táctiles cortos**
(los enlaces «Abrir» del dashboard, de 20 px, y los «Ver …» de Analytics, de 16),
corregidos con `WIDE_TAP_AREA`.

- Navegable **por teclado**; **foco visible** en todo elemento interactivo.
- `labels`, `roles` y ARIA cuando corresponda.
- **Contraste** adecuado en ambos temas (objetivo WCAG AA).
- No transmitir información **sólo** por color.
- **Objetivos táctiles de 44 px como mínimo.** Nexus se usa en el gimnasio, con
  el móvil en la mano y prisa: un botón de borrar que falla es un error caro.
  - En filas densas, el tamaño **visual** puede ser menor (32 px) siempre que el
    área pulsable llegue a 44 px: para eso está la variante `iconSm` del
    `Button`, que la amplía con un pseudo-elemento invisible.
  - En **enlaces de texto** (los «Abrir» del dashboard, los «Ver …» de
    Analytics) se usa la misma idea con otra forma: `WIDE_TAP_AREA`
    (`shared/constants`) cubre todo el ancho y sólo corrige el alto, que es lo
    que se queda corto en una línea de texto. Estirarlos de verdad abriría un
    hueco donde el diseño pedía una línea.
  - En **controles adyacentes** (p. ej. el selector de tema) no se usa esa
    técnica: las áreas se solaparían y se pulsaría el botón equivocado. Ahí los
    controles se agrandan de verdad. Al aplicarla hay que **comprobar que no
    choca** con otro control: se hace con `elementFromPoint` a ±21 px del centro,
    llevando antes el elemento al centro de la pantalla (fuera del viewport
    devuelve `null` y parece un fallo que no existe).
  - Cuando ni así caben, se documenta el porqué: los siete días del
    mini-calendario de hábitos miden **36 px** porque a 44 no entran en una
    pantalla de 320 px. Siguen por encima del mínimo de WCAG 2.2 (24 px) y
    llevan separación entre ellos.

Nunca se sacrifica accesibilidad por estética.

## Mensajes al usuario

Cortos, claros, humanos y profesionales. Nunca lenguaje técnico ni códigos de
error crudos. La IA, al recomendar, **explica el motivo y muestra los datos**, sin
afirmaciones absolutas ([06 · Decision Engine e IA](./06-decision-engine-e-ia.md)).
