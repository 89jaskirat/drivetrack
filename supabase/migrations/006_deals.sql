-- Migration 006: Promotions / Deals table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS deals (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor     text        NOT NULL,
  category    text        NOT NULL DEFAULT 'Other',  -- Mechanics | Gas | Insurance | Restaurants | Other
  headline    text        NOT NULL,
  detail      text        NOT NULL DEFAULT '',
  cta         text        NOT NULL DEFAULT 'Learn more',
  zone        text        NOT NULL DEFAULT 'Calgary',
  start_date  date        NOT NULL DEFAULT CURRENT_DATE,
  end_date    date,                                   -- NULL = no expiry
  active      bool        NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Drivers see only active deals within their zone where today is within date range
CREATE POLICY "Drivers can read active deals" ON deals
  FOR SELECT TO authenticated
  USING (
    active = true
    AND start_date <= CURRENT_DATE
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  );

-- Admins can manage all deals
CREATE POLICY "Admins can manage deals" ON deals
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('cityAdmin', 'superAdmin')));
