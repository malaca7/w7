-- W7 WhatsApp & Atendimento Module
-- Multi-tenant schema with strict row-level isolation.

create extension if not exists pgcrypto;

create type public.w7_connection_mode as enum ('qr_device', 'meta_api');
create type public.w7_connection_status as enum ('online', 'offline', 'connecting', 'error');
create type public.w7_conversation_status as enum ('new', 'pending', 'in_progress', 'paused', 'closed', 'archived');
create type public.w7_priority as enum ('low', 'normal', 'high', 'critical');
create type public.w7_message_type as enum ('text', 'audio', 'image', 'video', 'document', 'pdf', 'location', 'contact', 'system');
create type public.w7_role as enum ('super_admin', 'admin', 'supervisor', 'agent');
create type public.w7_schedule_type as enum ('once', 'recurring');
create type public.w7_schedule_status as enum ('scheduled', 'sent', 'cancelled');
create type public.w7_automation_type as enum ('welcome', 'away', 'off_hours', 'closing', 'csat', 'quick_reply', 'scheduled');

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  color text not null default '#A6FF00',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  avatar_url text,
  role public.w7_role not null default 'agent',
  online boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_departments (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tenant_id, agent_id, department_id)
);

create table if not exists public.queues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  color text not null default '#A6FF00',
  priority int not null default 1,
  business_hours text,
  auto_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists public.queue_agents (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  queue_id uuid not null references public.queues(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tenant_id, queue_id, agent_id)
);

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  mode public.w7_connection_mode not null,
  status public.w7_connection_status not null default 'offline',
  qr_code text,
  device_name text,
  phone_number text,
  profile_photo_url text,
  profile_name text,
  battery int,
  healthy boolean not null default false,
  auto_reconnect boolean not null default true,
  last_sync_at timestamptz,
  conversation_count int not null default 0,
  sent_count int not null default 0,
  received_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  connection_id uuid not null references public.connections(id) on delete cascade,
  external_device_id text,
  platform text,
  app_version text,
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  company text,
  city text,
  state text,
  cpf_cnpj text,
  avatar_url text,
  observations text,
  last_service_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone)
);

create table if not exists public.contact_labels (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tenant_id, contact_id, label_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  connection_id uuid not null references public.connections(id) on delete cascade,
  channel text not null default 'whatsapp',
  status public.w7_conversation_status not null default 'new',
  queue_id uuid references public.queues(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  assigned_agent_id uuid references public.agents(id) on delete set null,
  priority public.w7_priority not null default 'normal',
  last_message_preview text,
  last_message_at timestamptz,
  unread_count int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_labels (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tenant_id, conversation_id, label_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  body text not null,
  type public.w7_message_type not null default 'text',
  from_me boolean not null default false,
  sent_at timestamptz not null default now(),
  delivered_at timestamptz,
  read_at timestamptz,
  quoted_message_id uuid references public.messages(id) on delete set null,
  favorited boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  kind public.w7_message_type not null,
  url text not null,
  mime_type text,
  file_name text,
  size_bytes bigint,
  duration_seconds int,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quick_replies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  shortcut text not null,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, shortcut)
);

create table if not exists public.scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  body text not null,
  schedule_type public.w7_schedule_type not null default 'once',
  schedule_at timestamptz not null,
  recurrence_rule text,
  status public.w7_schedule_status not null default 'scheduled',
  created_by_agent_id uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  type public.w7_automation_type not null,
  active boolean not null default true,
  name text not null,
  trigger_description text not null,
  message_template text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  actor_agent_id uuid references public.agents(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  title text not null,
  body text not null,
  category text not null default 'system',
  read_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_connections_tenant_status on public.connections(tenant_id, status);
create index if not exists idx_contacts_tenant_phone on public.contacts(tenant_id, phone);
create index if not exists idx_conversations_tenant_status on public.conversations(tenant_id, status);
create index if not exists idx_conversations_tenant_updated on public.conversations(tenant_id, updated_at desc);
create index if not exists idx_messages_tenant_conversation_sent on public.messages(tenant_id, conversation_id, sent_at desc);
create index if not exists idx_messages_tenant_type on public.messages(tenant_id, type);
create index if not exists idx_scheduled_messages_tenant_status on public.scheduled_messages(tenant_id, status, schedule_at);
create index if not exists idx_notifications_tenant_created on public.notifications(tenant_id, created_at desc);
create index if not exists idx_logs_tenant_created on public.logs(tenant_id, created_at desc);

create or replace function public.w7_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.w7_current_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid;
$$;

drop trigger if exists trg_tenants_updated_at on public.tenants;
create trigger trg_tenants_updated_at before update on public.tenants
for each row execute function public.w7_set_updated_at();

drop trigger if exists trg_departments_updated_at on public.departments;
create trigger trg_departments_updated_at before update on public.departments
for each row execute function public.w7_set_updated_at();

drop trigger if exists trg_agents_updated_at on public.agents;
create trigger trg_agents_updated_at before update on public.agents
for each row execute function public.w7_set_updated_at();

drop trigger if exists trg_queues_updated_at on public.queues;
create trigger trg_queues_updated_at before update on public.queues
for each row execute function public.w7_set_updated_at();

drop trigger if exists trg_connections_updated_at on public.connections;
create trigger trg_connections_updated_at before update on public.connections
for each row execute function public.w7_set_updated_at();

drop trigger if exists trg_devices_updated_at on public.devices;
create trigger trg_devices_updated_at before update on public.devices
for each row execute function public.w7_set_updated_at();

drop trigger if exists trg_labels_updated_at on public.labels;
create trigger trg_labels_updated_at before update on public.labels
for each row execute function public.w7_set_updated_at();

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at before update on public.contacts
for each row execute function public.w7_set_updated_at();

drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at before update on public.conversations
for each row execute function public.w7_set_updated_at();

drop trigger if exists trg_quick_replies_updated_at on public.quick_replies;
create trigger trg_quick_replies_updated_at before update on public.quick_replies
for each row execute function public.w7_set_updated_at();

drop trigger if exists trg_scheduled_messages_updated_at on public.scheduled_messages;
create trigger trg_scheduled_messages_updated_at before update on public.scheduled_messages
for each row execute function public.w7_set_updated_at();

drop trigger if exists trg_automations_updated_at on public.automations;
create trigger trg_automations_updated_at before update on public.automations
for each row execute function public.w7_set_updated_at();

alter table public.tenants enable row level security;
alter table public.departments enable row level security;
alter table public.agents enable row level security;
alter table public.agent_departments enable row level security;
alter table public.queues enable row level security;
alter table public.queue_agents enable row level security;
alter table public.connections enable row level security;
alter table public.devices enable row level security;
alter table public.labels enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_labels enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_labels enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.notes enable row level security;
alter table public.quick_replies enable row level security;
alter table public.scheduled_messages enable row level security;
alter table public.automations enable row level security;
alter table public.logs enable row level security;
alter table public.notifications enable row level security;

create policy if not exists "tenant_isolation_tenants_select" on public.tenants
for select using (id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_tenants_update" on public.tenants
for update using (id = public.w7_current_tenant_id()) with check (id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_departments_all" on public.departments
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_agents_all" on public.agents
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_agent_departments_all" on public.agent_departments
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_queues_all" on public.queues
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_queue_agents_all" on public.queue_agents
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_connections_all" on public.connections
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_devices_all" on public.devices
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_labels_all" on public.labels
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_contacts_all" on public.contacts
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_contact_labels_all" on public.contact_labels
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_conversations_all" on public.conversations
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_conversation_labels_all" on public.conversation_labels
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_messages_all" on public.messages
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_attachments_all" on public.attachments
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_notes_all" on public.notes
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_quick_replies_all" on public.quick_replies
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_scheduled_messages_all" on public.scheduled_messages
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_automations_all" on public.automations
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_logs_all" on public.logs
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());

create policy if not exists "tenant_isolation_notifications_all" on public.notifications
for all using (tenant_id = public.w7_current_tenant_id()) with check (tenant_id = public.w7_current_tenant_id());
