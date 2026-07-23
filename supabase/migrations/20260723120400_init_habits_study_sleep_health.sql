-- ============================================================================
-- Nexus · Migración inicial 5/8 — Habits, Study, Sleep, Health
-- ============================================================================

-- ─── habits ─────────────────────────────────────────────────────────────────
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  icon text not null default 'circle-check',
  color text not null default '#3b82f6',
  frequency public.habit_frequency not null default 'daily',
  target_count smallint not null default 1 check (target_count > 0),
  target_weekdays smallint[],
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_habits_updated_at
before update on public.habits
for each row execute function public.set_updated_at();

create index idx_habits_user on public.habits (user_id);

alter table public.habits enable row level security;

create policy "habits_own" on public.habits
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── habit_logs ─────────────────────────────────────────────────────────────
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  date date not null default current_date,
  count smallint not null default 1,
  completed boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_habit_logs_updated_at
before update on public.habit_logs
for each row execute function public.set_updated_at();

create index idx_habit_logs_user_date on public.habit_logs (user_id, date);
create unique index uq_habit_logs_habit_date
  on public.habit_logs (habit_id, date)
  where deleted_at is null;

alter table public.habit_logs enable row level security;

create policy "habit_logs_own" on public.habit_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── subjects ───────────────────────────────────────────────────────────────
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#8b5cf6',
  weekly_target_minutes integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_subjects_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

create index idx_subjects_user on public.subjects (user_id);

alter table public.subjects enable row level security;

create policy "subjects_own" on public.subjects
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── study_sessions ─────────────────────────────────────────────────────────
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  focus_rating smallint check (focus_rating between 1 and 5),
  technique text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_study_sessions_updated_at
before update on public.study_sessions
for each row execute function public.set_updated_at();

create index idx_study_sessions_user_started
  on public.study_sessions (user_id, started_at desc);

alter table public.study_sessions enable row level security;

create policy "study_sessions_own" on public.study_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── sleep_logs ─────────────────────────────────────────────────────────────
create table public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  bedtime timestamptz,
  wake_time timestamptz,
  duration_minutes integer not null check (duration_minutes >= 0),
  quality_rating smallint check (quality_rating between 1 and 5),
  interruptions smallint not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_sleep_logs_updated_at
before update on public.sleep_logs
for each row execute function public.set_updated_at();

create index idx_sleep_logs_user_date on public.sleep_logs (user_id, date desc);
create unique index uq_sleep_logs_user_date
  on public.sleep_logs (user_id, date)
  where deleted_at is null;

alter table public.sleep_logs enable row level security;

create policy "sleep_logs_own" on public.sleep_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── sleep_goals ────────────────────────────────────────────────────────────
create table public.sleep_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_minutes integer not null default 480,
  target_bedtime time,
  target_wake_time time,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_sleep_goals_updated_at
before update on public.sleep_goals
for each row execute function public.set_updated_at();

create index idx_sleep_goals_user on public.sleep_goals (user_id);

alter table public.sleep_goals enable row level security;

create policy "sleep_goals_own" on public.sleep_goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── body_metrics ───────────────────────────────────────────────────────────
create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  metric_type public.body_metric_type not null,
  value numeric(6, 2) not null,
  unit text not null,
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_body_metrics_updated_at
before update on public.body_metrics
for each row execute function public.set_updated_at();

create index idx_body_metrics_user_type_measured
  on public.body_metrics (user_id, metric_type, measured_at desc);

alter table public.body_metrics enable row level security;

create policy "body_metrics_own" on public.body_metrics
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── progress_photos (el binario vive en Storage) ──────────────────────────
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  angle text,
  taken_at timestamptz not null default now(),
  weight_kg numeric(5, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_progress_photos_updated_at
before update on public.progress_photos
for each row execute function public.set_updated_at();

create index idx_progress_photos_user_taken on public.progress_photos (user_id, taken_at desc);

alter table public.progress_photos enable row level security;

create policy "progress_photos_own" on public.progress_photos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── health_goals ───────────────────────────────────────────────────────────
create table public.health_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_weight_kg numeric(5, 2),
  target_body_fat_pct numeric(4, 1),
  is_active boolean not null default true,
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_health_goals_updated_at
before update on public.health_goals
for each row execute function public.set_updated_at();

create index idx_health_goals_user on public.health_goals (user_id);

alter table public.health_goals enable row level security;

create policy "health_goals_own" on public.health_goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
