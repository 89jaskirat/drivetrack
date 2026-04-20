-- Migration 007: Remote Config + Feature Flags
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS app_config (
  key        text        PRIMARY KEY,
  value      jsonb       NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read config
CREATE POLICY "App config is publicly readable" ON app_config
  FOR SELECT TO authenticated USING (true);

-- Only admins can write config (via admin panel service-role key, which bypasses RLS,
-- but this policy also covers anon-key admin scenarios)
CREATE POLICY "Admins can manage app config" ON app_config
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin')));

-- Seed default values
INSERT INTO app_config (key, value) VALUES
  ('feature_flags', '{
    "community_search": true,
    "deals_banner": true,
    "fuel_type_picker": true
  }'),
  ('home_config', '{
    "show_gas_carousel": true,
    "show_community_pulse": true,
    "snapshot_metrics": ["distance", "earnings", "fuel", "l100km"]
  }')
ON CONFLICT (key) DO NOTHING;
