-- ============================================================================
-- Nexus · Migración inicial 4/8 — Nutrition (económica)
-- ============================================================================

-- ─── foods (catálogo global + personal, con coste) ──────────────────────────
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade, -- null = global
  name text not null,
  brand text,
  serving_size numeric(10, 2) not null default 100,
  serving_unit text not null default 'g',
  calories numeric(10, 2) not null default 0,
  protein_g numeric(10, 2) not null default 0,
  carbs_g numeric(10, 2) not null default 0,
  fat_g numeric(10, 2) not null default 0,
  fiber_g numeric(10, 2),
  cost_per_serving numeric(10, 2), -- clave para la nutrición económica
  currency text,
  is_custom boolean generated always as (user_id is not null) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_foods_updated_at
before update on public.foods
for each row execute function public.set_updated_at();

create index idx_foods_user on public.foods (user_id);

alter table public.foods enable row level security;

create policy "foods_select" on public.foods
  for select to authenticated
  using (user_id is null or (select auth.uid()) = user_id);
create policy "foods_insert_own" on public.foods
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "foods_update_own" on public.foods
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "foods_delete_own" on public.foods
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ─── nutrition_goals ────────────────────────────────────────────────────────
create table public.nutrition_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  calories_target integer not null,
  protein_g_target integer not null,
  carbs_g_target integer not null,
  fat_g_target integer not null,
  water_ml_target integer not null default 2000,
  weekly_food_budget numeric(10, 2), -- presupuesto semanal de comida
  is_active boolean not null default true,
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_nutrition_goals_updated_at
before update on public.nutrition_goals
for each row execute function public.set_updated_at();

create index idx_nutrition_goals_user on public.nutrition_goals (user_id);

alter table public.nutrition_goals enable row level security;

create policy "nutrition_goals_own" on public.nutrition_goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── meal_plans ─────────────────────────────────────────────────────────────
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_meal_plans_updated_at
before update on public.meal_plans
for each row execute function public.set_updated_at();

create index idx_meal_plans_user on public.meal_plans (user_id);

alter table public.meal_plans enable row level security;

create policy "meal_plans_own" on public.meal_plans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── meal_plan_items ────────────────────────────────────────────────────────
create table public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  meal_type public.meal_type not null,
  food_id uuid not null references public.foods (id) on delete restrict,
  servings numeric(6, 2) not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_meal_plan_items_updated_at
before update on public.meal_plan_items
for each row execute function public.set_updated_at();

create index idx_meal_plan_items_plan on public.meal_plan_items (meal_plan_id);

alter table public.meal_plan_items enable row level security;

create policy "meal_plan_items_own" on public.meal_plan_items
  for all to authenticated
  using (
    exists (
      select 1 from public.meal_plans p
      where p.id = meal_plan_items.meal_plan_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.meal_plans p
      where p.id = meal_plan_items.meal_plan_id and p.user_id = (select auth.uid())
    )
  );

-- ─── meal_logs ──────────────────────────────────────────────────────────────
create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_at timestamptz not null default now(),
  meal_type public.meal_type not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_meal_logs_updated_at
before update on public.meal_logs
for each row execute function public.set_updated_at();

create index idx_meal_logs_user_logged on public.meal_logs (user_id, logged_at desc);

alter table public.meal_logs enable row level security;

create policy "meal_logs_own" on public.meal_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── meal_log_items (macros y coste se derivan, no se almacenan) ────────────
create table public.meal_log_items (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references public.meal_logs (id) on delete cascade,
  food_id uuid not null references public.foods (id) on delete restrict,
  servings numeric(6, 2) not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_meal_log_items_updated_at
before update on public.meal_log_items
for each row execute function public.set_updated_at();

create index idx_meal_log_items_log on public.meal_log_items (meal_log_id);

alter table public.meal_log_items enable row level security;

create policy "meal_log_items_own" on public.meal_log_items
  for all to authenticated
  using (
    exists (
      select 1 from public.meal_logs m
      where m.id = meal_log_items.meal_log_id and m.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.meal_logs m
      where m.id = meal_log_items.meal_log_id and m.user_id = (select auth.uid())
    )
  );

-- ─── water_logs ─────────────────────────────────────────────────────────────
create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_at timestamptz not null default now(),
  amount_ml integer not null check (amount_ml > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_water_logs_updated_at
before update on public.water_logs
for each row execute function public.set_updated_at();

create index idx_water_logs_user_logged on public.water_logs (user_id, logged_at desc);

alter table public.water_logs enable row level security;

create policy "water_logs_own" on public.water_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
