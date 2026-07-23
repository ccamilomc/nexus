-- ============================================================================
-- Nexus · Migración inicial 6/8 — Recomendaciones, Asistente (IA) y Notificaciones
-- ============================================================================

-- ─── recommendations (salida del Decision Engine) ──────────────────────────
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.recommendation_type not null,
  domain public.plan_item_domain,
  title text not null,
  message text not null,
  reason text not null,
  data jsonb not null default '{}'::jsonb,
  priority public.priority not null default 'medium',
  status public.recommendation_status not null default 'pending',
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_recommendations_updated_at
before update on public.recommendations
for each row execute function public.set_updated_at();

create index idx_recommendations_user_status_priority
  on public.recommendations (user_id, status, priority);

alter table public.recommendations enable row level security;

create policy "recommendations_own" on public.recommendations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── assistant_conversations ────────────────────────────────────────────────
create table public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_assistant_conversations_updated_at
before update on public.assistant_conversations
for each row execute function public.set_updated_at();

create index idx_assistant_conversations_user on public.assistant_conversations (user_id);

alter table public.assistant_conversations enable row level security;

create policy "assistant_conversations_own" on public.assistant_conversations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── assistant_messages (append-only: sólo created_at) ─────────────────────
create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  token_count integer,
  created_at timestamptz not null default now()
);

create index idx_assistant_messages_conversation
  on public.assistant_messages (conversation_id, created_at);

alter table public.assistant_messages enable row level security;

create policy "assistant_messages_own" on public.assistant_messages
  for all to authenticated
  using (
    exists (
      select 1 from public.assistant_conversations c
      where c.id = assistant_messages.conversation_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.assistant_conversations c
      where c.id = assistant_messages.conversation_id and c.user_id = (select auth.uid())
    )
  );

-- ─── notifications ──────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  channel public.notification_channel not null default 'in_app',
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_notifications_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

create index idx_notifications_user_created on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_own" on public.notifications
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
