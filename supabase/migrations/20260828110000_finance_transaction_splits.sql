-- ============================================================================
-- Nexus · Finanzas — repartir un movimiento entre varias categorías
-- ============================================================================
-- Una compra en el supermercado no es sólo mercado: hay jabón, hay pilas, hay
-- una olla. Hasta ahora había que elegir una categoría —y mentir— o partir el
-- pago en dos movimientos que nunca existieron, con lo que el extracto del
-- banco deja de cuadrar con lo apuntado.
--
-- **Las partes se recortan del total; no lo sustituyen.**
--
-- El movimiento sigue teniendo un único `amount`, que es lo que salió de la
-- cuenta, y su `category_id` se queda con **lo que no se repartió**. Guardar
-- todas las partes por separado y esperar que sumen el total significaría que
-- un fallo al escribirlas puede dejar el saldo mal. Así no: el saldo sale de
-- una sola cifra y las partes sólo redistribuyen. Lo peor que puede pasar es
-- que un reparto se vea raro, nunca que el dinero no cuadre.
--
-- Es el mismo criterio de siempre en este proyecto: lo derivado se calcula, no
-- se guarda (ver los intereses de una deuda o el saldo de una cuenta).
-- ----------------------------------------------------------------------------

create table public.finance_transaction_splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  transaction_id uuid not null
    references public.finance_transactions (id) on delete cascade,
  -- `set null` igual que en el movimiento: si la categoría se borra, ese dinero
  -- siguió saliendo; lo que se pierde es saber en qué. Las partes sin categoría
  -- se juntan solas al leerlas, bajo «Sin categoría».
  category_id uuid references public.finance_categories (id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dos partes de la misma categoría en un mismo movimiento serían dos filas
-- diciendo lo mismo. Los nulos no chocan entre sí, y está bien: si dos
-- categorías se borran, sus partes se juntan al leerlas.
create unique index idx_finance_transaction_splits_unique
  on public.finance_transaction_splits (transaction_id, category_id);

-- Se lee siempre por movimiento, al traer el mes entero.
create index idx_finance_transaction_splits_transaction
  on public.finance_transaction_splits (transaction_id);

create trigger trg_finance_transaction_splits_updated_at
before update on public.finance_transaction_splits
for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Que las partes quepan en el total, comprobado por la base
-- ----------------------------------------------------------------------------
-- No basta con validarlo en el formulario, y no es un caso rebuscado: repartes
-- 164.800 en mercado y 40.000 en hogar, y después corriges el total a 30.000
-- porque te habías equivocado de cero. Sin esta comprobación, mercado se
-- quedaría en -10.000.
--
-- Por eso vigila las dos tablas: cambiar una parte y cambiar el total rompen la
-- misma cuenta desde lados distintos.

create or replace function public.assert_transaction_splits_fit()
returns trigger
language plpgsql
as $$
declare
  v_transaction uuid;
  v_amount numeric(12, 2);
  v_kind public.finance_entry_kind;
  v_parts numeric(12, 2);
begin
  v_transaction := case tg_table_name
    when 'finance_transaction_splits' then new.transaction_id
    else new.id
  end;

  select amount, kind into v_amount, v_kind
  from public.finance_transactions
  where id = v_transaction;

  select coalesce(sum(amount), 0) into v_parts
  from public.finance_transaction_splits
  where transaction_id = v_transaction;

  -- Un traspaso no se gasta en nada: cambia de cajón. Repartirlo entre
  -- categorías sería inventarse un gasto que no existió.
  if v_parts > 0 and v_kind = 'transfer' then
    raise exception 'splits_on_transfer';
  end if;

  if v_parts > v_amount then
    raise exception 'splits_exceed_total';
  end if;

  return null;
end;
$$;

create trigger trg_finance_transaction_splits_fit
after insert or update on public.finance_transaction_splits
for each row execute function public.assert_transaction_splits_fit();

create trigger trg_finance_transactions_splits_fit
after update of amount, kind on public.finance_transactions
for each row execute function public.assert_transaction_splits_fit();

alter table public.finance_transaction_splits enable row level security;

create policy "finance_transaction_splits_own" on public.finance_transaction_splits
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
