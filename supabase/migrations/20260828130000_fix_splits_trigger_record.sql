-- ============================================================================
-- Nexus · Finanzas — el trigger de las partes, vigilando también el total
-- ============================================================================
-- La versión anterior sacaba el id con un `case` de SQL:
--
--     v_transaction := case tg_table_name
--       when 'finance_transaction_splits' then new.transaction_id
--       else new.id
--     end;
--
-- Un `case` es **una sola expresión SQL**, y el motor tiene que poder resolver
-- todas sus ramas para prepararla, ejecute la que ejecute. Sobre
-- `finance_transactions` no existe `new.transaction_id`, así que cambiar el
-- total de un movimiento fallaba con «record "new" has no field
-- transaction_id» — es decir, la mitad de la vigilancia estaba rota, y era la
-- mitad que protege el caso real: corregir un cero de más con partes puestas.
--
-- Con un `if` de plpgsql sólo se evalúa la rama que toca.
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
  if tg_table_name = 'finance_transaction_splits' then
    v_transaction := new.transaction_id;
  else
    v_transaction := new.id;
  end if;

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
