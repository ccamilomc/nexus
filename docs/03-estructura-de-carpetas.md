# 03 · Estructura de carpetas

El proyecto usa **arquitectura Feature-Based**: se organiza por **dominio**, nunca
por tipo de archivo. Materializa las capas y reglas de
[02 · Arquitectura](./02-arquitectura.md).

## Árbol completo

```
nexus/
├── docs/                          # Esta documentación (fuente de verdad)
├── public/                        # Estáticos, manifest PWA, iconos
├── supabase/
│   ├── migrations/                # Migraciones SQL versionadas
│   ├── functions/                 # Edge Functions (p. ej. ai-assistant)
│   └── config.toml
├── src/
│   ├── main.tsx                   # Punto de entrada
│   │
│   ├── app/                       # Cascarón de la aplicación (conoce la navegación)
│   │   ├── layout/                # AppShell, Sidebar, BottomNav
│   │   ├── pages/                 # Páginas del cascarón (Más, 404)
│   │   ├── providers/             # QueryClient, Theme, ErrorBoundary, Auth, Router
│   │   └── router/                # Rutas (ROUTES), navegación (NAV_ITEMS) y guards
│   │
│   ├── core/                      # SÓLO infraestructura (sin negocio)
│   │   ├── auth/                  # Sesión, guardas de ruta, contexto de usuario
│   │   ├── config/                # Lectura tipada de env, constantes globales
│   │   ├── supabase/              # Cliente Supabase (única instancia)
│   │   ├── theme/                 # Tema, design tokens, dark mode
│   │   ├── time/                  # Reloj de la app: useToday() y useNow()
│   │   ├── error/                 # ErrorBoundary, normalización de errores
│   │   ├── offline/               # Motor de sincronización y cola offline
│   │   └── logger/                # Punto único de logging
│   │
│   ├── decision-engine/           # Motor de reglas PURO (sin React/Supabase/IA)
│   │   ├── contracts/             # Tipos de entrada (DailyContext) y salida (Recommendation)
│   │   ├── rules/                 # Reglas individuales (una por archivo)
│   │   ├── engine.ts              # Orquestador: aplica reglas → recomendaciones
│   │   └── index.ts               # API pública del motor
│   │
│   ├── features/                  # Un módulo por dominio (autónomo)
│   │   ├── auth/                  # Pantallas de login, registro y recuperación
│   │   ├── dashboard/
│   │   ├── planning/
│   │   ├── workout/
│   │   ├── nutrition/
│   │   ├── habits/
│   │   ├── study/
│   │   ├── sleep/
│   │   ├── health/
│   │   ├── analytics/
│   │   ├── assistant/             # Capa de IA (interpretación/explicación)
│   │   └── settings/
│   │
│   ├── shared/                    # Reutilizable SIN lógica de negocio
│   │   ├── components/
│   │   │   ├── ui/                # Primitivos shadcn/ui (Button, Input, Card…)
│   │   │   ├── layout/            # Primitivos de maquetación (PageHeader…)
│   │   │   ├── form/              # Campos de formulario (FormField)
│   │   │   └── feedback/          # Estados de UI: EmptyState, Skeleton,
│   │   │                          # LoadFailure, FormAlert
│   │   ├── hooks/                 # Hooks genéricos (useElapsedSeconds,
│   │   │                          # useSeriesQuery, useInstallPrompt)
│   │   ├── lib/                   # Utilidades de terceros configuradas (cn, dates)
│   │   ├── utils/                 # Funciones puras genéricas (fechas, series,
│   │   │                          # formatos) con sus tipos al lado
│   │   └── constants/             # Constantes transversales (WIDE_TAP_AREA)
│   │
│   └── styles/                    # CSS global, Tailwind base, tokens
│
├── .env.example                   # Plantilla de variables (sin secretos)
├── eslint.config.js
├── prettier.config.cjs
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Anatomía de una feature

Cada feature contiene **sólo** lo que pertenece a su dominio y respeta las capas.
Ejemplo con `workout`:

```
features/workout/
├── components/          # UI específica del dominio (WorkoutCard, SetRow…)
├── pages/               # Páginas que orquestan componentes (RoutinesPage…)
├── hooks/               # useWorkout, useRoutines, useLogSet…
├── services/            # WorkoutService (reglas de negocio)
├── repositories/        # WorkoutRepository (acceso a Supabase/offline)
├── schemas/             # Esquemas Zod + tipos inferidos
├── types/               # Tipos propios del dominio (no compartidos)
├── constants/           # Constantes del dominio
├── utils/               # Utilidades puras del dominio
└── index.ts             # API PÚBLICA de la feature (barrel)
```

> No todas las features necesitan todas las subcarpetas. Se crean **cuando hacen
> falta** (YAGNI). Una feature de sólo lectura como `analytics` puede no tener
> `repositories` propios y componer datos de otras features vía sus barrels.

## Por qué el shell vive en `app/` y no en `shared/`

`AppShell`, `Sidebar` y `BottomNav` **conocen la navegación** de Nexus (rutas y
módulos). Si vivieran en `shared/`, se crearía una dependencia invertida
(`shared → app`) y `shared/` dejaría de ser genérico y reutilizable. Por eso:

- **`app/layout/`** → shell de la aplicación (sabe de rutas).
- **`shared/components/layout/`** → primitivos de maquetación reutilizables y
  agnósticos (`PageHeader`), sin conocimiento de rutas.

## Rutas y navegación

`app/router/routes.ts` es la **única fuente de verdad** de las rutas;
`app/router/navigation.ts` deriva de ella los elementos de navegación (etiqueta,
icono, si es primario). Las URLs están en español, sin acentos ni `ñ`, para
evitar problemas de codificación.

Las rutas con parámetro (p. ej. el detalle de una rutina,
`/entrenamiento/rutinas/:routineId`) también viven en `routes.ts`: el **patrón**
para el router (`WORKOUT_ROUTINE_DETAIL_PATTERN`) y una **función** que construye
la URL concreta (`workoutRoutinePath(id)`). Así ningún componente arma rutas a
mano. El módulo de entrenamiento se organiza en sub-pestañas
(`Entrenar`, `Rutinas`, `Historial`, `Ejercicios`) bajo `/entrenamiento`.

| Ruta             | Módulo                               | Primario (móvil) |
| ---------------- | ------------------------------------ | ---------------- |
| `/`              | Dashboard                            | ✅               |
| `/plan`          | Planning                             | ✅               |
| `/entrenamiento` | Workout                              | ✅               |
| `/nutricion`     | Nutrition                            | ✅               |
| `/habitos`       | Habits                               | —                |
| `/estudio`       | Study                                | —                |
| `/sueno`         | Sleep                                | —                |
| `/salud`         | Health                               | —                |
| `/analiticas`    | Analytics                            | —                |
| `/asistente`     | Assistant                            | —                |
| `/ajustes`       | Settings                             | —                |
| `/mas`           | Índice de módulos (navegación móvil) | ✅               |
| `*`              | 404                                  | —                |

**Navegación responsive** (mobile-first, ver [11 · UX/UI](./11-ux-ui-y-diseno.md)):
barra inferior en móvil con los destinos primarios + «Más»; barra lateral en
escritorio con todos los módulos. Las páginas de cada módulo se cargan con
**lazy loading** desde el barrel de su feature.

## Reglas de importación

Orden obligatorio de imports (lo aplica ESLint automáticamente):

1. Librerías externas (`react`, `@tanstack/react-query`…).
2. Alias internos (`@/core`, `@/shared`, `@/features/*`, `@/decision-engine`).
3. Componentes/archivos locales (relativos).
4. Estilos.

### Fronteras (se aplican con ESLint `no-restricted-imports`)

| Regla                                                             | Motivo                          |
| ----------------------------------------------------------------- | ------------------------------- |
| Una feature **no** importa archivos internos de otra feature.     | Independencia de dominios.      |
| El acceso entre features es **sólo** vía `features/<x>/index.ts`. | Contrato explícito.             |
| `shared/` **no** importa de `features/`.                          | `shared` es genérico y estable. |
| `core/` **no** contiene lógica de negocio ni importa `features/`. | `core` es infraestructura.      |
| `decision-engine/` **no** importa React, Supabase ni features.    | Motor puro y testeable.         |
| Nadie crea otro cliente Supabase fuera de `core/supabase/`.       | Single Source of Truth.         |

## Alias de rutas

Se configuran en `tsconfig.json` y `vite.config.ts`:

| Alias               | Apunta a              |
| ------------------- | --------------------- |
| `@/app`             | `src/app`             |
| `@/core`            | `src/core`            |
| `@/decision-engine` | `src/decision-engine` |
| `@/features`        | `src/features`        |
| `@/shared`          | `src/shared`          |
| `@/styles`          | `src/styles`          |

## Convención de nombres de archivo

Alineada con [07 · Convenciones de código](./07-convenciones-de-codigo.md):

- Componentes: `PascalCase.tsx` (`WorkoutCard.tsx`).
- Hooks: `useCamelCase.ts` (`useWorkout.ts`).
- Services/Repositories: `kebab-case.ts` con sufijo claro
  (`workout.service.ts`, `workout.repository.ts`).
- Esquemas Zod: `*.schema.ts`. Tipos: `*.types.ts`.
- Cada carpeta relevante expone un `index.ts` de barrel.

## Regla de oro antes de crear un archivo

Preguntarse: **¿ya existe uno que haga esto? ¿puede reutilizarse, extenderse o
componerse?** Sólo crear cuando sea realmente necesario. Orden de preferencia:
**reutilizar → extender → componer → crear**.
