-- ============================================================================
-- Nexus · Integridad de las series de entrenamiento
-- ============================================================================
-- El formulario ya valida (Zod), pero esa validación protege la experiencia,
-- no los datos: cualquiera puede escribir en la API saltándose la interfaz.
-- Estas restricciones hacen imposible guardar una serie sin sentido
-- (ver docs/12-seguridad.md).

alter table public.workout_sets
  add constraint workout_sets_reps_positive
    check (reps is null or reps > 0),
  add constraint workout_sets_weight_not_negative
    check (weight is null or weight >= 0),
  add constraint workout_sets_set_number_positive
    check (set_number > 0);

-- Una sesión no puede terminar antes de empezar.
alter table public.workout_sessions
  add constraint workout_sessions_ended_after_started
    check (ended_at is null or ended_at >= started_at);
