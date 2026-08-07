-- ============================================================================
-- Nexus · Finanzas — traspasos entre cuentas propias
-- ============================================================================
-- Mover dinero de efectivo a Nequi no es ingreso ni gasto. Registrarlo como
-- ambas cosas inflaba los dos totales del mes y hacía que «cuánto gasté» dejara
-- de ser cierto en cuanto hubiera más de una cuenta.
-- ----------------------------------------------------------------------------

-- Un tipo propio para los movimientos, en vez de añadir 'transfer' al que ya
-- existe: `finance_entry_kind` lo comparten las CATEGORÍAS, y una categoría de
-- traspaso no significa nada. Separarlos evita que el catálogo pueda ensuciarse
-- con un valor que allí no tiene sentido.
create type public.finance_transaction_kind as enum ('income', 'expense', 'transfer');

alter table public.finance_transactions
  alter column kind type public.finance_transaction_kind
  using kind::text::public.finance_transaction_kind;

-- La cuenta a la que va el dinero. `restrict`, igual que el origen: borrar una
-- cuenta no puede dejar un traspaso apuntando al vacío.
alter table public.finance_transactions
  add column counterpart_account_id uuid references public.finance_accounts (id) on delete restrict;

-- La forma de un traspaso la garantiza la base, no el formulario:
--   · tiene cuenta destino, y no es la misma que el origen (mover dinero de una
--     cuenta a sí misma no es nada);
--   · no lleva categoría, porque no se gastó en nada.
-- Y al revés: un gasto o un ingreso nunca llevan cuenta destino.
alter table public.finance_transactions
  add constraint finance_transactions_transfer_shape check (
    (
      kind = 'transfer'
      and counterpart_account_id is not null
      and counterpart_account_id <> account_id
      and category_id is null
    )
    or (kind <> 'transfer' and counterpart_account_id is null)
  );
