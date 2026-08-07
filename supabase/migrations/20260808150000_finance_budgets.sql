-- ============================================================================
-- Nexus · Finanzas — topes mensuales por categoría
-- ============================================================================
-- Es lo que convierte el registro en decisión: sin un tope, «llevas $380.000 en
-- mercado» es un dato; con él, «llevas el 80 % y vas por la mitad del mes» es
-- un aviso a tiempo.
-- ----------------------------------------------------------------------------

create table public.finance_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- `cascade`: un tope sin su categoría no significa nada. A diferencia de un
  -- movimiento, que sobrevive sin clasificar porque el dinero salió igual.
  category_id uuid not null references public.finance_categories (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_finance_budgets_updated_at
before update on public.finance_budgets
for each row execute function public.set_updated_at();

-- Un tope por categoría. Dos serían dos verdades sobre el mismo límite, y el
-- índice parcial deja que un tope borrado no bloquee volver a ponerlo.
create unique index idx_finance_budgets_unique
  on public.finance_budgets (user_id, category_id)
  where deleted_at is null;

alter table public.finance_budgets enable row level security;

create policy "finance_budgets_own" on public.finance_budgets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
