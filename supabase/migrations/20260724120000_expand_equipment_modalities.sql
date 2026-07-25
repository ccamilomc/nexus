-- ============================================================================
-- Nexus · Más modalidades de equipo
-- ============================================================================
-- El enum cubría lo más común, pero faltaban formas frecuentes de entrenar.
-- Se añaden como valores nuevos (idempotente); las etiquetas en español viven
-- en el frontend (workout.constants.ts). `ADD VALUE` sólo agrega: no se usan en
-- esta misma transacción, así que es seguro.

alter type public.equipment add value if not exists 'suspension';
alter type public.equipment add value if not exists 'medicine_ball';
alter type public.equipment add value if not exists 'plate';
alter type public.equipment add value if not exists 'cardio_machine';
