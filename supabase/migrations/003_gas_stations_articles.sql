-- Migration 003: Gas stations, gas price entries, and knowledge articles
-- Run this in the Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Gas stations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gas_stations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  address    text        NOT NULL,
  zone       text        NOT NULL,
  lat        real,
  lng        real,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gas_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gas stations readable by authenticated users" ON gas_stations
  FOR SELECT TO authenticated USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Gas price entries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gas_price_entries (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id      uuid        NOT NULL REFERENCES gas_stations ON DELETE CASCADE,
  price_per_litre real        NOT NULL,
  date            text        NOT NULL,
  recorded_by     uuid        REFERENCES auth.users ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gas_price_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gas prices readable by authenticated users" ON gas_price_entries
  FOR SELECT TO authenticated USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Knowledge articles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  body        text        NOT NULL,
  category    text        NOT NULL DEFAULT 'Tips',
  author_name text        NOT NULL DEFAULT 'Admin',
  published   bool        NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles readable by authenticated users" ON knowledge_articles
  FOR SELECT TO authenticated USING (published = true);
