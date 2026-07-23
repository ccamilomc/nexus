-- ============================================================================
-- Nexus · Migración inicial 1/8 — Tipos enumerados y funciones base
-- ============================================================================
-- Define los tipos enumerados del dominio (ver docs/04-modelo-de-datos.md) y las
-- funciones reutilizables. No crea tablas todavía.
-- ----------------------------------------------------------------------------

-- ─── Tipos enumerados ───────────────────────────────────────────────────────
create type public.unit_system as enum ('metric', 'imperial');
create type public.theme_preference as enum ('system', 'light', 'dark');
create type public.sex as enum ('male', 'female', 'other', 'unspecified');

create type public.plan_status as enum ('draft', 'active', 'completed');
create type public.plan_item_domain as enum (
  'workout', 'nutrition', 'study', 'habit', 'sleep', 'health'
);
create type public.plan_item_status as enum (
  'pending', 'in_progress', 'done', 'skipped', 'rescheduled'
);
create type public.priority as enum ('low', 'medium', 'high', 'critical');

create type public.workout_session_status as enum (
  'planned', 'in_progress', 'completed', 'skipped'
);
create type public.muscle_group as enum (
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'glutes', 'core', 'full_body', 'cardio'
);
create type public.equipment as enum (
  'none', 'barbell', 'dumbbell', 'machine', 'cable', 'kettlebell', 'band', 'bodyweight'
);

create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.habit_frequency as enum ('daily', 'weekly', 'custom');
create type public.body_metric_type as enum (
  'weight', 'body_fat', 'waist', 'hip', 'chest', 'arm', 'thigh', 'neck'
);

create type public.recommendation_type as enum (
  'day_recalculation', 'meal_swap', 'alternative_routine', 'alert', 'insight'
);
create type public.recommendation_status as enum (
  'pending', 'accepted', 'dismissed', 'expired'
);
create type public.notification_channel as enum ('in_app', 'push');

-- ─── Función: mantener updated_at automáticamente ───────────────────────────
-- search_path fijado a '' por seguridad (evita secuestro de search_path).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Función: crear perfil y preferencias al registrarse un usuario ─────────
-- Se dispara desde auth.users. security definer porque escribe en tablas
-- públicas desde el contexto del sistema de autenticación.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;
