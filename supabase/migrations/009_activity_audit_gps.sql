-- Migration 009: Activity Tracking, Audit Logging, GPS Activity Detection
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Activity Events — user screen views and tap actions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles ON DELETE CASCADE,
  session_id  uuid        NOT NULL,
  screen_name text        NOT NULL,
  action      text        NOT NULL,   -- 'screen_view', 'screen_close', 'tap_add_mileage', etc.
  metadata    jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events; only service-role can read all
CREATE POLICY "activity_events: own insert"
  ON activity_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activity_events: own read"
  ON activity_events FOR SELECT
  USING (auth.uid() = user_id);

-- Index for querying by user + time range
CREATE INDEX IF NOT EXISTS idx_activity_events_user_time
  ON activity_events (user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Audit Logs — logins, CRUD operations, session tracking
--    Retention: 1 year (enforce via scheduled cleanup or pg_cron)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text        NOT NULL,   -- text to support 'anonymous' fallback
  action      text        NOT NULL,   -- 'login', 'logout', 'create', 'update', 'delete'
  resource    text        NOT NULL,   -- table or resource name
  resource_id text,                   -- ID of the affected row
  details     jsonb       NOT NULL DEFAULT '{}',
  session_id  uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert and read their own audit logs
CREATE POLICY "audit_logs: own insert"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "audit_logs: own read"
  ON audit_logs FOR SELECT
  USING (auth.uid()::text = user_id);

-- Index for querying by user + time range
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time
  ON audit_logs (user_id, created_at DESC);

-- Index for retention cleanup (rows older than 1 year)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON audit_logs (created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. GPS Drive Sessions — tracked driving sessions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gps_drive_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles ON DELETE CASCADE,
  start_lat        real        NOT NULL,
  start_lng        real        NOT NULL,
  start_accuracy   real,
  end_lat          real,
  end_lng          real,
  end_accuracy     real,
  start_time       timestamptz NOT NULL,
  end_time         timestamptz,
  distance_km      real        NOT NULL DEFAULT 0,
  duration_minutes integer     NOT NULL DEFAULT 0,
  status           text        NOT NULL DEFAULT 'active',  -- 'active' | 'completed'
  auto_detected    boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gps_drive_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gps_drive_sessions: own rows only"
  ON gps_drive_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. GPS Idle Stops — detected idle/waiting locations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gps_idle_stops (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles ON DELETE CASCADE,
  latitude         real        NOT NULL,
  longitude        real        NOT NULL,
  accuracy         real,
  arrival_time     timestamptz NOT NULL,
  departure_time   timestamptz,
  duration_minutes integer     NOT NULL DEFAULT 0,
  label            text,       -- e.g. 'Airport Queue', 'Downtown'
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gps_idle_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gps_idle_stops: own rows only"
  ON gps_idle_stops FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. GPS Detected Zones — auto-detected user zone from coordinates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gps_detected_zones (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles ON DELETE CASCADE,
  zone        text        NOT NULL,
  confidence  real        NOT NULL DEFAULT 0,
  latitude    real        NOT NULL,
  longitude   real        NOT NULL,
  detected_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gps_detected_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gps_detected_zones: own rows only"
  ON gps_detected_zones FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Audit log retention: scheduled cleanup (run via pg_cron or manual)
--    Delete audit_logs older than 1 year.
--    To enable automatic cleanup, run in Supabase SQL:
--
--    SELECT cron.schedule(
--      'cleanup-old-audit-logs',
--      '0 3 * * 0',  -- every Sunday at 3am
--      $$DELETE FROM audit_logs WHERE created_at < now() - interval '1 year'$$
--    );
-- ─────────────────────────────────────────────────────────────────────────────
