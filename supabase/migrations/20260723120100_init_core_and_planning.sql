-- ============================================================================
-- Nexus · Migración inicial 2/8 — Núcleo (perfil, preferencias) y Planning
-- ============================================================================

-- ─── profiles ───────────────────────────────────────────────────────────────
-- Extiende auth.users con la misma clave primaria.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  locale text not null default 'es',
  unit_system public.unit_system not null default 'metric',
  sex public.sex not null default 'unspecified',
  birth_date date,
  height_cm numeric(5, 1),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ─── user_preferences ───────────────────────────────────────────────────────
create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  theme public.theme_preference not null default 'system',
  week_starts_on smallint not null default 1 check (week_starts_on between 1 and 7),
  notifications_enabled boolean not null default true,
  reminder_times jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

alter table public.user_preferences enable row level security;

create policy "user_preferences_own" on public.user_preferences
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── Alta automática de perfil + preferencias al registrarse ────────────────
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ─── daily_plans ────────────────────────────────────────────────────────────
create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  status public.plan_status not null default 'draft',
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_daily_plans_updated_at
before update on public.daily_plans
for each row execute function public.set_updated_at();

create index idx_daily_plans_user on public.daily_plans (user_id);
-- Un único plan por usuario y día (ignorando los borrados lógicamente).
create unique index uq_daily_plans_user_date
  on public.daily_plans (user_id, date)
  where deleted_at is null;

alter table public.daily_plans enable row level security;

create policy "daily_plans_own" on public.daily_plans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── plan_items ─────────────────────────────────────────────────────────────
-- Sin user_id propio: la propiedad se hereda de daily_plans.
create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  daily_plan_id uuid not null references public.daily_plans (id) on delete cascade,
  domain public.plan_item_domain not null,
  reference_id uuid,
  title text not null,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  status public.plan_item_status not null default 'pending',
  priority public.priority not null default 'medium',
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_plan_items_updated_at
before update on public.plan_items
for each row execute function public.set_updated_at();

create index idx_plan_items_plan_order on public.plan_items (daily_plan_id, order_index);

alter table public.plan_items enable row level security;

create policy "plan_items_own" on public.plan_items
  for all to authenticated
  using (
    exists (
      select 1 from public.daily_plans p
      where p.id = plan_items.daily_plan_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.daily_plans p
      where p.id = plan_items.daily_plan_id and p.user_id = (select auth.uid())
    )
  );
