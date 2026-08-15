-- ════════════════════════════════════════════════════════════
-- Optional Google sign-in for END CLIENTS
-- Run this in Supabase SQL Editor (safe to re-run)
-- ════════════════════════════════════════════════════════════
-- What this does:
--   A CA firm can put a client's Google address on the client
--   record. That client may then press "Continue with Google"
--   instead of using a portal username + password.
--
--   Nothing becomes mandatory. Clients with no Google address
--   keep signing in exactly as they do today, and firm admins
--   and staff are untouched.
--
-- Security model:
--   Presence of the address here is the ENROLMENT. A Google
--   account that does not match an enrolled, active client is
--   refused — it never gets a profile row and therefore sees
--   nothing. Linking is performed by the `claim-google` edge
--   function using the service role, because a freshly
--   authenticated Google user has no firm_id yet and RLS
--   correctly shows them nothing.
-- ════════════════════════════════════════════════════════════

-- ── 1. The enrolment field ──────────────────────────────────
alter table clients
  add column if not exists portal_google_email text;

comment on column clients.portal_google_email is
  'Optional. Google address allowed to sign in as this client. '
  'Distinct from clients.email, which is only a contact address '
  'and grants no access.';

-- ── 2. One Google account cannot map to two clients ─────────
-- Case-insensitive, and ignores rows where it is not set.
create unique index if not exists clients_portal_google_email_key
  on clients (lower(portal_google_email))
  where portal_google_email is not null;

-- ── 3. Record how a portal user signs in ────────────────────
alter table users
  add column if not exists google_email  text,
  add column if not exists auth_method   text not null default 'password',
  add column if not exists last_login_at timestamptz;

-- Existing rows are all password users; the default above
-- already covers them. Constrain the allowed values.
alter table users drop constraint if exists users_auth_method_chk;
alter table users add constraint users_auth_method_chk
  check (auth_method in ('password', 'google'));

create unique index if not exists users_google_email_key
  on users (lower(google_email))
  where google_email is not null;

-- ── 4. Let a firm admin/staff see and edit the field ────────
-- clients_update already restricts to the caller's own firm and
-- to admin/staff roles, so no new policy is needed. Verify:
--
--   select policyname, cmd, qual from pg_policies
--   where tablename = 'clients';
--
-- Expected: clients_update USING
--   (firm_id = get_my_firm_id() and get_my_role() in ('admin','staff'))

-- ── 5. Guard: a client row must not be sign-in enrolled ─────
--     while the client is inactive.
-- Enforced in the edge function rather than a DB constraint so
-- that a firm can deactivate a client without having to clear
-- the address first (and can reactivate without re-typing it).

-- ── Verify ──────────────────────────────────────────────────
-- select id, name, email, portal_google_email, status
--   from clients where portal_google_email is not null;
-- select id, name, username, google_email, auth_method, role
--   from users order by firm_id, role;
