-- ============================================================================
-- Nexus · Los dos equipos que seguían sin ningún ejercicio
-- ============================================================================
-- Al comprobar la ampliación anterior quedaban dos tipos de equipo a cero:
-- `plate` (disco) y `suspension` (TRX). La aplicación deja crear y filtrar por
-- ellos, así que sin nada detrás son dos opciones que no llevan a ninguna parte.
--
-- Va aparte y no dentro de la migración anterior porque aquélla ya estaba
-- aplicada: editarla habría dejado el archivo y la base contando cosas
-- distintas, y una migración aplicada no se toca.
-- ----------------------------------------------------------------------------

insert into public.exercises
  (id, user_id, name, muscle_group, secondary_muscles, equipment, instructions)
values
  ('a0000000-0000-4000-8000-000000000045', null, 'Elevación frontal con disco', 'shoulders', '{core}', 'plate', null),
  ('a0000000-0000-4000-8000-000000000046', null, 'Remo en TRX', 'back', '{biceps,core}', 'suspension', null)
on conflict (id) do nothing;
