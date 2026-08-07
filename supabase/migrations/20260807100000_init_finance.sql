-- ============================================================================
-- Nexus · Finanzas personales — cuentas, categorías y movimientos
-- ============================================================================
-- Registro manual de finanzas: **no se conecta a ningún banco ni mueve dinero**.
-- Se apunta lo que se gasta y el sistema lo ordena, lo suma y lo proyecta.
-- Ver docs/04-modelo-de-datos.md § Finance.
--
-- Esta migración cubre la primera fase: lo mínimo para poder registrar todos los
-- días. Pagos recurrentes, deudas, presupuestos y proyección llegan después, en
-- migraciones propias.
-- ----------------------------------------------------------------------------

-- ─── Tipos enumerados ───────────────────────────────────────────────────────
-- Cajones con nombre, no cuentas conectadas: describen de dónde sale el dinero.
create type public.finance_account_kind as enum (
  'cash', 'bank', 'wallet', 'credit_card', 'savings'
);

-- Sin traspasos todavía: mover dinero entre cuentas propias no es ingreso ni
-- gasto, y meterlo como tal inflaría los totales del mes. Entrará como un valor
-- nuevo con su cuenta destino cuando haga falta de verdad.
create type public.finance_entry_kind as enum ('income', 'expense');

-- ─── finance_accounts ───────────────────────────────────────────────────────
create table public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind public.finance_account_kind not null default 'cash',
  -- Lo que había al empezar a usar Nexus. El saldo de hoy **se calcula** con los
  -- movimientos, igual que las rachas o los macros: almacenarlo obligaría a
  -- mantenerlo a mano en cada alta, baja y corrección.
  initial_balance numeric(12, 2) not null default 0,
  currency text not null default 'COP',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_finance_accounts_updated_at
before update on public.finance_accounts
for each row execute function public.set_updated_at();

create index idx_finance_accounts_user on public.finance_accounts (user_id);

alter table public.finance_accounts enable row level security;

create policy "finance_accounts_own" on public.finance_accounts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── finance_categories (catálogo global + personal) ────────────────────────
-- Mismo patrón que `foods` y `exercises`: `user_id null` es una fila del
-- catálogo que trae el sistema; con `user_id` es una categoría propia.
create table public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade, -- null = global
  name text not null,
  kind public.finance_entry_kind not null default 'expense',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_finance_categories_updated_at
before update on public.finance_categories
for each row execute function public.set_updated_at();

create index idx_finance_categories_user on public.finance_categories (user_id);

alter table public.finance_categories enable row level security;

create policy "finance_categories_select" on public.finance_categories
  for select to authenticated
  using (user_id is null or (select auth.uid()) = user_id);
create policy "finance_categories_insert_own" on public.finance_categories
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "finance_categories_update_own" on public.finance_categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "finance_categories_delete_own" on public.finance_categories
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ─── finance_transactions ───────────────────────────────────────────────────
create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- `restrict`: borrar una cuenta no puede llevarse por delante el historial de
  -- lo que se gastó desde ella. Para dejar de verla está `archived_at`.
  account_id uuid not null references public.finance_accounts (id) on delete restrict,
  -- `set null`: una categoría puede desaparecer sin que el movimiento se pierda;
  -- queda sin clasificar, que es la verdad.
  category_id uuid references public.finance_categories (id) on delete set null,
  kind public.finance_entry_kind not null,
  -- Siempre positivo, y la base lo obliga. Guardar importes con signo invita a
  -- un gasto negativo que suma en vez de restar; la dirección la pone `kind`.
  amount numeric(12, 2) not null check (amount > 0),
  -- Un día, no un instante: un gasto pertenece «al martes», no a las 21:04 UTC.
  occurred_on date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_finance_transactions_updated_at
before update on public.finance_transactions
for each row execute function public.set_updated_at();

-- La consulta de siempre es «los movimientos de este mes, del más reciente al
-- más antiguo». Este índice la cubre entera.
create index idx_finance_transactions_user_date
  on public.finance_transactions (user_id, occurred_on desc);

-- Agrupar el gasto por categoría es la otra pregunta constante.
create index idx_finance_transactions_category
  on public.finance_transactions (user_id, category_id);

alter table public.finance_transactions enable row level security;

create policy "finance_transactions_own" on public.finance_transactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── Catálogo global de categorías ──────────────────────────────────────────
-- Para no empezar con una pantalla vacía. Son las de un presupuesto doméstico
-- colombiano; cada quien puede archivarlas y crear las suyas.
insert into public.finance_categories (user_id, name, kind) values
  (null, 'Mercado', 'expense'),
  (null, 'Restaurantes', 'expense'),
  (null, 'Transporte', 'expense'),
  (null, 'Arriendo', 'expense'),
  (null, 'Servicios', 'expense'),
  (null, 'Gimnasio', 'expense'),
  (null, 'Salud', 'expense'),
  (null, 'Educación', 'expense'),
  (null, 'Suscripciones', 'expense'),
  (null, 'Ocio', 'expense'),
  (null, 'Ropa', 'expense'),
  (null, 'Otros gastos', 'expense'),
  (null, 'Salario', 'income'),
  (null, 'Freelance', 'income'),
  (null, 'Otros ingresos', 'income');
