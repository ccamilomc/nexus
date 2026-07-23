# 07 · Convenciones de código

Objetivo: que todo el proyecto se sienta escrito por **una sola persona senior**,
aunque pasen meses o cambie el contexto. Estas reglas las hace cumplir la
herramienta (ESLint + Prettier + `tsc`) siempre que es posible; lo que no, es
responsabilidad de la revisión.

## TypeScript

- **`strict` obligatorio** en `tsconfig.json` (con `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `exactOptionalPropertyTypes`).
- **Prohibido:** `any`, `unknown` sin validar, `@ts-ignore`, `@ts-nocheck`,
  casting innecesario (`as`).
- Preferir **inferencia** cuando el tipo es evidente; anotar en las fronteras
  públicas (parámetros y retornos de services/repositories/hooks exportados).
- Los tipos que cruzan capas o features viven en `types/` (de la feature o de
  `shared/`). No duplicar tipos.
- **Zod como fuente única** de los datos externos: se define el esquema y se
  infiere el tipo (`z.infer`). No mantener tipo y validación por separado.

## React

- **Sólo componentes funcionales.** Nunca clases.
- **Composición sobre herencia.** Preferir componer a añadir props.
- Un componente = **una responsabilidad**. Si supera ~200–250 líneas, se divide.
- Clasificación de componentes:
  | Tipo                            | Responsabilidad                          |
  | ------------------------------- | ---------------------------------------- |
  | **UI** (`shared/components/ui`) | Reutilizable, sin negocio.               |
  | **Feature**                     | UI específica de un dominio.             |
  | **Layout**                      | Sólo estructura (shell, nav).            |
  | **Page**                        | Orquesta componentes; sin lógica pesada. |
- Evitar prop drilling: usar composición, contexto acotado o el store de la feature.
- Nada de cálculos pesados ni acceso a datos en el componente: eso va al hook/service.

## Custom Hooks

- Toda lógica reutilizable con estado vive en un hook (`useWorkout`,
  `useNutrition`, `useDashboard`…).
- Un hook **nunca** devuelve JSX ni renderiza UI.
- Los hooks de datos envuelven TanStack Query y exponen `{ data, isLoading,
isError, ... }` y mutaciones; **no** contienen reglas de negocio (delegan al service).

## Capas: reglas rápidas

Ver detalle en [02 · Arquitectura](./02-arquitectura.md).

- **Component** → sólo UI. **Hook** → estado/orquestación. **Service** → reglas.
  **Repository** → datos. **Decision Engine** → reglas puras.
- El componente no importa el repository. El service no conoce React. El
  repository no toma decisiones de negocio.

## Estado

| Estado       | Herramienta             | Regla                                                                  |
| ------------ | ----------------------- | ---------------------------------------------------------------------- |
| Server state | TanStack Query          | Único canal a datos remotos; claves de query consistentes por feature. |
| UI global    | Zustand                 | Sólo UI (tema, navegación); un store por preocupación.                 |
| Formularios  | React Hook Form         | Validación con Zod (`zodResolver`).                                    |
| Local        | `useState`/`useReducer` | Efímero y local al componente.                                         |

Nunca duplicar estado ni sincronizarlo a mano. Una sola fuente de verdad por dato.

## Nomenclatura

| Elemento                     | Convención         | Ejemplo                  |
| ---------------------------- | ------------------ | ------------------------ |
| Variables/funciones          | `camelCase`        | `weeklyVolume`           |
| Componentes/Tipos/Interfaces | `PascalCase`       | `WorkoutCard`, `MealLog` |
| Hooks                        | `useCamelCase`     | `useHydration`           |
| Constantes                   | `UPPER_SNAKE_CASE` | `MAX_SETS_PER_SESSION`   |
| Archivos de código React     | `PascalCase.tsx`   | `SetRow.tsx`             |
| Archivos no-componente       | `kebab-case.ts`    | `workout.service.ts`     |
| Tablas/columnas BD           | `snake_case`       | `workout_sets`           |

## Importaciones

Orden (automático con ESLint): externas → alias internos → locales → estilos.
Preferir imports desde el **barrel** de cada feature (`@/features/workout`), no de
sus archivos internos. Prohibido el import cruzado entre internos de features.

## Manejo de errores

- Toda operación contempla **loading / success / error / empty / offline**.
- Los errores se **normalizan** en `core/error` a un tipo `AppError` con un
  `code` y un mensaje **humano**; los componentes muestran ese mensaje, nunca el
  técnico.
- Nada de errores silenciosos: se capturan y, si aportan, se registran vía
  `core/logger` (nunca datos sensibles; ver [12](./12-seguridad.md)).
- `ErrorBoundary` global + estados de error por feature.

## Comentarios y documentación en código

- El código se explica por sí mismo (buenos nombres). Se comenta **el porqué**, no
  el qué.
- Prohibidos como solución permanente: `TODO`, `FIXME`, `HACK`, `TEMP`,
  `WORKAROUND`. Si una solución temporal es inevitable, se documenta y se registra.
- JSDoc en las funciones públicas de services/engine cuando el contrato no sea
  obvio.

## Utilidades

Las funciones de `utils/` son **puras** (sin efectos secundarios), fáciles de
probar y reutilizar. Si necesita I/O, no es una util: es un service/repository.

## Testing

Se prueba lo que **aporta valor**, no por cobertura. Prioridad:

1. **Decision Engine** (reglas) — máxima prioridad.
2. Services y utilidades puras.
3. Hooks críticos y flujos de autenticación/sincronización.

Herramientas: Vitest + Testing Library. Los tests del motor usan `DailyContext`
fijos, sin red ni BD.

## Definición de "terminado" (checklist de código)

Una funcionalidad no está terminada hasta que: compila, sin errores de TS ni
ESLint, tipada, con manejo de errores y estados (loading/empty/error/offline),
responsive, dark mode, accesible, sin duplicación ni deuda técnica evidente, y con
la documentación afectada actualizada. Lista completa en
[09 · Roadmap](./09-roadmap-y-sprints.md#definición-de-hecho).
