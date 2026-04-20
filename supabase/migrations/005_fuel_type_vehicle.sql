-- Migration 005: Fuel type per price entry + vehicle info on profiles
-- Run in Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Fuel type on gas price entries
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE gas_price_entries
  ADD COLUMN IF NOT EXISTS fuel_type text NOT NULL DEFAULT 'Regular';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Fuel type on driver fuel logs
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE fuel_logs
  ADD COLUMN IF NOT EXISTS fuel_type text NOT NULL DEFAULT 'Regular';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Vehicle info on driver profiles
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS vehicle_make  text,
  ADD COLUMN IF NOT EXISTS vehicle_model text,
  ADD COLUMN IF NOT EXISTS vehicle_year  int;
