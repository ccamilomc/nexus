# 05 · Base de datos

Esquema físico en **PostgreSQL** (Supabase). Materializa el
[04 · Modelo de datos](./04-modelo-de-datos.md). La seguridad a nivel de fila se
detalla también en [12 · Seguridad](./12-seguridad.md).

> Alcance de este documento: **diseño**. El SQL definitivo vive en
> `supabase/migrations/` y se implementa en el sprint correspondiente
> ([roadmap](./09-roadmap-y-sprints.md)). Aquí se fijan tipos, columnas,
> restricciones, índices y políticas para que la migración sea una transcripción
> fiel, no un rediseño.

## Convenciones físicas

| Aspecto             | Regla                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------- |
| Nombres             | `snake_case`; tablas en **plural** (`workout_sets`).                                  |
| PK                  | `id uuid primary key default gen_random_uuid()`.                                      |
| Tiempos             | `timestamptz`; `created_at default now()`; `updated_at` vía trigger.                  |
| Propiedad           | `user_id uuid not null references auth.users(id) on delete cascade`.                  |
| Borrado lógico      | `deleted_at timestamptz` en tablas sincronizables (offline).                          |
| Enums               | Tipos `enum` de Postgres para conjuntos estables (ver [04](./04-modelo-de-datos.md)). |
| Dinero              | `numeric(10,2)`; nunca `float` para importes.                                         |
| Medidas             | Se almacenan en **métrico** (kg, cm, ml, minutos); la UI convierte.                   |
| Booleanos de estado | Preferir enums de estado a múltiples flags.                                           |
| JSONB               | Sólo para formas variables (`recommendations.data`).                                  |

## Patrones reutilizables (SQL de referencia)

### `updated_at` automático

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''   -- seguridad: evita secuestro de search_path
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Se aplica a cada tabla con updated_at:
create trigger trg_<tabla>_updated_at
before update on public.<tabla>
for each row execute function public.set_updated_at();
```

### Plantilla de RLS por propiedad de usuario

Toda tabla con `user_id` activa RLS. Se usa una única política `for all` acotada a
`authenticated`, y `auth.uid()` se envuelve en un `select` para que Postgres lo
evalúe una sola vez por consulta (recomendación de rendimiento de Supabase):

```sql
alter table public.<tabla> enable row level security;

create policy "<tabla>_own" on public.<tabla>
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

### Catálogos con filas globales + personales

`exercises` y `foods` permiten leer lo global (`user_id is null`, semilla del
sistema) y gestionar lo propio:

```sql
create policy "<catalogo>_select" on public.<catalogo>
  for select to authenticated
  using (user_id is null or (select auth.uid()) = user_id);
-- insert/update/delete: políticas separadas, sólo filas propias
-- (with check / using: (select auth.uid()) = user_id).
```

## Diccionario de datos

Columnas comunes omitidas por brevedad en cada tabla:
`id uuid PK`, `created_at timestamptz`, `updated_at timestamptz`.
`(sync)` = incluye además `deleted_at timestamptz`.

### Núcleo

**profiles** (PK = `auth.users.id`, sin `user_id` propio)

| Columna              | Tipo          | Notas                                   |
| -------------------- | ------------- | --------------------------------------- |
| id                   | uuid          | = `auth.users(id)`, `on delete cascade` |
| display_name         | text          |                                         |
| avatar_url           | text          | null                                    |
| timezone             | text          | p. ej. `America/Bogota`                 |
| locale               | text          | `es` por defecto                        |
| unit_system          | `unit_system` | `metric` por defecto                    |
| sex                  | `sex`         | para cálculos (IMC/energía)             |
| birth_date           | date          | null                                    |
| height_cm            | numeric(5,1)  | para IMC                                |
| onboarding_completed | boolean       | default false                           |

**user_preferences** (`user_id` único)

| Columna               | Tipo               | Notas                |
| --------------------- | ------------------ | -------------------- |
| user_id               | uuid               | único, FK            |
| theme                 | `theme_preference` | default `system`     |
| week_starts_on        | int                | 1=lunes              |
| notifications_enabled | boolean            | default true         |
| reminder_times        | jsonb              | horarios por dominio |

### Planning

**daily_plans** (sync) · único `(user_id, date)`

| Columna      | Tipo          |
| ------------ | ------------- |
| user_id      | uuid FK       |
| date         | date          |
| status       | `plan_status` |
| generated_at | timestamptz   |

**plan_items** (sync)

| Columna         | Tipo                           | Notas                                     |
| --------------- | ------------------------------ | ----------------------------------------- |
| daily_plan_id   | uuid FK → daily_plans, cascade |
| domain          | `plan_item_domain`             |                                           |
| reference_id    | uuid                           | id de la entidad de dominio (polimórfico) |
| title           | text                           | denormalizado para pintar rápido          |
| scheduled_start | timestamptz                    | null                                      |
| scheduled_end   | timestamptz                    | null                                      |
| status          | `plan_item_status`             | default `pending`                         |
| priority        | `priority`                     | default `medium`                          |
| order_index     | int                            | orden dentro del día                      |

### Workout

**exercises** (catálogo; `user_id` nullable)

| Columna           | Tipo                                      |
| ----------------- | ----------------------------------------- |
| user_id           | uuid null (null = global)                 |
| name              | text                                      |
| muscle_group      | `muscle_group`                            |
| secondary_muscles | `muscle_group[]`                          |
| equipment         | `equipment`                               |
| instructions      | text null                                 |
| is_custom         | boolean (generado: `user_id is not null`) |

**routines** (sync): `user_id`, `name`, `goal text`, `days_per_week int`, `is_active boolean`.
**routine_days**: `routine_id FK cascade`, `name`, `order_index int`. UNIQUE `(routine_id, order_index)`.
**routine_exercises**: `routine_day_id FK cascade`, `exercise_id FK restrict`, `order_index`, `target_sets int`, `target_reps int`, `target_weight numeric(6,2) null`, `rest_seconds int`, `notes text null`.
**workout_sessions** (sync): `user_id`, `routine_day_id FK set null`, `status workout_session_status`, `started_at`, `ended_at null`, `perceived_effort int null`, `notes null`.
**workout_sets** (sync): `session_id FK cascade`, `exercise_id FK restrict`, `set_number int`, `reps int`, `weight numeric(6,2) null`, `rpe numeric(3,1) null`, `is_warmup boolean`, `completed boolean`.

### Nutrition

**foods** (catálogo; `user_id` nullable): `name`, `brand null`, `serving_size numeric`, `serving_unit text`, `calories numeric`, `protein_g numeric`, `carbs_g numeric`, `fat_g numeric`, `fiber_g numeric null`, **`cost_per_serving numeric(10,2) null`**, `currency text null`.
**nutrition_goals** (sync): `user_id`, `calories_target int`, `protein_g_target int`, `carbs_g_target int`, `fat_g_target int`, `water_ml_target int`, **`weekly_food_budget numeric(10,2) null`**, `is_active boolean`, `effective_from date`.
**meal_plans** (sync): `user_id`, `name`, `is_active boolean`.
**meal_plan_items**: `meal_plan_id FK cascade`, `meal_type meal_type`, `food_id FK restrict`, `servings numeric(6,2)`.
**meal_logs** (sync): `user_id`, `logged_at timestamptz`, `meal_type meal_type`, `name text null`.
**meal_log_items**: `meal_log_id FK cascade`, `food_id FK restrict`, `servings numeric(6,2)`. Macros y coste se **derivan** (no se almacenan).
**water_logs** (sync): `user_id`, `logged_at timestamptz`, `amount_ml int`.

### Habits

**habits** (sync): `user_id`, `name`, `description null`, `icon text`, `color text`, `frequency habit_frequency`, `target_count int default 1`, `target_weekdays int[] null`, `is_active boolean`, `archived_at null`.
**habit_logs** (sync): `user_id`, `habit_id FK cascade`, `date date`, `count int default 1`, `completed boolean`, `notes null`. UNIQUE `(habit_id, date)`.

### Study

**subjects** (sync): `user_id`, `name`, `color text`, `weekly_target_minutes int null`, `is_active boolean`.
**study_sessions** (sync): `user_id`, `subject_id FK set null`, `started_at`, `ended_at null`, `duration_minutes int`, `focus_rating int null`, `technique text null`, `notes null`.

### Sleep

**sleep_logs** (sync): `user_id`, `date date`, `bedtime timestamptz`, `wake_time timestamptz`, `duration_minutes int`, `quality_rating int null`, `interruptions int default 0`, `notes null`. UNIQUE `(user_id, date)`.
**sleep_goals** (sync): `user_id`, `target_minutes int`, `target_bedtime time null`, `target_wake_time time null`, `is_active boolean`.

### Health

**body_metrics** (sync): `user_id`, `metric_type body_metric_type`, `value numeric(6,2)`, `unit text`, `measured_at timestamptz`.
**progress_photos** (sync): `user_id`, `storage_path text`, `angle text`, `taken_at timestamptz`, `weight_kg numeric(5,2) null`, `notes null`.
**health_goals** (sync): `user_id`, `target_weight_kg numeric(5,2) null`, `target_body_fat_pct numeric(4,1) null`, `is_active boolean`, `effective_from date`.

### Finance

**finance_accounts** (sync): `user_id`, `name text`, `kind finance_account_kind`, `initial_balance numeric(12,2)`, `currency text default 'COP'`, `archived_at timestamptz null`.
**finance_categories** (catálogo global + personal): `user_id null = global`, `name text`, `kind finance_entry_kind`, `archived_at null`.
**finance_transactions** (sync): `user_id`, `account_id FK restrict`, `category_id FK set null`, `kind finance_entry_kind`, `amount numeric(12,2) check (> 0)`, `occurred_on date`, `note null`.

Tres decisiones que la forma no explica sola:

- **`amount` siempre positivo, forzado por la base.** La dirección la pone
  `kind`. Con importes con signo cabe un gasto negativo que suma en vez de
  restar, y cada consulta tendría que acordarse del criterio.
- **`account_id` es `on delete restrict`.** Borrar una cuenta no puede llevarse
  por delante el historial de lo que se gastó desde ella; para dejar de verla
  está `archived_at`. La categoría sí es `set null`: el movimiento sobrevive sin
  clasificar, que es la verdad.
- **`numeric(12,2)` y no `(10,2)`** como el resto del dinero del proyecto: los
  precios por porción son pequeños, pero un arriendo o un salario en pesos
  colombianos no caben en ocho dígitos enteros.

### Inteligencia y comunicación

**recommendations** (sync): `user_id`, `type recommendation_type`, `domain plan_item_domain null`, `title text`, `message text`, `reason text`, `data jsonb`, `priority priority`, `status recommendation_status default 'pending'`, `valid_until timestamptz null`.
**assistant_conversations**: `user_id`, `title text null`.
**assistant_messages**: `conversation_id FK cascade`, `role text` (`user`/`assistant`), `content text`, `token_count int null`.
**notifications** (sync): `user_id`, `type text`, `title text`, `body text`, `channel notification_channel`, `scheduled_for timestamptz null`, `sent_at null`, `read_at null`.

## Índices

Además del índice implícito de cada PK y de cada UNIQUE:

| Tabla               | Índice                                     | Motivo                          |
| ------------------- | ------------------------------------------ | ------------------------------- |
| Todas con `user_id` | `(user_id)`                                | Filtro base de RLS y consultas. |
| plan_items          | `(daily_plan_id, order_index)`             | Render ordenado del día.        |
| workout_sessions    | `(user_id, started_at desc)`               | Historial reciente.             |
| workout_sets        | `(session_id)`                             | Series de una sesión.           |
| meal_logs           | `(user_id, logged_at desc)`                | Diario de comidas.              |
| water_logs          | `(user_id, logged_at desc)`                | Hidratación del día.            |
| habit_logs          | `(user_id, date)`                          | Cálculo de rachas.              |
| study_sessions      | `(user_id, started_at desc)`               | Historial y agregados.          |
| sleep_logs          | `(user_id, date desc)`                     | Tendencia de sueño.             |
| body_metrics        | `(user_id, metric_type, measured_at desc)` | Series por métrica.             |
| recommendations     | `(user_id, status, priority)`              | Bandeja de recomendaciones.     |

> Se crean **sólo** índices con beneficio medible (evitar optimización
> prematura). Se añaden más si el análisis de consultas lo justifica.

## Row Level Security

- **RLS activado en todas las tablas** desde la primera migración.
- Tablas con `user_id`: las cuatro políticas del dueño (plantilla arriba).
- Tablas hijas sin `user_id` propio (`routine_days`, `workout_sets`,
  `meal_log_items`, `assistant_messages`…): la política comprueba la propiedad a
  través del agregado raíz mediante `exists (...)`. Ejemplo:

```sql
create policy "workout_sets_own" on public.workout_sets
  for all to authenticated
  using (exists (
    select 1 from public.workout_sessions s
    where s.id = workout_sets.session_id and s.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.workout_sessions s
    where s.id = workout_sets.session_id and s.user_id = (select auth.uid())
  ));
```

- Catálogos (`exercises`, `foods`): lectura de globales + propios; escritura sólo
  de propios.
- **Nunca** se confía sólo en el frontend: la seguridad vive en la BD
  ([12 · Seguridad](./12-seguridad.md)).

## Storage

- Bucket **privado** `progress-photos`. Ruta: `{user_id}/{photo_id}.{ext}`.
- Políticas de Storage que restringen a `auth.uid() = (storage.foldername(name))[1]`.
- El acceso a las imágenes se hace con **URLs firmadas** de vida corta.

## Analytics: vistas y rollups

Analytics **no** define tablas de datos primarios (ver
[04](./04-modelo-de-datos.md#analytics)):

- **No usa vistas.** Se evaluaron en el Sprint 12 y se descartaron: obligarían a
  reimplementar en SQL reglas que ya están probadas en TypeScript. La agregación
  se hace en el cliente sobre consultas por rango con `select()` acotado, y cada
  dominio expone la suya (`useXSeries`). Ver
  [ADR-0006](./adr/0006-analytics-agrega-en-el-cliente.md).
- **`daily_summaries`** (tabla de _rollup_ por día y dominio) sigue **abierta** y
  se definiría **sólo si** el rendimiento lo exige (evidencia primero, evitar
  optimización prematura). Si se crea, se recalcula de forma **idempotente** y
  lleva `user_id` + RLS como cualquier otra tabla de usuario. Entraría por detrás
  de `useXSeries`, sin que Analytics se entere.

### Coste medido de Analytics

Medido en el navegador sobre la cuenta de desarrollo con ~10 semanas de historia
(`scripts/seed-dev-data.mjs`), en el **peor caso: periodo de 90 días y caché
fría**. Es la referencia con la que comparar antes de plantear vistas o rollups:

| Periodo | Peticiones | Transferido | Consulta más lenta |
| ------- | ---------- | ----------- | ------------------ |
| 7 días  | 10         | 109 KB      | ~650 ms            |
| 90 días | 10         | **316 KB**  | ~710 ms            |

Las diez consultas salen en paralelo y TanStack Query las cachea 60 s, así que
el coste se paga una vez por periodo. La primera medición dio **654 KB**: la
mitad se iba en `meal_log_items`, que reutilizaba la consulta de la pantalla del
día y bajaba el alimento entero por join. Acotar el `select` a las columnas que
se agregan (`listItemsForSeries`, `listMealLogsForSeries`, `listWaterForSeries`)
lo dejó en 316 KB **sin cambiar ninguna cifra en pantalla**.

Es la lección que conviene recordar antes de sospechar de la arquitectura: el
problema no era agregar en el cliente, era traer columnas que nadie suma.

## Migraciones

- Toda modificación de esquema es una **migración** en `supabase/migrations/`.
  Nunca se toca la BD a mano.
- Nombre: `<timestamp>_descripcion.sql` (formato de la CLI de Supabase). El
  esquema inicial se divide en 8 migraciones por dominio para facilitar su
  revisión.
- Orden inicial: enums + funciones → núcleo y planning → workout → nutrition →
  habits/study/sleep/health → inteligencia y notificaciones → storage → seeds.
- Los **seeds** de catálogos globales (`user_id null`) son una migración
  idempotente (`on conflict do nothing`), para que se desplieguen con el resto.

### Despliegue del esquema (flujo con la CLI de Supabase)

El SQL vive en el repositorio; se aplica al proyecto remoto con la CLI (no se
edita la BD a mano). Scripts disponibles en `package.json`:

| Paso | Comando              | Qué hace                                                              |
| ---- | -------------------- | --------------------------------------------------------------------- |
| 1    | `npx supabase login` | Autentica la CLI (abre el navegador).                                 |
| 2    | `npm run db:link`    | Enlaza el repo con el proyecto remoto (pide su _ref_).                |
| 3    | `npm run db:push`    | Aplica todas las migraciones pendientes al remoto.                    |
| 4    | `npm run db:types`   | Regenera `src/core/supabase/database.types.ts` desde el esquema real. |

Los tipos TypeScript se **generan** desde la BD; nunca se escriben a mano (evita
divergencias). El archivo versionado es un punto de partida hasta el primer
`db:types`.
