-- ============================================================================
-- Nexus · Finanzas — deudas
-- ============================================================================
-- A quién le debes, quién te debe, cuánto, para cuándo y con qué intereses.
-- Ver docs/04-modelo-de-datos.md § Finance.
--
-- **Pagar una deuda es un movimiento de dinero**, no un registro aparte: cada
-- abono es una transacción normal que además apunta a su deuda. Así el saldo
-- pendiente se calcula solo y no hay dos verdades sobre lo mismo.
-- ----------------------------------------------------------------------------

create type public.finance_debt_direction as enum ('i_owe', 'owed_to_me');

-- Cómo corren los intereses. Las dos formas que se usan de verdad en Colombia:
--   · `monthly_on_principal`: un porcentaje fijo del monto original cada mes.
--     Es lo habitual en préstamos informales («el 2 % del millón»).
--   · `monthly_on_balance`: el porcentaje corre sobre lo que queda por pagar,
--     así que baja a medida que se abona. Es como funcionan los bancos y las
--     tarjetas de crédito.
-- `none` para lo que se presta entre familia, que es la mayoría.
create type public.finance_interest_kind as enum (
  'none', 'monthly_on_principal', 'monthly_on_balance'
);

create table public.finance_debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- A quién le debes o quién te debe. Texto libre: puede ser una persona, un
  -- banco o «el almacén de la esquina», y obligar a crear un contacto para
  -- apuntar que le debes mil pesos a tu hermano sería pedir demasiado.
  counterpart text not null,
  direction public.finance_debt_direction not null,
  -- Lo que se debía al empezar, sin intereses. Lo que falta hoy se calcula con
  -- los abonos, igual que el saldo de una cuenta.
  principal numeric(12, 2) not null check (principal > 0),
  interest_kind public.finance_interest_kind not null default 'none',
  -- Porcentaje **mensual**. Nulo cuando no hay intereses.
  interest_rate numeric(6, 3) check (interest_rate is null or interest_rate >= 0),
  started_on date not null,
  -- Para cuándo hay que terminar de pagarla. Opcional: no toda deuda tiene plazo.
  due_on date,
  -- En cuántas cuotas se acordó. Opcional por lo mismo.
  instalments smallint check (instalments is null or instalments > 0),
  note text,
  -- Cuándo se saldó. Se marca a mano: que los abonos cubran el monto no siempre
  -- significa que la otra persona la dé por cerrada.
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- Una tasa sin decir cómo corre no significa nada, y decir cómo corre sin
  -- tasa tampoco.
  constraint finance_debts_interest_shape check (
    (interest_kind = 'none' and interest_rate is null)
    or (interest_kind <> 'none' and interest_rate is not null)
  )
);

create trigger trg_finance_debts_updated_at
before update on public.finance_debts
for each row execute function public.set_updated_at();

create index idx_finance_debts_user on public.finance_debts (user_id);

alter table public.finance_debts enable row level security;

create policy "finance_debts_own" on public.finance_debts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── El abono es un movimiento que apunta a su deuda ────────────────────────
-- `set null`: borrar una deuda no puede borrar el dinero que de verdad salió de
-- la cuenta. El movimiento se queda como el gasto que fue.
alter table public.finance_transactions
  add column debt_id uuid references public.finance_debts (id) on delete set null;

-- Un traspaso mueve dinero entre cuentas propias: no abona ninguna deuda.
alter table public.finance_transactions
  add constraint finance_transactions_debt_shape check (
    kind <> 'transfer' or debt_id is null
  );

create index idx_finance_transactions_debt
  on public.finance_transactions (debt_id)
  where debt_id is not null;
