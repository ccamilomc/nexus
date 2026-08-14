-- ============================================================================
-- Nexus · Ampliación del catálogo global de ejercicios
-- ============================================================================
-- El catálogo inicial traía trece ejercicios para diez grupos musculares, y el
-- reparto dejaba huecos que se notan al usarlo:
--
--   · `full_body` no tenía ninguno.
--   · Siete de los doce tipos de equipo estaban vacíos (máquina, polea de
--     kettlebell, banda, suspensión, balón, disco y máquina de cardio), así que
--     la aplicación dejaba filtrar y crear por equipos sin nada detrás.
--   · Seis de trece eran con barra. Quien entrena en un gimnasio comercial vive
--     de máquinas y poleas, que estaban a cero.
--   · Faltaban básicos indiscutibles: elevaciones laterales, jalón al pecho,
--     prensa, fondos. Y ni un solo ejercicio de gemelos.
--
-- Se añaden 47, elegidos por lo que de verdad se hace en un gimnasio y no por
-- llenar una lista: cada grupo queda con alternativas reales de barra,
-- mancuerna, máquina, polea y peso corporal, para que se pueda entrenar igual en
-- un gimnasio bien equipado, en uno básico o en casa.
--
-- Idempotente (`on conflict do nothing`) como la semilla original. Los UUID
-- siguen su serie: la inicial ocupó del 01 al 0d.
-- ----------------------------------------------------------------------------

insert into public.exercises
  (id, user_id, name, muscle_group, secondary_muscles, equipment, instructions)
values
  -- ─── Pecho ────────────────────────────────────────────────────────────────
  ('a0000000-0000-4000-8000-00000000000e', null, 'Press inclinado con barra', 'chest', '{shoulders,triceps}', 'barbell', null),
  ('a0000000-0000-4000-8000-00000000000f', null, 'Press de banca con mancuernas', 'chest', '{shoulders,triceps}', 'dumbbell', null),
  ('a0000000-0000-4000-8000-000000000010', null, 'Press inclinado con mancuernas', 'chest', '{shoulders,triceps}', 'dumbbell', null),
  ('a0000000-0000-4000-8000-000000000011', null, 'Aperturas con mancuernas', 'chest', '{shoulders}', 'dumbbell', null),
  ('a0000000-0000-4000-8000-000000000012', null, 'Cruce de poleas', 'chest', '{shoulders}', 'cable', null),
  ('a0000000-0000-4000-8000-000000000013', null, 'Press de pecho en máquina', 'chest', '{triceps,shoulders}', 'machine', null),
  ('a0000000-0000-4000-8000-000000000014', null, 'Fondos en paralelas', 'chest', '{triceps,shoulders}', 'bodyweight', null),

  -- ─── Espalda ──────────────────────────────────────────────────────────────
  ('a0000000-0000-4000-8000-000000000015', null, 'Jalón al pecho', 'back', '{biceps}', 'cable', null),
  ('a0000000-0000-4000-8000-000000000016', null, 'Remo en polea baja', 'back', '{biceps}', 'cable', null),
  ('a0000000-0000-4000-8000-000000000017', null, 'Remo con mancuerna', 'back', '{biceps}', 'dumbbell', null),
  ('a0000000-0000-4000-8000-000000000018', null, 'Remo en máquina', 'back', '{biceps}', 'machine', null),
  ('a0000000-0000-4000-8000-000000000019', null, 'Pull-over en polea', 'back', '{triceps,core}', 'cable', null),
  ('a0000000-0000-4000-8000-00000000001a', null, 'Encogimientos de hombros', 'back', '{shoulders}', 'dumbbell', null),
  ('a0000000-0000-4000-8000-00000000001b', null, 'Hiperextensiones', 'back', '{glutes,legs}', 'bodyweight', null),

  -- ─── Hombros ──────────────────────────────────────────────────────────────
  ('a0000000-0000-4000-8000-00000000001c', null, 'Elevaciones laterales', 'shoulders', '{}', 'dumbbell', null),
  ('a0000000-0000-4000-8000-00000000001d', null, 'Elevaciones frontales', 'shoulders', '{}', 'dumbbell', null),
  ('a0000000-0000-4000-8000-00000000001e', null, 'Pájaros', 'shoulders', '{back}', 'dumbbell', null),
  ('a0000000-0000-4000-8000-00000000001f', null, 'Face pull', 'shoulders', '{back}', 'cable', null),
  ('a0000000-0000-4000-8000-000000000020', null, 'Press de hombro con mancuernas', 'shoulders', '{triceps}', 'dumbbell', null),
  ('a0000000-0000-4000-8000-000000000021', null, 'Press de hombro en máquina', 'shoulders', '{triceps}', 'machine', null),

  -- ─── Bíceps ───────────────────────────────────────────────────────────────
  ('a0000000-0000-4000-8000-000000000022', null, 'Curl martillo', 'biceps', '{}', 'dumbbell', null),
  ('a0000000-0000-4000-8000-000000000023', null, 'Curl con barra', 'biceps', '{}', 'barbell', null),
  ('a0000000-0000-4000-8000-000000000024', null, 'Curl en polea', 'biceps', '{}', 'cable', null),
  ('a0000000-0000-4000-8000-000000000025', null, 'Curl predicador', 'biceps', '{}', 'machine', null),

  -- ─── Tríceps ──────────────────────────────────────────────────────────────
  ('a0000000-0000-4000-8000-000000000026', null, 'Fondos en banco', 'triceps', '{chest,shoulders}', 'bodyweight', null),
  ('a0000000-0000-4000-8000-000000000027', null, 'Press francés', 'triceps', '{}', 'barbell', null),
  ('a0000000-0000-4000-8000-000000000028', null, 'Extensión sobre la cabeza', 'triceps', '{}', 'dumbbell', null),
  ('a0000000-0000-4000-8000-000000000029', null, 'Patada de tríceps', 'triceps', '{}', 'dumbbell', null),

  -- ─── Piernas ──────────────────────────────────────────────────────────────
  ('a0000000-0000-4000-8000-00000000002a', null, 'Prensa de piernas', 'legs', '{glutes}', 'machine', null),
  ('a0000000-0000-4000-8000-00000000002b', null, 'Extensión de cuádriceps', 'legs', '{}', 'machine', null),
  ('a0000000-0000-4000-8000-00000000002c', null, 'Curl femoral', 'legs', '{}', 'machine', null),
  ('a0000000-0000-4000-8000-00000000002d', null, 'Sentadilla búlgara', 'legs', '{glutes}', 'dumbbell', null),
  ('a0000000-0000-4000-8000-00000000002e', null, 'Sentadilla frontal', 'legs', '{core,glutes}', 'barbell', null),
  ('a0000000-0000-4000-8000-00000000002f', null, 'Peso muerto rumano', 'legs', '{glutes,back}', 'barbell', null),
  ('a0000000-0000-4000-8000-000000000030', null, 'Elevación de gemelos', 'legs', '{}', 'machine', null),
  ('a0000000-0000-4000-8000-000000000031', null, 'Sentadilla goblet', 'legs', '{glutes,core}', 'kettlebell', null),

  -- ─── Glúteos ──────────────────────────────────────────────────────────────
  ('a0000000-0000-4000-8000-000000000032', null, 'Puente de glúteos', 'glutes', '{legs}', 'bodyweight', null),
  ('a0000000-0000-4000-8000-000000000033', null, 'Patada de glúteo en polea', 'glutes', '{legs}', 'cable', null),
  ('a0000000-0000-4000-8000-000000000034', null, 'Abductores en máquina', 'glutes', '{}', 'machine', null),
  ('a0000000-0000-4000-8000-000000000035', null, 'Peso muerto a una pierna', 'glutes', '{legs,back}', 'dumbbell', null),

  -- ─── Core ─────────────────────────────────────────────────────────────────
  ('a0000000-0000-4000-8000-000000000036', null, 'Abdominales', 'core', '{}', 'bodyweight', null),
  ('a0000000-0000-4000-8000-000000000037', null, 'Elevación de piernas colgado', 'core', '{}', 'bodyweight', null),
  ('a0000000-0000-4000-8000-000000000038', null, 'Plancha lateral', 'core', '{}', 'bodyweight', null),
  ('a0000000-0000-4000-8000-000000000039', null, 'Rueda abdominal', 'core', '{shoulders,back}', 'none', null),
  ('a0000000-0000-4000-8000-00000000003a', null, 'Giro ruso', 'core', '{}', 'medicine_ball', null),
  ('a0000000-0000-4000-8000-00000000003b', null, 'Crunch en polea', 'core', '{}', 'cable', null),

  -- ─── Cuerpo completo ──────────────────────────────────────────────────────
  -- El grupo estaba vacío: no había manera de apuntar un ejercicio que no
  -- pertenece a una sola parte del cuerpo.
  ('a0000000-0000-4000-8000-00000000003c', null, 'Burpees', 'full_body', '{legs,chest,core}', 'bodyweight', null),
  ('a0000000-0000-4000-8000-00000000003d', null, 'Swing con kettlebell', 'full_body', '{glutes,back,core}', 'kettlebell', null),
  ('a0000000-0000-4000-8000-00000000003e', null, 'Thruster', 'full_body', '{legs,shoulders}', 'barbell', null),
  ('a0000000-0000-4000-8000-00000000003f', null, 'Remo con banda', 'full_body', '{back,biceps}', 'band', null),

  -- ─── Cardio ───────────────────────────────────────────────────────────────
  ('a0000000-0000-4000-8000-000000000040', null, 'Bicicleta estática', 'cardio', '{legs}', 'cardio_machine', null),
  ('a0000000-0000-4000-8000-000000000041', null, 'Elíptica', 'cardio', '{}', 'cardio_machine', null),
  -- «Remo ergómetro» y no «Remo en máquina»: ese nombre ya es el de espalda, y
  -- dos ejercicios distintos llamados igual se eligen mal en una lista.
  ('a0000000-0000-4000-8000-000000000042', null, 'Remo ergómetro', 'cardio', '{back,legs}', 'cardio_machine', null),
  ('a0000000-0000-4000-8000-000000000043', null, 'Caminadora', 'cardio', '{legs}', 'cardio_machine', null),
  ('a0000000-0000-4000-8000-000000000044', null, 'Saltar la cuerda', 'cardio', '{legs}', 'none', null)
on conflict (id) do nothing;
