-- ============================================================================
-- Nexus · Finanzas — pagos fijos
-- ============================================================================
-- El gimnasio, el arriendo, las suscripciones. Son la mayor parte del
-- presupuesto y volver a teclearlos cada mes es la razón principal por la que
-- se abandonan estas aplicaciones.
--
-- **Nexus NO los apunta solo.** Avisa de los que tocan y se confirman de un
-- toque, igual que con los intereses de las deudas: apuntarle al usuario un
-- movimiento que no hizo sería inventarle datos. Un gimnasio se cancela, un
-- cobro falla, un mes se paga distinto.
-- ----------------------------------------------------------------------------

create type public.finance_recurrence as enum ('weekly', 'monthly', 'yearly');

create table public.finance_recurring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  -- Un fijo también puede entrar: el salario es el más fijo de todos.
  kind public.finance_entry_kind not null default 'expense',
  amount numeric(12, 2) not null check (amount > 0),
  -- `restrict` como en los movimientos: borrar la cuenta no puede dejar un fijo
  -- apuntando al vacío.
  account_id uuid not null references public.finance_accounts (id) on delete restrict,
  category_id uuid references public.finance_categories (id) on delete set null,
  frequency public.finance_recurrence not null default 'monthly',
  -- **Cuándo toca el siguiente.** Se guarda la fecha y no el «día 5 de cada
  -- mes»: con un día fijo hay que decidir qué pasa el 31 en febrero, y con una
  -- fecha que avanza al confirmar no existe ese caso.
  next_due_on date not null,
  -- Pausado, no borrado: un gimnasio que se deja tres meses vuelve.
  paused_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_finance_recurring_updated_at
before update on public.finance_recurring
for each row execute function public.set_updated_at();

-- La pregunta de siempre es «¿qué me toca pagar?», ordenado por fecha.
create index idx_finance_recurring_user_due
  on public.finance_recurring (user_id, next_due_on);

alter table public.finance_recurring enable row level security;

create policy "finance_recurring_own" on public.finance_recurring
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── El movimiento confirmado recuerda de qué fijo salió ────────────────────
-- `set null`: borrar el fijo no puede borrar el dinero que de verdad salió.
alter table public.finance_transactions
  add column recurring_id uuid references public.finance_recurring (id) on delete set null;

-- Un traspaso mueve dinero entre cuentas propias: no confirma ningún fijo.
alter table public.finance_transactions
  add constraint finance_transactions_recurring_shape check (
    kind <> 'transfer' or recurring_id is null
  );
