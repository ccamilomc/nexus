-- ============================================================================
-- Nexus · Finanzas — presupuesto del mes
-- ============================================================================
-- Los topes por categoría contestan «¿cuánto llevo en mercado?». Falta la
-- pregunta de antes: «¿cuánto puedo gastar este mes en total?». Y la suma de
-- los topes no la contesta, porque la mayor parte del gasto no tiene tope.
--
-- ¿Por qué una tabla y no `finance_budgets` con la categoría en nulo?
--
-- Parece la opción DRY, y sale cara en tres sitios:
--
--   1. En Postgres dos NULL no chocan entre sí, así que el índice único de
--      `(user_id, category_id)` **no impediría dos presupuestos del mes**.
--      Haría falta un índice parcial aparte.
--   2. `.upsert()` de supabase-js recibe columnas, no un predicado de índice,
--      así que guardar el presupuesto ya no sería un upsert.
--   3. Todo lector existente de `finance_budgets` tendría que acordarse de
--      descartar la fila sin categoría, o la pintaría como un tope sin nombre.
--
-- Son dos preguntas distintas: una es «cuánto en esta categoría» y la otra
-- «cuánto en total». Comparten la palabra tope y poco más.
-- ----------------------------------------------------------------------------

create table public.finance_month_budgets (
  id uuid primary key default gen_random_uuid(),
  -- Uno por persona, y de ahí el único: dos presupuestos del mes serían dos
  -- verdades sobre el mismo límite.
  user_id uuid not null unique references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sin `deleted_at` a propósito: quitar el presupuesto es volver a no tener
-- límite, no guardar el rastro de que un día lo hubo. Es el mismo criterio que
-- se aplicó a `finance_budgets` en 20260808160000.

create trigger trg_finance_month_budgets_updated_at
before update on public.finance_month_budgets
for each row execute function public.set_updated_at();

alter table public.finance_month_budgets enable row level security;

create policy "finance_month_budgets_own" on public.finance_month_budgets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
