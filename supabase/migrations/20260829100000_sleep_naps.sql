-- ============================================================================
-- Nexus · Sueño — la siesta también es dormir
-- ============================================================================
-- Sólo cabía un registro por fecha. Quien duerme seis horas de noche y tres por
-- la tarde tenía que elegir cuál apuntar, porque el segundo **pisaba** al
-- primero en vez de sumarse. Nueve horas de sueño se guardaban como tres.
--
-- La restricción no estaba mal pensada: una noche se duerme una vez, y volver a
-- la pantalla debe corregir y no duplicar. Lo que faltaba era distinguir **qué
-- clase de sueño** es cada registro.
--
--   night — el sueño principal. Sigue habiendo uno por fecha, y volver a
--           guardarlo corrige el que había, exactamente como hasta ahora.
--   nap   — una siesta. Puede haber las que sean.
--
-- Esto no es sólo poder apuntar siestas. Cambia dos cuentas:
--
--   · **El total del día suma noche y siestas.** Es lo que compara el objetivo.
--   · **El patrón de horarios mira sólo las noches.** Una siesta a las tres de
--     la tarde no dice nada de a qué hora te acuestas, y metida en esa media la
--     envenenaría.
--
-- La fecha sigue siendo **el día en que se despierta**, que es la convención que
-- ya usaba `sleepInstants`: quien se acuesta el 28 a las 23:00 y despierta el 29
-- a las 07:00 guarda esa noche en el 29. Una siesta empieza y termina el mismo
-- día, así que ahí no hay nada que decidir.
-- ----------------------------------------------------------------------------

create type public.sleep_kind as enum ('night', 'nap');

-- `default 'night'` no es sólo comodidad: todo lo que ya está guardado es una
-- noche, y así las cien noches del histórico quedan bien clasificadas sin tocar
-- una sola fila a mano.
alter table public.sleep_logs
  add column kind public.sleep_kind not null default 'night';

-- El único deja de ser por fecha y pasa a ser por fecha **y noche**. Sin este
-- cambio, la primera siesta chocaría con la noche de ese día.
drop index if exists public.uq_sleep_logs_user_date;

create unique index uq_sleep_logs_night
  on public.sleep_logs (user_id, date)
  where kind = 'night' and deleted_at is null;

-- Las siestas de un día se leen juntas con su noche, y siempre por fecha.
create index idx_sleep_logs_user_date_kind
  on public.sleep_logs (user_id, date, kind)
  where deleted_at is null;
