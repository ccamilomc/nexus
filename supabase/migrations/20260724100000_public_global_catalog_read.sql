-- ============================================================================
-- Nexus · Permitir lectura del catálogo GLOBAL sin sesión
-- ============================================================================
-- Los ejercicios y alimentos globales (user_id null) son semillas del sistema,
-- no datos privados. Se permite su lectura al rol `anon` además de a los
-- autenticados. Las filas PERSONALES siguen protegidas: sólo su dueño las ve.
-- ----------------------------------------------------------------------------

drop policy "exercises_select" on public.exercises;
create policy "exercises_select" on public.exercises
  for select to anon, authenticated
  using (user_id is null or (select auth.uid()) = user_id);

drop policy "foods_select" on public.foods;
create policy "foods_select" on public.foods
  for select to anon, authenticated
  using (user_id is null or (select auth.uid()) = user_id);
