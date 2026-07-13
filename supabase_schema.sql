-- ============================================================
-- CA CLIENT PORTAL — Supabase Schema
-- Run this entire file in Supabase SQL Editor (safe to re-run)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── 1. FIRMS ────────────────────────────────────────────────
create table if not exists firms (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  plan       text not null default 'free',   -- 'free' | 'pro'
  created_at timestamptz not null default now()
);

-- ── 2. USERS ────────────────────────────────────────────────
-- Mirrors Supabase auth.users via auth_id
create table if not exists users (
  id         uuid primary key default uuid_generate_v4(),
  firm_id    uuid not null references firms(id) on delete cascade,
  auth_id    uuid unique,                    -- links to auth.users.id
  name       text not null,
  email      text not null,
  role       text not null default 'staff',  -- 'admin' | 'staff' | 'client'
  client_id  uuid,                           -- set only when role = 'client'
  created_at timestamptz not null default now()
);
create index if not exists users_firm_id_idx  on users(firm_id);
create index if not exists users_auth_id_idx  on users(auth_id);

-- ── 3. CLIENTS ──────────────────────────────────────────────
create table if not exists clients (
  id         uuid primary key default uuid_generate_v4(),
  firm_id    uuid not null references firms(id) on delete cascade,
  name       text not null,
  email      text,
  phone      text,
  pan        text,
  gst        text,
  aadhar     text,          -- store last 4 digits only
  type       text not null default 'Individual',  -- 'Individual'|'Company'|'Partnership'|'LLP'|'HUF'|'Trust'
  status     text not null default 'active',      -- 'active'|'inactive'
  notes      text,                                -- CA-private notes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clients_firm_id_idx on clients(firm_id);

-- ── 4. SERVICES (per client) ─────────────────────────────────
create table if not exists client_services (
  id           uuid primary key default uuid_generate_v4(),
  firm_id      uuid not null references firms(id) on delete cascade,
  client_id    uuid not null references clients(id) on delete cascade,
  service_name text not null,
  status       text not null default 'Pending Documents',
  -- 'Pending Documents'|'Under Review'|'In Progress'|'Filed'|'Completed'|'On Hold'|'Rejected'
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists client_services_client_id_idx on client_services(client_id);

-- ── 5. TASKS ────────────────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default uuid_generate_v4(),
  firm_id     uuid not null references firms(id) on delete cascade,
  client_id   uuid references clients(id) on delete set null,
  assigned_to uuid references users(id) on delete set null,
  title       text not null,
  description text,
  due_date    date,
  priority    text not null default 'Medium',   -- 'Low'|'Medium'|'High'
  status      text not null default 'pending',  -- 'pending'|'in_progress'|'done'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tasks_firm_id_idx   on tasks(firm_id);
create index if not exists tasks_due_date_idx  on tasks(due_date);

-- ── 6. DOCUMENT REQUESTS ────────────────────────────────────
create table if not exists doc_requests (
  id         uuid primary key default uuid_generate_v4(),
  firm_id    uuid not null references firms(id) on delete cascade,
  client_id  uuid not null references clients(id) on delete cascade,
  title      text not null,
  category   text not null default 'Other',
  due_date   date,
  status     text not null default 'pending',  -- 'pending'|'uploaded'|'reviewed'
  created_at timestamptz not null default now()
);
create index if not exists doc_requests_client_id_idx on doc_requests(client_id);
create index if not exists doc_requests_firm_id_idx   on doc_requests(firm_id);

-- ── 7. DOCUMENTS (uploaded files) ──────────────────────────
create table if not exists documents (
  id          uuid primary key default uuid_generate_v4(),
  firm_id     uuid not null references firms(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  request_id  uuid references doc_requests(id) on delete set null,
  file_name   text not null,
  file_url    text not null,
  status      text not null default 'uploaded',  -- 'uploaded'|'reviewed'
  created_at  timestamptz not null default now()
);
create index if not exists documents_client_id_idx  on documents(client_id);
create index if not exists documents_request_id_idx on documents(request_id);

-- ── 8. INVOICES ─────────────────────────────────────────────
create table if not exists invoices (
  id          uuid primary key default uuid_generate_v4(),
  firm_id     uuid not null references firms(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  description text not null,
  amount      numeric(10,2) not null,
  date        date not null,
  paid        boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists invoices_firm_id_idx   on invoices(firm_id);
create index if not exists invoices_client_id_idx on invoices(client_id);

-- ── 9. NOTICES ──────────────────────────────────────────────
create table if not exists notices (
  id         uuid primary key default uuid_generate_v4(),
  firm_id    uuid not null references firms(id) on delete cascade,
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notices_firm_id_idx on notices(firm_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Every table is isolated by firm_id.
-- Users can only access data belonging to their own firm.
-- Clients additionally can only access their own client row.

alter table firms           enable row level security;
alter table users           enable row level security;
alter table clients         enable row level security;
alter table client_services enable row level security;
alter table tasks           enable row level security;
alter table doc_requests    enable row level security;
alter table documents       enable row level security;
alter table invoices        enable row level security;
alter table notices         enable row level security;

-- Helper function: get current user's firm_id from users table
create or replace function get_my_firm_id()
returns uuid language sql security definer stable as $$
  select firm_id from users where auth_id = auth.uid() limit 1
$$;

-- Helper: get current user's role
create or replace function get_my_role()
returns text language sql security definer stable as $$
  select role from users where auth_id = auth.uid() limit 1
$$;

-- Helper: get current user's client_id (for client role)
create or replace function get_my_client_id()
returns uuid language sql security definer stable as $$
  select client_id from users where auth_id = auth.uid() limit 1
$$;

-- ── firms: user can only see/edit their own firm ──
drop policy if exists "firms_select" on firms;
create policy "firms_select" on firms for select using (id = get_my_firm_id());
drop policy if exists "firms_update" on firms;
create policy "firms_update" on firms for update using (id = get_my_firm_id() and get_my_role() = 'admin');

-- ── users: see own firm's users; admin can insert/update ──
drop policy if exists "users_select" on users;
create policy "users_select" on users for select using (firm_id = get_my_firm_id());
drop policy if exists "users_insert" on users;
create policy "users_insert" on users for insert with check (firm_id = get_my_firm_id() and get_my_role() = 'admin');
drop policy if exists "users_update" on users;
create policy "users_update" on users for update using (firm_id = get_my_firm_id() and get_my_role() = 'admin');

-- ── clients ──
drop policy if exists "clients_select" on clients;
create policy "clients_select" on clients for select using (
  firm_id = get_my_firm_id() and (
    get_my_role() in ('admin','staff') or id = get_my_client_id()
  )
);
drop policy if exists "clients_insert" on clients;
create policy "clients_insert" on clients for insert with check (firm_id = get_my_firm_id() and get_my_role() in ('admin','staff'));
drop policy if exists "clients_update" on clients;
create policy "clients_update" on clients for update using (firm_id = get_my_firm_id() and get_my_role() in ('admin','staff'));

-- ── client_services ──
drop policy if exists "client_services_select" on client_services;
create policy "client_services_select" on client_services for select using (
  firm_id = get_my_firm_id() and (
    get_my_role() in ('admin','staff') or client_id = get_my_client_id()
  )
);
drop policy if exists "client_services_all" on client_services;
create policy "client_services_all" on client_services for all using (firm_id = get_my_firm_id() and get_my_role() in ('admin','staff'));

-- ── tasks ──
drop policy if exists "tasks_select" on tasks;
create policy "tasks_select" on tasks for select using (firm_id = get_my_firm_id() and get_my_role() in ('admin','staff'));
drop policy if exists "tasks_all" on tasks;
create policy "tasks_all" on tasks for all using (firm_id = get_my_firm_id() and get_my_role() in ('admin','staff'));

-- ── doc_requests ──
drop policy if exists "doc_requests_select" on doc_requests;
create policy "doc_requests_select" on doc_requests for select using (
  firm_id = get_my_firm_id() and (
    get_my_role() in ('admin','staff') or client_id = get_my_client_id()
  )
);
drop policy if exists "doc_requests_staff_all" on doc_requests;
create policy "doc_requests_staff_all" on doc_requests for all using (firm_id = get_my_firm_id() and get_my_role() in ('admin','staff'));
drop policy if exists "doc_requests_client_update" on doc_requests;
create policy "doc_requests_client_update" on doc_requests for update using (
  firm_id = get_my_firm_id() and client_id = get_my_client_id() and get_my_role() = 'client'
);

-- ── documents ──
drop policy if exists "documents_select" on documents;
create policy "documents_select" on documents for select using (
  firm_id = get_my_firm_id() and (
    get_my_role() in ('admin','staff') or client_id = get_my_client_id()
  )
);
drop policy if exists "documents_insert" on documents;
create policy "documents_insert" on documents for insert with check (
  firm_id = get_my_firm_id() and (
    get_my_role() in ('admin','staff') or client_id = get_my_client_id()
  )
);
drop policy if exists "documents_staff_update" on documents;
create policy "documents_staff_update" on documents for update using (firm_id = get_my_firm_id() and get_my_role() in ('admin','staff'));

-- ── invoices (CA/staff only) ──
drop policy if exists "invoices_all" on invoices;
create policy "invoices_all" on invoices for all using (firm_id = get_my_firm_id() and get_my_role() in ('admin','staff'));

-- ── notices ──
drop policy if exists "notices_select" on notices;
create policy "notices_select" on notices for select using (firm_id = get_my_firm_id());
drop policy if exists "notices_all" on notices;
create policy "notices_all" on notices for all using (firm_id = get_my_firm_id() and get_my_role() in ('admin','staff'));

-- ============================================================
-- STORAGE BUCKET for document uploads
-- Run this separately in Supabase Storage UI or SQL:
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', true)
-- on conflict do nothing;
--
-- Then add storage policy: allow authenticated users to upload to their firm folder

-- ============================================================
-- SAMPLE DATA (optional — remove before production)
-- ============================================================
-- Uncomment to seed a demo firm + admin user after running schema:
/*
insert into firms (id, name, plan) values
  ('11111111-1111-1111-1111-111111111111', 'Demo CA Firm', 'pro');

-- After creating auth user via Supabase Dashboard, insert:
insert into users (firm_id, auth_id, name, email, role) values
  ('11111111-1111-1111-1111-111111111111', '<your-auth-user-id>', 'Admin CA', 'admin@demo.com', 'admin');
*/
