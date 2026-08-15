-- ════════════════════════════════════════════════════════════
-- Storage lockdown + RLS helper hardening
-- ALREADY APPLIED to project gigqhlfkikufnuxcbwky on 2026-08-15.
-- Kept here so the repo matches production and the change is
-- reviewable. Safe to re-run.
-- ════════════════════════════════════════════════════════════
--
-- What was wrong
-- ──────────────
-- 1. The `documents` bucket was public. Every uploaded file was
--    readable by anyone holding the URL, with no authentication.
--    PUBLIC_UPLOAD_MIGRATION.sql tried to create it with
--    public=false, but the bucket already existed and the
--    ON CONFLICT DO NOTHING silently skipped the correction.
--
-- 2. Worse, and invisible from the dashboard: a storage policy
--    `anon_read_documents_storage` granted SELECT on the whole
--    bucket to the `anon` role. The anon key ships inside the
--    frontend JS bundle, so this exposed every firm's documents
--    even after the bucket flag was flipped to private.
--
-- 3. `authenticated` had no SELECT policy on the bucket at all —
--    genuine users were only ever reading via the public URL.
--
-- 4. Anonymous INSERT was unscoped: anything could be written
--    anywhere in the bucket.
--
-- 5. get_my_firm_id / get_my_role / get_my_client_id are
--    SECURITY DEFINER with a mutable search_path. Every RLS
--    policy routes through them, so they are the tenant boundary.
-- ════════════════════════════════════════════════════════════

-- ── 1. Pin search_path on the RLS helpers ───────────────────
create or replace function public.get_my_firm_id()
  returns uuid language sql stable security definer set search_path = ''
as $$ select firm_id from public.users where auth_id = (select auth.uid()) limit 1 $$;

create or replace function public.get_my_role()
  returns text language sql stable security definer set search_path = ''
as $$ select role from public.users where auth_id = (select auth.uid()) limit 1 $$;

create or replace function public.get_my_client_id()
  returns uuid language sql stable security definer set search_path = ''
as $$ select client_id from public.users where auth_id = (select auth.uid()) limit 1 $$;

-- ── 2. Bucket goes private ──────────────────────────────────
update storage.buckets set public = false where id = 'documents';

-- ── 3. Remove the blanket anonymous read ────────────────────
drop policy if exists "anon_read_documents_storage" on storage.objects;

-- ── 4. Scoped read for authenticated users ──────────────────
-- Object keys are {firm_id}/{client_id}/{request_id}/{filename},
-- so the path prefix is the tenant check. Mirrors documents_select
-- on public.documents.
drop policy if exists "documents_read_own_firm" on storage.objects;
create policy "documents_read_own_firm" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.get_my_firm_id()::text
    and (
      public.get_my_role() in ('admin', 'staff')
      or (
        public.get_my_role() = 'client'
        and (storage.foldername(name))[2] = public.get_my_client_id()::text
      )
    )
  );

-- ── 5. Anonymous upload, but only against a pending request ─
-- The no-login upload page is a real feature; this keeps it while
-- removing the write-anywhere hole.
drop policy if exists "anon_upload_documents_storage" on storage.objects;
drop policy if exists "anon_upload_to_documents"      on storage.objects;

create policy "anon_upload_against_pending_request" on storage.objects
  for insert to anon
  with check (
    bucket_id = 'documents'
    and array_length(storage.foldername(name), 1) >= 3
    and exists (
      select 1 from public.doc_requests r
      where r.id::text        = (storage.foldername(name))[3]
        and r.firm_id::text   = (storage.foldername(name))[1]
        and r.client_id::text = (storage.foldername(name))[2]
        and r.status = 'pending'
    )
  );

-- ── 6. Staff upload to their own firm ───────────────────────
drop policy if exists "documents_insert_own_firm" on storage.objects;
create policy "documents_insert_own_firm" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.get_my_firm_id()::text
  );

-- ── 7. Drop stale policies on the unused capital-D bucket ───
drop policy if exists "Authenticated upload 1cqvdzs_0" on storage.objects;
drop policy if exists "Authenticated upload 1cqvdzs_1" on storage.objects;

-- ── 8. Normalise legacy public URLs to storage paths ────────
update documents
set file_url = split_part(file_url, '/object/public/documents/', 2)
where file_url like '%/object/public/documents/%';

-- ── Verify ──────────────────────────────────────────────────
-- select id, public from storage.buckets;
-- select policyname, cmd, roles::text from pg_policies
--   where schemaname='storage' and tablename='objects';
-- select proname, proconfig from pg_proc p
--   join pg_namespace n on n.oid=p.pronamespace
--   where n.nspname='public' and proname like 'get_my_%';
