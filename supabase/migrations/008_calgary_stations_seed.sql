-- Migration 008: Seed Calgary gas stations
-- These are used by the crawl-gas-prices Edge Function.
-- The crawler writes zone-average prices (from GasBuddy) to every station
-- in the Calgary zone. Run this before deploying the Edge Function.
--
-- RUN IN: Supabase SQL Editor

INSERT INTO gas_stations (id, name, address, zone, lat, lng, created_at) VALUES
  ('a1b2c3d4-e5f6-0000-0001-000000000001', 'Calgary NW — Petro-Canada',   '5090 Shaganappi Trail NW',   'Calgary', 51.1024, -114.1756, now()),
  ('a1b2c3d4-e5f6-0000-0002-000000000002', 'Calgary NE — Shell',           '3715 32 Ave NE',             'Calgary', 51.0821, -114.0072, now()),
  ('a1b2c3d4-e5f6-0000-0003-000000000003', 'Calgary SE — Petro-Canada',    '10234 Macleod Trail SE',     'Calgary', 50.9205, -114.0629, now()),
  ('a1b2c3d4-e5f6-0000-0004-000000000004', 'Calgary SW — Esso',            '8851 Macleod Trail SW',      'Calgary', 50.9634, -114.0891, now()),
  ('a1b2c3d4-e5f6-0000-0005-000000000005', 'Calgary Downtown — Husky',     '999 17 Ave SW',              'Calgary', 51.0384, -114.0846, now()),
  ('a1b2c3d4-e5f6-0000-0006-000000000006', 'Costco Calgary NE',            '55 Freeport Blvd NE',        'Calgary', 51.1285, -114.0052, now()),
  ('a1b2c3d4-e5f6-0000-0007-000000000007', 'Costco Calgary South',         '9650 Macleod Trail SE',      'Calgary', 50.9281, -114.0621, now()),
  ('a1b2c3d4-e5f6-0000-0008-000000000008', 'Calgary Airport — Esso',       '2000 Airport Rd NE',         'Calgary', 51.1215, -114.0110, now())
ON CONFLICT (id) DO NOTHING;
