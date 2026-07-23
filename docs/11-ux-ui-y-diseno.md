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

## Gamificación

Debe **motivar, no manipular ni castigar**. Foco en rachas, logros, progreso y
objetivos, con celebraciones **discretas**. Nunca presión ni patrones oscuros.

## Accesibilidad

Requisito, no opcional (detalle transversal aquí; auditoría en Sprint 16):

- Navegable **por teclado**; **foco visible** en todo elemento interactivo.
- `labels`, `roles` y ARIA cuando corresponda.
- **Contraste** adecuado en ambos temas (objetivo WCAG AA).
- No transmitir información **sólo** por color.
- Objetivos táctiles suficientes en móvil.

Nunca se sacrifica accesibilidad por estética.

## Mensajes al usuario

Cortos, claros, humanos y profesionales. Nunca lenguaje técnico ni códigos de
error crudos. La IA, al recomendar, **explica el motivo y muestra los datos**, sin
afirmaciones absolutas ([06 · Decision Engine e IA](./06-decision-engine-e-ia.md)).
