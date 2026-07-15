-- =========================================================
-- CACP: Services & Documents Workflow Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- =========================================================

-- 1. Add financial_year to client_services
ALTER TABLE client_services
  ADD COLUMN IF NOT EXISTS financial_year TEXT;

-- 2. Add service tracking & reminder columns to doc_requests
ALTER TABLE doc_requests
  ADD COLUMN IF NOT EXISTS service_name     TEXT,
  ADD COLUMN IF NOT EXISTS financial_year   TEXT,
  ADD COLUMN IF NOT EXISTS reminder_days    INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_reminder    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ;

-- 3. Create firm_custom_documents table
--    Stores firm-specific document additions (persist across requests)
CREATE TABLE IF NOT EXISTS firm_custom_documents (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id       UUID REFERENCES firms(id) ON DELETE CASCADE NOT NULL,
  service_name  TEXT NOT NULL,
  document_name TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on firm_custom_documents
ALTER TABLE firm_custom_documents ENABLE ROW LEVEL SECURITY;

-- 5. RLS policy — firm members can read/write their own custom docs
DROP POLICY IF EXISTS "firm_members_custom_docs" ON firm_custom_documents;
CREATE POLICY "firm_members_custom_docs" ON firm_custom_documents
  FOR ALL USING (
    firm_id = (SELECT firm_id FROM users WHERE auth_id = auth.uid())
  );

-- Done! ✓
