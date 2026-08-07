-- ============================================================================
-- Nexus · Finanzas — el tope es un ajuste, no un histórico
-- ============================================================================
-- El tope se creó con `deleted_at` por costumbre, y eso obligaba a un índice
-- único **parcial** (`where deleted_at is null`). Postgres no puede resolver un
-- `ON CONFLICT (user_id, category_id)` contra un índice parcial, así que poner
-- un tope fallaba en cuanto se guardaba.
--
-- El borrado lógico ahí no aportaba nada: un tope es un ajuste del usuario, no
-- el registro de algo que ocurrió. Quitarlo significa «esta categoría no tiene
-- límite», y no hay nada que conservar ni que sincronizar como tombstone —a
-- diferencia de un movimiento, donde el dinero salió de verdad—.
-- ----------------------------------------------------------------------------

-- Los que ya estuvieran borrados se van del todo: eran justo eso, topes
-- quitados.
delete from public.finance_budgets where deleted_at is not null;

drop index if exists public.idx_finance_budgets_unique;

alter table public.finance_budgets drop column deleted_at;

alter table public.finance_budgets
  add constraint finance_budgets_unique_category unique (user_id, category_id);
