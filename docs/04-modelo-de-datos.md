# 04 · Modelo de datos

Este documento describe las **entidades y sus relaciones** a nivel conceptual. El
esquema físico (columnas, tipos, índices, RLS, migraciones) está en
[05 · Base de datos](./05-base-de-datos.md). Ambos deben mantenerse coherentes.

## Convenciones del modelo

- Toda entidad tiene: `id` (UUID), `created_at`, `updated_at`.
- Toda entidad que pertenece a una persona tiene `user_id` → `auth.users(id)`.
- Las entidades que se registran offline llevan `deleted_at` (borrado lógico) para
  soportar _tombstones_ de sincronización (ver [13 · Offline y PWA](./13-offline-y-pwa.md)).
- Los **catálogos** (`exercises`, `foods`) admiten filas **globales**
  (`user_id NULL`, semilla del sistema) y filas **personalizadas** del usuario.
- Base **completamente normalizada**; se usa JSONB sólo donde la forma es
  intrínsecamente variable (p. ej. `data` de una recomendación).

## Tipos enumerados

| Enum                     | Valores                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `unit_system`            | `metric`, `imperial`                                                                               |
| `theme_preference`       | `system`, `light`, `dark`                                                                          |
| `sex`                    | `male`, `female`, `other`, `unspecified`                                                           |
| `plan_status`            | `draft`, `active`, `completed`                                                                     |
| `plan_item_domain`       | `workout`, `nutrition`, `study`, `habit`, `sleep`, `health`                                        |
| `plan_item_status`       | `pending`, `in_progress`, `done`, `skipped`, `rescheduled`                                         |
| `priority`               | `low`, `medium`, `high`, `critical`                                                                |
| `workout_session_status` | `planned`, `in_progress`, `completed`, `skipped`                                                   |
| `muscle_group`           | `chest`, `back`, `shoulders`, `biceps`, `triceps`, `legs`, `glutes`, `core`, `full_body`, `cardio` |
| `equipment`              | `none`, `barbell`, `dumbbell`, `machine`, `cable`, `kettlebell`, `band`, `bodyweight`              |
| `meal_type`              | `breakfast`, `lunch`, `dinner`, `snack`                                                            |
| `habit_frequency`        | `daily`, `weekly`, `custom`                                                                        |
| `body_metric_type`       | `weight`, `body_fat`, `waist`, `hip`, `chest`, `arm`, `thigh`, `neck`                              |
| `recommendation_type`    | `day_recalculation`, `meal_swap`, `alternative_routine`, `alert`, `insight`                        |
| `recommendation_status`  | `pending`, `accepted`, `dismissed`, `expired`                                                      |
| `notification_channel`   | `in_app`, `push`                                                                                   |

## Mapa de dominios

```mermaid
flowchart TB
    U["auth.users"] --> P["profiles"]
    P --> PREF["user_preferences"]
    P --> PLAN["planning"]
    P --> WK["workout"]
    P --> NU["nutrition"]
    P --> HA["habits"]
    P --> ST["study"]
    P --> SL["sleep"]
    P --> HE["health"]
    WK & NU & HA & ST & SL & HE --> REC["recommendations"]
    REC --> AS["assistant (IA)"]
    WK & NU & HA & ST & SL & HE --> AN["analytics (vistas)"]
```

## Núcleo (identidad y preferencias)

- **profiles**: extiende `auth.users` (misma `id`). Datos de perfil: nombre,
  avatar, zona horaria, `locale`, `unit_system`, `sex`, fecha de nacimiento,
  `height_cm`, estado de onboarding.
- **user_preferences**: ajustes de la app (tema, inicio de semana, horarios de
  recordatorio, activación de notificaciones). **Sólo preferencias de UX**, no
  objetivos de dominio.

## Planning (núcleo adaptativo)

Es el "pegamento" que hace de Nexus un sistema, no una suma de apps.

- **daily_plans**: el plan de un día (`date`, `status`, `generated_at`).
- **plan_items**: cada elemento del plan; referencia **polimórfica** a una entidad
  de dominio vía (`domain`, `reference_id`), con `scheduled_start/end`, `status`,
  `priority`, `order`. El [Decision Engine](./06-decision-engine-e-ia.md) crea,
  reprograma y re-prioriza estos ítems al recalcular el día.

```mermaid
erDiagram
    profiles ||--o{ daily_plans : tiene
    daily_plans ||--o{ plan_items : contiene
    profiles {
        uuid id PK
    }
    daily_plans {
        uuid id PK
        uuid user_id FK
        date date
        plan_status status
    }
    plan_items {
        uuid id PK
        uuid daily_plan_id FK
        plan_item_domain domain
        uuid reference_id
        plan_item_status status
        priority priority
        int order_index
    }
```

## Workout

- **exercises**: catálogo (global o personal) con `muscle_group`, `equipment`,
  instrucciones. Base para calcular **rutinas alternativas** (mismo grupo, otro
  equipo).
- **routines**: plantilla de rutina (`name`, `goal`, `days_per_week`, `is_active`).
- **routine_days**: día lógico dentro de una rutina (p. ej. "Push").
- **routine_exercises**: ejercicio prescrito en un `routine_day` (series, reps,
  peso objetivo, descanso, orden).
- **workout_sessions**: entrenamiento realizado (`status`, inicio/fin, esfuerzo).
- **workout_sets**: serie realizada dentro de una sesión (reps, peso, RPE, warmup).

```mermaid
erDiagram
    profiles ||--o{ routines : crea
    routines ||--o{ routine_days : compone
    routine_days ||--o{ routine_exercises : prescribe
    exercises ||--o{ routine_exercises : referencia
    profiles ||--o{ workout_sessions : realiza
    routine_days ||--o{ workout_sessions : basada_en
    workout_sessions ||--o{ workout_sets : registra
    exercises ||--o{ workout_sets : de
```

## Nutrition (económica)

- **foods**: catálogo (global o personal) con macros por porción **y
  `cost_per_serving`** (clave para la nutrición económica).
- **nutrition_goals**: objetivos activos del usuario (calorías, proteína, carbos,
  grasa, `water_ml_target` y **`weekly_food_budget`**). Historial vía
  `is_active` + `effective_from`.
- **meal_plans / meal_plan_items**: plan de comidas planificado.
- **meal_logs / meal_log_items**: comidas realmente registradas; los macros y el
  coste se derivan de los items (cantidad × alimento).
- **water_logs**: registros de hidratación (`amount_ml`, `logged_at`).

```mermaid
erDiagram
    profiles ||--o{ nutrition_goals : define
    profiles ||--o{ meal_logs : registra
    meal_logs ||--o{ meal_log_items : contiene
    foods ||--o{ meal_log_items : referencia
    profiles ||--o{ meal_plans : planifica
    meal_plans ||--o{ meal_plan_items : contiene
    foods ||--o{ meal_plan_items : referencia
    profiles ||--o{ water_logs : registra
```

## Habits

- **habits**: definición del hábito (`name`, `frequency`, `target_count`,
  `target_weekdays`, color, icono, `is_active`, `archived_at`).
- **habit_logs**: cumplimiento por fecha (`date`, `count`, `completed`). Las
  **rachas** se calculan en el motor/servicio a partir de estos registros (no se
  almacenan de forma duplicada).

```mermaid
erDiagram
    profiles ||--o{ habits : define
    habits ||--o{ habit_logs : registra
```

## Study

- **subjects**: materia (`name`, color, `weekly_target_minutes`).
- **study_sessions**: sesión de estudio (`subject_id`, inicio/fin,
  `duration_minutes`, `focus_rating`, técnica). Soporta las **horas variables**:
  el motor compara horas reales vs objetivo semanal y ajusta el plan.

```mermaid
erDiagram
    profiles ||--o{ subjects : crea
    subjects ||--o{ study_sessions : agrupa
    profiles ||--o{ study_sessions : realiza
```

## Sleep

- **sleep_logs**: registro por noche (`date`, `bedtime`, `wake_time`,
  `duration_minutes`, `quality_rating`, interrupciones).
- **sleep_goals**: objetivo de sueño (`target_minutes`, `target_bedtime`,
  `target_wake_time`).

## Health

- **body_metrics**: medición corporal normalizada
  (`metric_type`, `value`, `unit`, `measured_at`). El **IMC** se calcula (peso +
  `height_cm` del perfil), no se almacena.
- **progress_photos**: foto de progreso (`storage_path`, `angle`, `taken_at`,
  `weight_kg` snapshot). El binario va a Storage, no a la BD.
- **health_goals**: objetivos (`target_weight_kg`, `target_body_fat_pct`…).

```mermaid
erDiagram
    profiles ||--o{ body_metrics : registra
    profiles ||--o{ progress_photos : sube
    profiles ||--o{ health_goals : define
```

## Inteligencia y comunicación

- **recommendations**: salida del Decision Engine (`type`, `domain`, `title`,
  `message`, `reason`, `data` JSONB, `priority`, `status`, `valid_until`). El
  usuario las acepta o descarta.
- **assistant_conversations / assistant_messages**: historial de la capa de IA
  (chat). La IA lee recomendaciones y datos; nunca ejecuta lógica crítica.
- **notifications**: notificaciones (`type`, `title`, `body`, `scheduled_for`,
  `sent_at`, `read_at`, `channel`).

## Analytics

Analytics **no** introduce tablas nuevas de datos primarios: se implementa con
**vistas** y, cuando el rendimiento lo exija, una tabla de _rollup_
**daily_summaries** (agregados por día y dominio) que se recalcula de forma
idempotente. Se decide en su sprint con evidencia (evitar optimización prematura).

## Integridad y borrado

- **FK con `on delete cascade`** desde los hijos hacia su agregado raíz
  (p. ej. `workout_sets` → `workout_sessions`).
- **Borrado de usuario**: `on delete cascade` desde `auth.users` para cumplir
  privacidad (derecho al olvido).
- **Catálogos globales** referenciados por logs usan `on delete restrict` (no se
  borra un alimento global si hay registros que lo usan); los personalizados, la
  estrategia se documenta en [05](./05-base-de-datos.md).
