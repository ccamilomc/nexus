-- ============================================================================
-- Nexus · Migración inicial 7/8 — Storage (fotos de progreso)
-- ============================================================================
-- Bucket PRIVADO. Cada usuario sólo accede a su carpeta: {user_id}/archivo.ext.
-- El acceso a las imágenes se hace con URLs firmadas de vida corta.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- El primer segmento de la ruta debe ser el id del usuario autenticado.
create policy "progress_photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'progress-photos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "progress_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'progress-photos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "progress_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'progress-photos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'progress-photos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "progress_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'progress-photos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
