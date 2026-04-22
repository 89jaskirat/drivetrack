-- Gamification system: streaks, leaderboards, badges, engagement tracking
-- Commit: Gamification, Engagement & Leaderboard System

-- Streak tracking
CREATE TABLE driver_streaks (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_active_date date,
  grace_days_used int NOT NULL DEFAULT 0,
  grace_days_month int NOT NULL DEFAULT 0  -- YYYYMM format (e.g., 202604 for April 2026)
);

-- Leaderboard opt-in consent
CREATE TABLE leaderboard_consent (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  opted_in boolean NOT NULL DEFAULT false,
  opted_in_at timestamptz,
  opted_out_at timestamptz
);

-- Weekly leaderboard snapshots (anonymized, computed Sunday night)
CREATE TABLE weekly_leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone text NOT NULL,
  week_start date NOT NULL,          -- Always a Monday
  metric_type text NOT NULL,         -- 'fuel_efficiency' | 'distance'
  participant_count int NOT NULL,    -- Number of opted-in drivers who logged data this week
  percentile_10 numeric,             -- Metric value at 10th percentile
  percentile_25 numeric,             -- Metric value at 25th percentile
  percentile_50 numeric,             -- Metric value at 50th percentile (median)
  computed_at timestamptz DEFAULT now(),
  UNIQUE(zone, week_start, metric_type)
);

-- Per-driver weekly leaderboard result (for showing their percentile)
CREATE TABLE weekly_driver_results (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  metric_type text NOT NULL,
  metric_value numeric NOT NULL,    -- Their actual L/100km for fuel efficiency, km for distance
  percentile_band text NOT NULL,    -- 'top_10' | 'top_25' | 'top_50' | 'bottom_50'
  PRIMARY KEY (user_id, week_start, metric_type)
);

-- Driver badges (status only, no monetary value)
CREATE TABLE driver_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  badge_slug text NOT NULL,         -- 'fuel_saver' | 'clean_logs' | 'consistent_driver' | etc.
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_slug)       -- Each badge earned once per user
);

-- Weekly personal scorecards (JSONB snapshot)
CREATE TABLE weekly_scorecards (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  scorecard_data jsonb NOT NULL,    -- All metrics: earnings, fuel_efficiency, distance, sessions, expenses, profit_km, profit_hour, etc.
  log_completeness_score numeric NOT NULL DEFAULT 0,  -- 0-100
  PRIMARY KEY (user_id, week_start)
);

-- Monthly "Wrapped" style reports
CREATE TABLE monthly_reports (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  year_month int NOT NULL,           -- YYYYMM format (e.g., 202604 for April 2026)
  report_data jsonb NOT NULL,        -- Full report snapshot
  generated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, year_month)
);

-- Community post engagement tracking
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count int NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS save_count int NOT NULL DEFAULT 0;

CREATE TABLE post_saves (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- Multiple vehicle support
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year int,
  nickname text,
  odometer_baseline numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_vehicle_id uuid REFERENCES vehicles(id);

-- Add vehicle_id foreign keys to tracking tables
ALTER TABLE mileage_logs ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES vehicles(id);
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES vehicles(id);
ALTER TABLE drive_sessions ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES vehicles(id);

-- Row-level security (RLS) policies

-- driver_streaks: users can only see their own
ALTER TABLE driver_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own streak" ON driver_streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON driver_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- leaderboard_consent: users can only see and manage their own
ALTER TABLE leaderboard_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own consent" ON leaderboard_consent
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own consent" ON leaderboard_consent
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consent" ON leaderboard_consent
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- weekly_leaderboard_snapshots: public read (anonymized), no user IDs stored
ALTER TABLE weekly_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Snapshots are public" ON weekly_leaderboard_snapshots
  FOR SELECT USING (true);

-- weekly_driver_results: users can only see their own
ALTER TABLE weekly_driver_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own results" ON weekly_driver_results
  FOR SELECT USING (auth.uid() = user_id);

-- driver_badges: public read (badges on profile), users can only earn
ALTER TABLE driver_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all badges" ON driver_badges
  FOR SELECT USING (true);

-- weekly_scorecards: users can only see their own
ALTER TABLE weekly_scorecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scorecard" ON weekly_scorecards
  FOR SELECT USING (auth.uid() = user_id);

-- monthly_reports: users can only see their own
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own report" ON monthly_reports
  FOR SELECT USING (auth.uid() = user_id);

-- post_saves: users can only see/manage their own
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saves" ON post_saves
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts" ON post_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave posts" ON post_saves
  FOR DELETE USING (auth.uid() = user_id);

-- vehicles: users can only see/manage their own
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_driver_streaks_user_id ON driver_streaks(user_id);
CREATE INDEX idx_leaderboard_consent_opted_in ON leaderboard_consent(opted_in, user_id);
CREATE INDEX idx_weekly_snapshots_zone_week ON weekly_leaderboard_snapshots(zone, week_start, metric_type);
CREATE INDEX idx_driver_results_zone_week ON weekly_driver_results(user_id, week_start);
CREATE INDEX idx_badges_user_id ON driver_badges(user_id);
CREATE INDEX idx_badges_slug ON driver_badges(badge_slug);
CREATE INDEX idx_scorecard_user_week ON weekly_scorecards(user_id, week_start);
CREATE INDEX idx_monthly_reports_user_month ON monthly_reports(user_id, year_month);
CREATE INDEX idx_post_saves_user_post ON post_saves(user_id, post_id);
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);

-- Comments
COMMENT ON TABLE driver_streaks IS 'Daily streak tracking with grace days (3/month). Motivates consistent app usage.';
COMMENT ON TABLE leaderboard_consent IS 'Explicit opt-in for zone leaderboards. PIPEDA-compliant, revocable at any time.';
COMMENT ON TABLE weekly_leaderboard_snapshots IS 'Anonymized weekly leaderboard snapshots (percentile bands only). No user IDs or earnings data stored.';
COMMENT ON TABLE weekly_driver_results IS 'Per-driver weekly result for leaderboard display. Shows driver their percentile and metric value.';
COMMENT ON TABLE driver_badges IS 'Status badges (Fuel Saver, Clean Logs, etc). Visible on profile, no monetary value.';
COMMENT ON TABLE weekly_scorecards IS 'Private weekly recap: earnings, efficiency, distance, sessions, completeness score. Delivered Mondays.';
COMMENT ON TABLE monthly_reports IS 'Monthly Wrapped-style report: earnings, trends, badges earned, best days, etc. Delivered on 1st of month.';
COMMENT ON TABLE post_saves IS 'Community post save feature for engagement-weighted feed ranking.';
COMMENT ON TABLE vehicles IS 'Multi-vehicle support. Drivers can track multiple cars separately.';
