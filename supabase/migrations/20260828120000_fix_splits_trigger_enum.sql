-- ============================================================================
-- Nexus · Finanzas — corrige el tipo del enum en el trigger de las partes
-- ============================================================================
-- La migración anterior declaraba `v_kind public.finance_entry_kind`, y ese
-- enum sólo tiene 'income' y 'expense'. La columna `finance_transactions.kind`
-- es de otro tipo —`finance_transaction_kind`, que añadió 'transfer' en
-- 20260807140000— así que leer un movimiento cualquiera reventaba con
-- «invalid input value for enum finance_entry_kind: "transfer"» y **ninguna
-- parte podía guardarse**.
--
-- Dos enums parecidos con nombres parecidos: los repartos por categoría usan
-- `finance_entry_kind` porque una categoría no puede ser un traspaso, y los
-- movimientos usan `finance_transaction_kind` porque sí.
-- ----------------------------------------------------------------------------

create or replace function public.assert_transaction_splits_fit()
returns trigger
language plpgsql
as $$
declare
  v_transaction uuid;
  v_amount numeric(12, 2);
  v_kind public.finance_transaction_kind;
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
