-- ==========================================================
-- W7 — Unified WhatsApp + AI Schema (company_id based)
-- ==========================================================
-- This migration adds messaging, connections, automations,
-- and AI tables unified under company_id (from companies table).

-- ── WhatsApp Connections ──────────────────────────────────
create table if not exists public.whatsapp_connections (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  name          text not null,
  mode          text not null default 'qr_device' check (mode in ('qr_device', 'meta_api')),
  status        text not null default 'offline' check (status in ('online', 'offline', 'connecting', 'error')),
  qr_code       text,
  device_name   text,
  phone_number  text,
  profile_photo_url text,
  profile_name  text,
  battery       int,
  healthy       boolean not null default false,
  auto_reconnect boolean not null default true,
  last_sync_at  timestamptz,
  conversation_count int not null default 0,
  sent_count    int not null default 0,
  received_count int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_wa_connections_company on public.whatsapp_connections(company_id, status);

-- ── WhatsApp Labels ──────────────────────────────────────
create table if not exists public.whatsapp_labels (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  color       text not null default '#A6FF00',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (company_id, name)
);

-- ── WhatsApp Messages ────────────────────────────────────
create table if not exists public.whatsapp_messages (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  contact_id      uuid references public.contacts(id) on delete set null,
  sender_id       uuid references public.profiles(id) on delete set null,
  body            text not null default '',
  type            text not null default 'text' check (type in ('text','audio','image','video','document','location','contact','system')),
  from_me         boolean not null default false,
  sent_at         timestamptz not null default now(),
  delivered_at    timestamptz,
  read_at         timestamptz,
  quoted_message_id uuid references public.whatsapp_messages(id) on delete set null,
  favorited       boolean not null default false,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists idx_wa_messages_conv on public.whatsapp_messages(company_id, conversation_id, sent_at desc);
create index if not exists idx_wa_messages_search on public.whatsapp_messages using gin (to_tsvector('portuguese', body));

-- ── WhatsApp Attachments ─────────────────────────────────
create table if not exists public.whatsapp_attachments (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  message_id      uuid not null references public.whatsapp_messages(id) on delete cascade,
  kind            text not null check (kind in ('audio','image','video','document','location','contact')),
  url             text not null,
  mime_type       text,
  file_name       text,
  size_bytes      bigint,
  duration_seconds int,
  created_at      timestamptz not null default now()
);

-- ── Conversation Labels (junction) ──────────────────────
create table if not exists public.whatsapp_conversation_labels (
  company_id      uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  label_id        uuid not null references public.whatsapp_labels(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (company_id, conversation_id, label_id)
);

-- ── Contact Labels (junction) ───────────────────────────
create table if not exists public.whatsapp_contact_labels (
  company_id  uuid not null references public.companies(id) on delete cascade,
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  label_id    uuid not null references public.whatsapp_labels(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (company_id, contact_id, label_id)
);

-- ── Internal Notes ──────────────────────────────────────
create table if not exists public.whatsapp_notes (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);

-- ── Quick Replies ───────────────────────────────────────
create table if not exists public.whatsapp_quick_replies (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  shortcut    text not null,
  title       text not null default '',
  body        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (company_id, shortcut)
);

-- ── Automations ─────────────────────────────────────────
create table if not exists public.whatsapp_automations (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  type              text not null check (type in ('welcome','away','off_hours','closing','csat','auto_reply','department_route')),
  active            boolean not null default true,
  name              text not null,
  trigger_keywords  text[] default '{}',
  target_department_id uuid references public.departments(id) on delete set null,
  message_template  text not null default '',
  conditions        jsonb not null default '{}',
  priority          int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── Business Hours ──────────────────────────────────────
create table if not exists public.whatsapp_business_hours (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time  time not null default '09:00',
  end_time    time not null default '18:00',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (company_id, day_of_week)
);

-- ── Queues ──────────────────────────────────────────────
create table if not exists public.whatsapp_queues (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  color       text not null default '#A6FF00',
  priority    int not null default 1,
  auto_assign boolean not null default true,
  max_per_agent int not null default 10,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (company_id, name)
);

-- ── Queue Members ───────────────────────────────────────
create table if not exists public.whatsapp_queue_members (
  company_id  uuid not null references public.companies(id) on delete cascade,
  queue_id    uuid not null references public.whatsapp_queues(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (company_id, queue_id, profile_id)
);

-- ── Action Logs / Audit ─────────────────────────────────
create table if not exists public.whatsapp_logs (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  actor_id        uuid references public.profiles(id) on delete set null,
  action          text not null,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists idx_wa_logs_company on public.whatsapp_logs(company_id, created_at desc);

-- ── AI Configuration (per company) ──────────────────────
create table if not exists public.ai_configs (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid unique not null references public.companies(id) on delete cascade,
  enabled         boolean not null default false,
  auto_reply      boolean not null default false,
  personality     text not null default 'Assistente profissional e amigável',
  instructions    text not null default '',
  context         text not null default '',
  model           text not null default 'gemini-2.0-flash',
  temperature     numeric(3,2) not null default 0.7,
  max_tokens      int not null default 1024,
  auto_transfer_threshold numeric(3,2) not null default 0.3,
  transfer_message text not null default 'Vou transferir você para um atendente humano.',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── AI Knowledge Base ───────────────────────────────────
create table if not exists public.ai_knowledge_base (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  title       text not null,
  content     text not null,
  category    text not null default 'general',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_ai_kb_company on public.ai_knowledge_base(company_id);
create index if not exists idx_ai_kb_search on public.ai_knowledge_base using gin (to_tsvector('portuguese', title || ' ' || content));

-- ── AI Usage Logs ───────────────────────────────────────
create table if not exists public.ai_usage_logs (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  action          text not null check (action in ('auto_reply','suggestion','classify','sentiment','summary','intent','route')),
  input_tokens    int not null default 0,
  output_tokens   int not null default 0,
  model           text not null default 'gemini-2.0-flash',
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists idx_ai_usage_company on public.ai_usage_logs(company_id, created_at desc);

-- ── Add missing columns to conversations ────────────────
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'conversations' and column_name = 'priority') then
    alter table public.conversations add column priority text not null default 'normal' check (priority in ('low','normal','high','critical'));
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'conversations' and column_name = 'queue_id') then
    alter table public.conversations add column queue_id uuid references public.whatsapp_queues(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'conversations' and column_name = 'connection_id') then
    -- already exists, skip
    null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'conversations' and column_name = 'ai_sentiment') then
    alter table public.conversations add column ai_sentiment text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'conversations' and column_name = 'ai_summary') then
    alter table public.conversations add column ai_summary text;
  end if;
end $$;

-- ── Add custom fields to contacts ───────────────────────
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'contacts' and column_name = 'custom_fields') then
    alter table public.contacts add column custom_fields jsonb not null default '{}';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'contacts' and column_name = 'last_interaction_at') then
    alter table public.contacts add column last_interaction_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'contacts' and column_name = 'company_name') then
    alter table public.contacts add column company_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'contacts' and column_name = 'cpf_cnpj') then
    alter table public.contacts add column cpf_cnpj text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'contacts' and column_name = 'city') then
    alter table public.contacts add column city text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'contacts' and column_name = 'state') then
    alter table public.contacts add column state text;
  end if;
end $$;

-- ── Updated-at triggers ─────────────────────────────────
create or replace trigger wa_connections_updated_at before update on public.whatsapp_connections for each row execute function public.handle_updated_at();
create or replace trigger wa_labels_updated_at before update on public.whatsapp_labels for each row execute function public.handle_updated_at();
create or replace trigger wa_quick_replies_updated_at before update on public.whatsapp_quick_replies for each row execute function public.handle_updated_at();
create or replace trigger wa_automations_updated_at before update on public.whatsapp_automations for each row execute function public.handle_updated_at();
create or replace trigger wa_queues_updated_at before update on public.whatsapp_queues for each row execute function public.handle_updated_at();
create or replace trigger ai_configs_updated_at before update on public.ai_configs for each row execute function public.handle_updated_at();
create or replace trigger ai_kb_updated_at before update on public.ai_knowledge_base for each row execute function public.handle_updated_at();

-- ── RLS ──────────────────────────────────────────────────
alter table public.whatsapp_connections enable row level security;
alter table public.whatsapp_labels enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.whatsapp_attachments enable row level security;
alter table public.whatsapp_conversation_labels enable row level security;
alter table public.whatsapp_contact_labels enable row level security;
alter table public.whatsapp_notes enable row level security;
alter table public.whatsapp_quick_replies enable row level security;
alter table public.whatsapp_automations enable row level security;
alter table public.whatsapp_business_hours enable row level security;
alter table public.whatsapp_queues enable row level security;
alter table public.whatsapp_queue_members enable row level security;
alter table public.whatsapp_logs enable row level security;
alter table public.ai_configs enable row level security;
alter table public.ai_knowledge_base enable row level security;
alter table public.ai_usage_logs enable row level security;

-- RLS policies: all tables use my_company_id()
create policy "wa_connections_company" on public.whatsapp_connections for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "wa_labels_company" on public.whatsapp_labels for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "wa_messages_company" on public.whatsapp_messages for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "wa_attachments_company" on public.whatsapp_attachments for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "wa_conv_labels_company" on public.whatsapp_conversation_labels for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "wa_contact_labels_company" on public.whatsapp_contact_labels for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "wa_notes_company" on public.whatsapp_notes for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "wa_quick_replies_company" on public.whatsapp_quick_replies for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "wa_automations_company" on public.whatsapp_automations for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "wa_business_hours_company" on public.whatsapp_business_hours for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "wa_queues_company" on public.whatsapp_queues for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "wa_queue_members_company" on public.whatsapp_queue_members for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "wa_logs_company" on public.whatsapp_logs for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "ai_configs_company" on public.ai_configs for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "ai_kb_company" on public.ai_knowledge_base for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "ai_usage_company" on public.ai_usage_logs for all using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());

-- ── Realtime ─────────────────────────────────────────────
alter publication supabase_realtime add table public.whatsapp_messages;
alter publication supabase_realtime add table public.whatsapp_connections;
alter publication supabase_realtime add table public.whatsapp_notes;
