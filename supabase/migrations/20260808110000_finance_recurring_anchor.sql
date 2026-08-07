-- ============================================================================
-- Nexus · Finanzas — el día del mes de un pago fijo no se pierde
-- ============================================================================
-- Sin esto, un arriendo que vence el 31 se recortaba al 28 en febrero y se
-- quedaba en el 28 **para siempre**, porque cada mes se avanzaba desde la fecha
-- anterior ya recortada. Guardando el día acordado aparte, febrero lo recorta
-- una vez y marzo vuelve al 31.
--
-- Sólo importa en los días 29, 30 y 31; en el resto no cambia nada.
-- ----------------------------------------------------------------------------

alter table public.finance_recurring
  add column anchor_day smallint check (anchor_day between 1 and 31);

-- Las filas que ya existan toman el día de su próximo vencimiento, que es el
-- que el usuario eligió al crearlas.
update public.finance_recurring
  set anchor_day = extract(day from next_due_on)
  where anchor_day is null;

alter table public.finance_recurring
  alter column anchor_day set not null;

comment on column public.finance_recurring.anchor_day is
  'Día del mes acordado. Se conserva aunque un mes corto lo recorte.';
