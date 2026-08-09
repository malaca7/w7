-- ==========================================================
-- W7 — Auth & Multi-Tenant Schema
-- ==========================================================

-- ── Companies (tenants) ────────────────────────────────────
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  logo_url    text,
  website     text,
  email       text,
  phone       text,
  address     text,
  plan        text not null default 'trial' check (plan in ('trial','starter','pro','enterprise')),
  plan_status text not null default 'active' check (plan_status in ('active','suspended','cancelled','past_due')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Profiles ──────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid references public.companies(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        text not null default 'attendant' check (role in ('owner','admin','supervisor','attendant')),
  department_id uuid,
  is_active   boolean not null default true,
  last_seen_at  timestamptz,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Departments ───────────────────────────────────────────
create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  description text,
  color       text default '#A6FF00',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_department_fk
  foreign key (department_id) references public.departments(id) on delete set null;

-- ── Invitations ───────────────────────────────────────────
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  invited_by  uuid not null references public.profiles(id) on delete cascade,
  email       text not null,
  role        text not null default 'attendant' check (role in ('admin','supervisor','attendant')),
  token       text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ── Notifications ─────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  title       text not null,
  body        text,
  type        text not null default 'info' check (type in ('info','success','warning','error')),
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ── Contacts / CRM ────────────────────────────────────────
create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  whatsapp    text,
  avatar_url  text,
  tags        text[] default '{}',
  notes       text,
  stage       text default 'lead' check (stage in ('lead','prospect','customer','churned')),
  assigned_to uuid references public.profiles(id) on delete set null,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Conversations ─────────────────────────────────────────
create table if not exists public.conversations (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  contact_id   uuid references public.contacts(id) on delete set null,
  connection_id uuid,
  assigned_to  uuid references public.profiles(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  status       text not null default 'open' check (status in ('open','pending','resolved','archived')),
  channel      text not null default 'whatsapp' check (channel in ('whatsapp','email','chat','instagram')),
  last_message text,
  last_message_at timestamptz,
  unread_count int not null default 0,
  tags         text[] default '{}',
  metadata     jsonb default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Appointments ──────────────────────────────────────────
create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  contact_id  uuid references public.contacts(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  title       text not null,
  description text,
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  status      text not null default 'scheduled' check (status in ('scheduled','confirmed','cancelled','completed')),
  created_at  timestamptz not null default now()
);

-- ── Campaigns ─────────────────────────────────────────────
create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  created_by  uuid references public.profiles(id) on delete set null,
  name        text not null,
  description text,
  message     text not null,
  type        text not null default 'whatsapp' check (type in ('whatsapp','email','sms')),
  status      text not null default 'draft' check (status in ('draft','scheduled','running','paused','completed','failed')),
  scheduled_at timestamptz,
  sent_count  int not null default 0,
  delivered_count int not null default 0,
  read_count  int not null default 0,
  failed_count int not null default 0,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Financial / Transactions ──────────────────────────────
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  type        text not null check (type in ('income','expense')),
  category    text,
  description text not null,
  amount      numeric(12,2) not null,
  currency    text not null default 'BRL',
  status      text not null default 'completed' check (status in ('pending','completed','cancelled','refunded')),
  reference   text,
  metadata    jsonb default '{}',
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- ── Subscriptions ────────────────────────────────────────
create table if not exists public.subscriptions (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  plan           text not null check (plan in ('starter','pro','enterprise')),
  status         text not null default 'active' check (status in ('active','past_due','cancelled','trialing')),
  current_period_start timestamptz not null default now(),
  current_period_end   timestamptz not null default (now() + interval '30 days'),
  cancel_at      timestamptz,
  payment_method jsonb default '{}',
  external_id    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Chatbot Flows ─────────────────────────────────────────
create table if not exists public.chatbot_flows (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  description text,
  trigger     text,
  is_active   boolean not null default false,
  nodes       jsonb default '[]',
  edges       jsonb default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ==========================================================
-- INDEXES
-- ==========================================================
create index if not exists idx_profiles_company on public.profiles(company_id);
create index if not exists idx_contacts_company on public.contacts(company_id);
create index if not exists idx_conversations_company on public.conversations(company_id);
create index if not exists idx_conversations_status on public.conversations(company_id, status);
create index if not exists idx_notifications_user on public.notifications(user_id, read_at);
create index if not exists idx_campaigns_company on public.campaigns(company_id);
create index if not exists idx_transactions_company on public.transactions(company_id);
create index if not exists idx_appointments_company on public.appointments(company_id, start_at);

-- ==========================================================
-- UPDATED_AT TRIGGER
-- ==========================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger companies_updated_at
  before update on public.companies
  for each row execute function public.handle_updated_at();

create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace trigger contacts_updated_at
  before update on public.contacts
  for each row execute function public.handle_updated_at();

create or replace trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.handle_updated_at();

create or replace trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.handle_updated_at();

-- ==========================================================
-- NEW USER HANDLER
-- ==========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_company_id uuid;
  v_company_name text;
  v_company_slug text;
  v_role text;
begin
  -- check if joining via invitation
  if new.raw_user_meta_data ? 'invitation_token' then
    -- find invitation
    select i.company_id, 'attendant'
    into v_company_id, v_role
    from public.invitations i
    where i.token = (new.raw_user_meta_data->>'invitation_token')
      and i.expires_at > now()
      and i.accepted_at is null;

    if v_company_id is not null then
      -- mark invitation as accepted
      update public.invitations
      set accepted_at = now()
      where token = (new.raw_user_meta_data->>'invitation_token');

      -- create profile linked to company
      insert into public.profiles (id, company_id, full_name, role)
      values (new.id, v_company_id, new.raw_user_meta_data->>'full_name', v_role);
      return new;
    end if;
  end if;

  -- new company registration (owner)
  v_company_name := coalesce(new.raw_user_meta_data->>'company_name', 'Minha Empresa');
  v_company_slug := lower(regexp_replace(v_company_name, '[^a-zA-Z0-9]', '-', 'g'));
  v_company_slug := v_company_slug || '-' || substr(new.id::text, 1, 8);

  insert into public.companies (name, slug)
  values (v_company_name, v_company_slug)
  returning id into v_company_id;

  insert into public.profiles (id, company_id, full_name, role)
  values (new.id, v_company_id, new.raw_user_meta_data->>'full_name', 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==========================================================
-- ROW LEVEL SECURITY
-- ==========================================================

-- Helper: get current user's company_id
create or replace function public.my_company_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- Helper: get current user's role
create or replace function public.my_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

-- COMPANIES
alter table public.companies enable row level security;
create policy "members can read own company"
  on public.companies for select
  using (id = public.my_company_id());

create policy "owner/admin can update company"
  on public.companies for update
  using (id = public.my_company_id() and public.my_role() in ('owner','admin'));

-- PROFILES
alter table public.profiles enable row level security;
create policy "company members can read profiles"
  on public.profiles for select
  using (company_id = public.my_company_id());

create policy "owner can manage profiles"
  on public.profiles for all
  using (company_id = public.my_company_id() and public.my_role() in ('owner','admin'));

create policy "user can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- DEPARTMENTS
alter table public.departments enable row level security;
create policy "company members can read departments"
  on public.departments for select
  using (company_id = public.my_company_id());
create policy "admin can manage departments"
  on public.departments for all
  using (company_id = public.my_company_id() and public.my_role() in ('owner','admin'));

-- CONTACTS
alter table public.contacts enable row level security;
create policy "company members can read contacts"
  on public.contacts for select
  using (company_id = public.my_company_id());
create policy "company members can manage contacts"
  on public.contacts for all
  using (company_id = public.my_company_id());

-- CONVERSATIONS
alter table public.conversations enable row level security;
create policy "company members can read conversations"
  on public.conversations for select
  using (company_id = public.my_company_id());
create policy "company members can manage conversations"
  on public.conversations for all
  using (company_id = public.my_company_id());

-- NOTIFICATIONS
alter table public.notifications enable row level security;
create policy "user can read own notifications"
  on public.notifications for select
  using (user_id = auth.uid() and company_id = public.my_company_id());
create policy "user can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());
create policy "admin can insert notifications"
  on public.notifications for insert
  with check (company_id = public.my_company_id() and public.my_role() in ('owner','admin','supervisor'));

-- APPOINTMENTS
alter table public.appointments enable row level security;
create policy "company members can read appointments"
  on public.appointments for select
  using (company_id = public.my_company_id());
create policy "company members can manage appointments"
  on public.appointments for all
  using (company_id = public.my_company_id());

-- CAMPAIGNS
alter table public.campaigns enable row level security;
create policy "company members can read campaigns"
  on public.campaigns for select
  using (company_id = public.my_company_id());
create policy "admin can manage campaigns"
  on public.campaigns for all
  using (company_id = public.my_company_id() and public.my_role() in ('owner','admin','supervisor'));

-- TRANSACTIONS
alter table public.transactions enable row level security;
create policy "admin can read transactions"
  on public.transactions for select
  using (company_id = public.my_company_id() and public.my_role() in ('owner','admin'));
create policy "admin can manage transactions"
  on public.transactions for all
  using (company_id = public.my_company_id() and public.my_role() in ('owner','admin'));

-- SUBSCRIPTIONS
alter table public.subscriptions enable row level security;
create policy "owner/admin can read subscriptions"
  on public.subscriptions for select
  using (company_id = public.my_company_id() and public.my_role() in ('owner','admin'));

-- INVITATIONS
alter table public.invitations enable row level security;
create policy "admin can read invitations"
  on public.invitations for select
  using (company_id = public.my_company_id() and public.my_role() in ('owner','admin'));
create policy "admin can manage invitations"
  on public.invitations for all
  using (company_id = public.my_company_id() and public.my_role() in ('owner','admin'));

-- CHATBOT FLOWS
alter table public.chatbot_flows enable row level security;
create policy "company members can read flows"
  on public.chatbot_flows for select
  using (company_id = public.my_company_id());
create policy "admin can manage flows"
  on public.chatbot_flows for all
  using (company_id = public.my_company_id() and public.my_role() in ('owner','admin','supervisor'));

-- ==========================================================
-- REALTIME
-- ==========================================================
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.notifications;
