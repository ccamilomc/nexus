-- Cuánto se propuso durar un bloque de estudio.
--
-- El cronómetro ya sobrevivía a recargar la página porque cuenta desde
-- `started_at`, que vive en el servidor. El objetivo tenía que vivir en el mismo
-- sitio por la misma razón: si se quedara en el estado de la pantalla, recargar
-- convertiría un bloque de 25 minutos en uno sin límite, y el usuario no tendría
-- forma de saber que se le perdió.
--
-- `null` significa **sin límite**, que es como funcionaba hasta ahora y sigue
-- siendo una opción legítima: hay ratos de estudio que duran lo que duran.

alter table public.study_sessions
  add column if not exists target_minutes integer;

comment on column public.study_sessions.target_minutes is
  'Duración que el usuario se propuso para el bloque, en minutos. Null = sin límite.';
