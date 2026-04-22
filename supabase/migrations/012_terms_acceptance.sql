-- Migration 012: Terms & Conditions acceptance tracking on profiles
-- Adds terms_accepted, terms_accepted_at, terms_version columns.
-- Used by the onboarding gate: if terms_accepted = false, show OnboardingScreen.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted     boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version      int       NOT NULL DEFAULT 0;

-- Index for fast lookup of users who haven't accepted terms yet (admin use)
CREATE INDEX IF NOT EXISTS idx_profiles_terms_not_accepted
  ON profiles (terms_accepted)
  WHERE terms_accepted = false;
