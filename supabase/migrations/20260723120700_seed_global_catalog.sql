-- ============================================================================
-- Nexus · Migración inicial 8/8 — Semillas del catálogo global
-- ============================================================================
-- Ejercicios y alimentos GLOBALES (user_id = null), visibles para todos los
-- usuarios. Idempotente: `on conflict do nothing` permite re-ejecutar sin duplicar.
-- El coste de los alimentos se deja nulo (depende de la región/usuario); cada
-- persona añade el suyo para la nutrición económica.
-- ----------------------------------------------------------------------------

-- ─── Ejercicios globales ────────────────────────────────────────────────────
insert into public.exercises (id, user_id, name, muscle_group, equipment, instructions)
values
  ('a0000000-0000-4000-8000-000000000001', null, 'Press de banca', 'chest', 'barbell', null),
  ('a0000000-0000-4000-8000-000000000002', null, 'Flexiones', 'chest', 'bodyweight', null),
  ('a0000000-0000-4000-8000-000000000003', null, 'Dominadas', 'back', 'bodyweight', null),
  ('a0000000-0000-4000-8000-000000000004', null, 'Remo con barra', 'back', 'barbell', null),
  ('a0000000-0000-4000-8000-000000000005', null, 'Press militar', 'shoulders', 'barbell', null),
  ('a0000000-0000-4000-8000-000000000006', null, 'Curl de bíceps', 'biceps', 'dumbbell', null),
  ('a0000000-0000-4000-8000-000000000007', null, 'Extensión de tríceps', 'triceps', 'cable', null),
  ('a0000000-0000-4000-8000-000000000008', null, 'Sentadilla', 'legs', 'barbell', null),
  ('a0000000-0000-4000-8000-000000000009', null, 'Peso muerto', 'legs', 'barbell', null),
  ('a0000000-0000-4000-8000-00000000000a', null, 'Zancadas', 'legs', 'dumbbell', null),
  ('a0000000-0000-4000-8000-00000000000b', null, 'Hip thrust', 'glutes', 'barbell', null),
  ('a0000000-0000-4000-8000-00000000000c', null, 'Plancha', 'core', 'bodyweight', null),
  ('a0000000-0000-4000-8000-00000000000d', null, 'Carrera continua', 'cardio', 'none', null)
on conflict (id) do nothing;

-- ─── Alimentos globales (macros por 100 g/ml salvo indicación) ──────────────
insert into public.foods
  (id, user_id, name, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g)
values
  ('b0000000-0000-4000-8000-000000000001', null, 'Arroz blanco cocido', 100, 'g', 130, 2.7, 28, 0.3, 0.4),
  ('b0000000-0000-4000-8000-000000000002', null, 'Pechuga de pollo', 100, 'g', 165, 31, 0, 3.6, 0),
  ('b0000000-0000-4000-8000-000000000003', null, 'Huevo', 50, 'g', 72, 6.3, 0.4, 5, 0),
  ('b0000000-0000-4000-8000-000000000004', null, 'Avena', 100, 'g', 389, 16.9, 66, 6.9, 10.6),
  ('b0000000-0000-4000-8000-000000000005', null, 'Lentejas cocidas', 100, 'g', 116, 9, 20, 0.4, 7.9),
  ('b0000000-0000-4000-8000-000000000006', null, 'Frijoles cocidos', 100, 'g', 127, 8.7, 22.8, 0.5, 6.4),
  ('b0000000-0000-4000-8000-000000000007', null, 'Banano', 100, 'g', 89, 1.1, 23, 0.3, 2.6),
  ('b0000000-0000-4000-8000-000000000008', null, 'Manzana', 100, 'g', 52, 0.3, 14, 0.2, 2.4),
  ('b0000000-0000-4000-8000-000000000009', null, 'Leche entera', 100, 'ml', 61, 3.2, 4.8, 3.3, 0),
  ('b0000000-0000-4000-8000-00000000000a', null, 'Yogur natural', 100, 'g', 59, 10, 3.6, 0.4, 0),
  ('b0000000-0000-4000-8000-00000000000b', null, 'Atún en agua', 100, 'g', 116, 26, 0, 1, 0),
  ('b0000000-0000-4000-8000-00000000000c', null, 'Pan integral', 100, 'g', 247, 13, 41, 3.4, 7),
  ('b0000000-0000-4000-8000-00000000000d', null, 'Papa cocida', 100, 'g', 87, 1.9, 20, 0.1, 1.8),
  ('b0000000-0000-4000-8000-00000000000e', null, 'Aceite de oliva', 100, 'ml', 884, 0, 0, 100, 0),
  ('b0000000-0000-4000-8000-00000000000f', null, 'Atún, arroz y huevo (base)', 100, 'g', 150, 12, 15, 5, 0.5)
on conflict (id) do nothing;
