-- =========================================================
-- CACP: Public Upload Access (No-login document upload)
-- Run this in Supabase SQL Editor after SERVICES_MIGRATION.sql
-- =========================================================

-- 1. Allow anonymous users to read doc_requests
--    (Client needs to know the UUID to fetch their specific request)
CREATE POLICY "anon_read_pending_requests" ON doc_requests
  FOR SELECT TO anon
  USING (status = 'pending');

-- 2. Allow anonymous users to mark a request as uploaded
CREATE POLICY "anon_update_request_to_uploaded" ON doc_requests
  FOR UPDATE TO anon
  USING (status = 'pending')
  WITH CHECK (status = 'uploaded');

-- 3. Allow anonymous users to read firm name (for upload page branding)
CREATE POLICY "anon_read_firms" ON firms
  FOR SELECT TO anon
  USING (true);

-- 4. Allow anonymous document record inserts (for upload page)
CREATE POLICY "anon_insert_documents" ON documents
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM doc_requests
      WHERE id = request_id AND status = 'pending'
    )
  );

-- 5. Allow anonymous storage uploads to documents bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anon_upload_to_documents" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'documents');

-- 6. Allow storage reads (for uploaded file URL verification)
CREATE POLICY "anon_read_documents_storage" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'documents');

-- Done! ✓
-- The upload link format is: https://your-app.vercel.app/?upload=<doc_request_id>
