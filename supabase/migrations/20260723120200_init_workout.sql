-- ============================================================================
-- Nexus · Migración inicial 3/8 — Workout
-- ============================================================================

-- ─── exercises (catálogo global + personal) ─────────────────────────────────
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade, -- null = global
  name text not null,
  muscle_group public.muscle_group not null,
  secondary_muscles public.muscle_group[] not null default '{}',
  equipment public.equipment not null default 'none',
  instructions text,
  is_custom boolean generated always as (user_id is not null) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_exercises_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

create index idx_exercises_user on public.exercises (user_id);
create index idx_exercises_muscle_group on public.exercises (muscle_group);

alter table public.exercises enable row level security;

create policy "exercises_select" on public.exercises
  for select to authenticated
  using (user_id is null or (select auth.uid()) = user_id);
create policy "exercises_insert_own" on public.exercises
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "exercises_update_own" on public.exercises
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "exercises_delete_own" on public.exercises
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ─── routines ───────────────────────────────────────────────────────────────
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  goal text,
  days_per_week smallint check (days_per_week between 1 and 7),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_routines_updated_at
before update on public.routines
for each row execute function public.set_updated_at();

create index idx_routines_user on public.routines (user_id);

alter table public.routines enable row level security;

create policy "routines_own" on public.routines
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── routine_days ───────────────────────────────────────────────────────────
create table public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  name text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (routine_id, order_index)
);

create trigger trg_routine_days_updated_at
before update on public.routine_days
for each row execute function public.set_updated_at();

alter table public.routine_days enable row level security;

create policy "routine_days_own" on public.routine_days
  for all to authenticated
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_days.routine_id and r.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_days.routine_id and r.user_id = (select auth.uid())
    )
  );

-- ─── routine_exercises ──────────────────────────────────────────────────────
create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid not null references public.routine_days (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  order_index integer not null default 0,
  target_sets smallint,
  target_reps smallint,
  target_weight numeric(6, 2),
  rest_seconds smallint,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_routine_exercises_updated_at
before update on public.routine_exercises
for each row execute function public.set_updated_at();

create index idx_routine_exercises_day on public.routine_exercises (routine_day_id);

alter table public.routine_exercises enable row level security;

create policy "routine_exercises_own" on public.routine_exercises
  for all to authenticated
  using (
    exists (
      select 1
      from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = routine_exercises.routine_day_id and r.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = routine_exercises.routine_day_id and r.user_id = (select auth.uid())
    )
  );

-- ─── workout_sessions ───────────────────────────────────────────────────────
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_day_id uuid references public.routine_days (id) on delete set null,
  status public.workout_session_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  perceived_effort smallint check (perceived_effort between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_workout_sessions_updated_at
before update on public.workout_sessions
for each row execute function public.set_updated_at();

create index idx_workout_sessions_user_started
  on public.workout_sessions (user_id, started_at desc);

alter table public.workout_sessions enable row level security;

create policy "workout_sessions_own" on public.workout_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── workout_sets ───────────────────────────────────────────────────────────
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  set_number smallint not null,
  reps smallint,
  weight numeric(6, 2),
  rpe numeric(3, 1) check (rpe between 0 and 10),
  is_warmup boolean not null default false,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_workout_sets_updated_at
before update on public.workout_sets
for each row execute function public.set_updated_at();

create index idx_workout_sets_session on public.workout_sets (session_id);

alter table public.workout_sets enable row level security;

create policy "workout_sets_own" on public.workout_sets
  for all to authenticated
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = workout_sets.session_id and s.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = workout_sets.session_id and s.user_id = (select auth.uid())
    )
  );
