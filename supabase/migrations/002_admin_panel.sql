-- Migration 002: Admin Panel — Schema hardening + moderation support
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Fix role self-escalation and zone self-assignment
--    The original UPDATE policy allowed users to write any column, including
--    role and zone. The new policy locks those fields to their current values.
--    Admin writes (role/zone changes) go via the service-role key which
--    bypasses RLS entirely — no additional admin policy needed.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;

CREATE POLICY "Users can update safe profile fields" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- role and zone are immutable by the user; only service-role (admin) can change them
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND zone = (SELECT zone FROM profiles WHERE id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Zones table (admin-managed, replaces hardcoded seed array in the app)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zones (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  city       text NOT NULL,
  active     bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial zones (idempotent)
INSERT INTO zones (name, city) VALUES
  ('Calgary',   'Calgary'),
  ('Edmonton',  'Edmonton'),
  ('Red Deer',  'Red Deer')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read zones; only service-role can insert/update/delete
CREATE POLICY "Zones are publicly readable" ON zones
  FOR SELECT TO authenticated USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Add moderation columns to posts and comments
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS is_deleted        bool    NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderated_by      uuid    REFERENCES auth.users ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_reason text;

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS is_deleted        bool    NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderated_by      uuid    REFERENCES auth.users ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_reason text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Admin audit log
--    Written by the admin panel via service-role key. No user-facing policies.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid        NOT NULL REFERENCES auth.users ON DELETE SET NULL,
  action       text        NOT NULL,  -- e.g. 'update_user_role', 'delete_post'
  target_table text,                  -- e.g. 'profiles', 'posts'
  target_id    uuid,                  -- the row that was affected
  details      jsonb,                 -- before/after or extra context
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- No RLS policies — service-role key only (admin panel uses service-role)
