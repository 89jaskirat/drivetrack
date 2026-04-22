# Feature Backlog

Last updated: 2026-04-21

This file tracks deferred features, future enhancements, and known items not yet implemented.
Items are organized by priority tier and tagged with their PRD phase where applicable.

---

## Tier 1 — High Priority (Next Sprint)

### GPS: Auto Zone Detection (Priority 1)
- Detect user's zone from GPS coordinates on app open
- Match lat/lng to nearest zone (Calgary, Edmonton, Red Deer)
- Auto-set profile zone with user confirmation
- Requires `expo-location` permission + consent flow
- **DB table ready:** `gps_detected_zones` (migration 009)

### GPS: Drive Session Tracking (Priority 2)
- Track start/end location, route, duration, distance
- Auto-start when motion detected (background location)
- Auto-stop after idle threshold
- **DB table ready:** `gps_drive_sessions` (migration 009)
- Battery optimization needed (significant drain risk — PRD risk item)

### GPS: Automatic Trip Logging (Priority 3)
- Detect driving starts/stops from accelerometer + GPS
- Create mileage log entries automatically
- Deduplication with manual entries
- Requires background task (expo-task-manager)

### iOS App — Build, Compliance and App Store Submission
- **Apple Developer Program** — enroll at developer.apple.com ($99 USD/year); required before any iOS build or TestFlight distribution
- **Apple Sign-In — MANDATORY** (App Store Guideline 4.8): any app offering a third-party login (Google OAuth) must also offer Sign in with Apple. Currently in Tier 3 — must be promoted; this blocks App Store approval. See `src/screens/AuthScreen.tsx`
- **Google OAuth iOS client ID** — current `app.json` only has `googleWebClientId`; add a separate iOS OAuth 2.0 client ID in Google Cloud Console; add `googleIosClientId` to `app.json extra` and configure `expo-auth-session` / `expo-google-sign-in` for iOS
- **iOS permission strings** — add to `app.json` under `ios.infoPlist`:
  - `NSLocationWhenInUseUsageDescription` (zone detection)
  - `NSLocationAlwaysAndWhenInUseUsageDescription` (background GPS sessions)
  - `NSMicrophoneUsageDescription` (currently declared in Android permissions but missing iOS string)
  - Camera and photo library already handled via `expo-image-picker` plugin ✓
- **App Store Connect setup** (one-time):
  - App name, subtitle (30 chars), description, keywords (100 chars), support URL, marketing URL
  - Privacy Policy public URL (required — no account creation without it)
  - Primary category: Productivity or Utilities
  - Age Rating questionnaire — Apple requires responses by Jan 31, 2026; DriveTrack is likely 4+
  - Privacy Nutrition Labels — declare all data types collected (per Privacy Policy); must be accurate or Apple will reject
  - AI Transparency disclosure (Nov 2025 Apple requirement) — required if any AI/LLM features are added
- **Store assets — iOS:**
  - App icon: 1024×1024 PNG, no alpha channel — verify current `assets/icon.png` meets spec
  - Screenshots required: iPhone 6.7" (mandatory), iPhone 6.5", iPad Pro 12.9" (mandatory since `supportsTablet: true` in `app.json`)
  - iPad must be tested on device or simulator — Apple rejects if iPad layout is broken even if you don't target iPad
- **TestFlight:**
  - Set up internal testing group (up to 100 testers, no review needed)
  - External TestFlight: submit for Beta App Review before opening to external testers
  - Run at minimum 14 days of testing before App Store submission
- **EAS build and submit:**
  - Configure EAS credentials (provisioning profile + distribution certificate) via `eas credentials`
  - Update `eas.json` production iOS profile to specify `credentialsSource: remote`
  - Configure `eas.json submit.production` with `appleId`, `ascAppId`, `appleTeamId`
  - SDK requirement: submissions after April 2026 must use iOS 26 SDK — ensure Expo SDK version supports this
- **App review demo account** — Apple reviewers need a working demo login; provide test credentials in App Store Connect notes

### Legal Documents — T&C, Privacy Policy, Community Guidelines (Priority 4 — Launch Blockers)
- Three documents drafted in `docs/` — all require Canadian legal review and French translation before launch
- **`docs/TERMS_AND_CONDITIONS.md`** — covers eligibility, data collection (PIPEDA), location consent, UGC, moderation, third-party disclaimer, limitation of liability, indemnification, data breach liability exclusion, governing law (Ontario / Quebec fallback)
- **`docs/PRIVACY_POLICY.md`** — standalone PIPEDA-compliant policy covering what is collected, why, retention periods, user rights (access, correction, deletion), cross-border transfers, Quebec Law 25 / Bill 64 rights
- **`docs/COMMUNITY_GUIDELINES.md`** — plain-language rules for forum conduct, moderation tiers, gas price integrity, appeals process, moderator liability scope
- **Legal review checklist (all three docs):**
  - [ ] Retain Canadian legal counsel for review
  - [ ] Fill in operator legal name, address, privacy officer email in all docs
  - [ ] Set effective dates
  - [ ] French translation (mandatory for Quebec — Bill 96 / Charter of the French Language)
  - [ ] Publish Privacy Policy at a public URL (required by Apple App Store and Google Play)
- **In-app implementation needed:**
  - Privacy Policy and T&C must be accessible as static in-app screens (no internet required)
  - Community Guidelines accessible from the Community tab header
  - Privacy Policy URL submitted to App Store / Play Store listings

### Terms and Conditions Acceptance (Priority 4 — Blocker)
- Users must accept Terms and Conditions before completing sign-in/onboarding — hard gate, no bypass
- T&C acceptance screen shown immediately after authentication, before onboarding steps
- User must scroll to the bottom before the "Accept" button becomes active (prevents blind acceptance)
- "Decline" logs the user out and clears the session
- Draft T&C document created: `docs/TERMS_AND_CONDITIONS.md` — **must be reviewed by Canadian legal counsel before launch**
- **T&C covers:** account eligibility, data collection (PIPEDA compliant), location data consent, community moderation, user-generated content, third-party platform disclaimer, limitation of liability, indemnification, data breach liability exclusion, moderation liability exclusion, governing law (Ontario / Quebec fallback)
- **DB changes needed:**
  - `profiles`: add `terms_accepted_at timestamptz` (null = not accepted; populated on acceptance)
  - `profiles`: add `terms_version text` (stores which version was accepted, e.g. `'1.0'`)
  - Audit log event on acceptance (user_id, terms_version, timestamp, IP if available)
- **Re-acceptance required** when T&C version changes — detected on login by comparing `profiles.terms_version` to current app version constant
- Privacy Policy (separate doc, referenced in T&C) also required — to be drafted
- Community Guidelines (separate doc) also required — to be drafted
- **Legal review checklist before launch:**
  - [ ] Retain Canadian legal counsel for review
  - [ ] Fill in operator legal name, address, and contact email in `docs/TERMS_AND_CONDITIONS.md`
  - [ ] Set effective date
  - [ ] French translation for Quebec compliance
  - [ ] Publish as in-app static screen and on a public URL (App Store / Play Store require a public privacy policy URL)

### User Onboarding Flow (Priority 4)
- Triggered on first login when profile is incomplete (detect via `profile.name == ''` or new `onboarding_complete boolean` column)
- Multi-step modal flow:
  1. Welcome + name entry (required)
  2. Phone number (optional)
  3. Car make, model, year (free-text; maps to existing `vehicle_make`, `vehicle_model`, `vehicle_year` columns)
  4. Zone selection (manual dropdown of active zones from `zones` table + "None of the above")
- Location permission requested on zone selection step
  - If granted: calculate distance from each zone's city center (requires adding `lat` + `lng` columns to `zones` table)
  - If nearest zone is within 100 km: offer auto-assignment with user confirmation
  - User can always override with manual selection
- Out-of-zone users select "None of the above" → `profile.zone` set to `'Unassigned'`
- On completion: mark `onboarding_complete = true`, dismiss modal, proceed to Home tab
- **DB changes needed:**
  - `profiles`: add `onboarding_complete boolean NOT NULL DEFAULT false`
  - `zones`: add `lat double precision`, `lng double precision` (city center coordinates)
  - Seed lat/lng for existing zones: Calgary (51.0447, -114.0719), Edmonton (53.5461, -113.4938), Red Deer (52.2681, -113.8112)
- **Depends on:** `expo-location` (already in backlog under GPS Priority 1)

### IP Address Logging in Audit
- Capture user IP on login for audit_logs
- Requires server-side component (Supabase Edge Function or proxy)
- Mobile clients don't have reliable self-IP detection
- Edge function approach: `supabase.functions.invoke('get-client-ip')`

### Daily Streak System (Priority 9)
- Track consecutive days where a driver logs at least one entry (mileage, fuel, expense, or session)
- Grace days: each driver gets **3 grace days/month** — a missed day uses a grace day instead of breaking the streak
- Grace day counter resets on the 1st of each month
- DB columns: `current_streak int`, `longest_streak int`, `last_active_date date`, `grace_days_used int`, `grace_days_month int` (year-month of last reset)
- Visual: streak flame counter on home screen; "3 grace days remaining this month" shown subtly
- Push notification: "Don't lose your 14-day streak — add today's log" (sent at 8pm if no entry logged that day)
- **DB table needed:** `driver_streaks` (see migration)
- **Depends on:** Supabase migrations

---

## Tier 2 — Medium Priority (Phase 2 per PRD)

### Collapsible Forum Threads (Reddit-style)
- Tap a comment/reply to collapse its entire subtree
- Visual indicator (collapsed count, e.g. "▶ 3 replies hidden")
- Long-press or swipe to collapse from any depth
- Collapsed state persists for the session (not synced to DB)
- Requires refactor of `RedditThreadCard` comment tree rendering

### Weekly Personal Scorecard (Priority 10)
- Every Monday morning, each driver receives a personal recap of the prior week
- Includes: total earnings (private), fuel efficiency, distance logged, sessions, expenses, profit/km, profit/hour, log completeness score, zone percentile (if opted in), week-over-week delta
- Delivered via push notification + in-app card on home screen
- No comparison to other users — purely personal insight
- **DB table needed:** `weekly_scorecards` (JSONB snapshot per user per week)
- **Computation:** Supabase Edge Function or scheduled query Sunday night → Monday 8am

### Zone Leaderboard — Fuel Efficiency (Priority 11)
- **Scope:** Driver's zone only (e.g., c/Calgary). No national/global ranking at launch
- **Metric:** Best average fuel efficiency (L/100km) for the week, grouped by vehicle make/model
- **Privacy design:**
  - Explicit opt-in required — consent screen shown once, revocable anytime in Settings
  - Display format: percentile bands only — Top 10%, Top 25%, Top 50%. No position numbers, no usernames
  - Minimum 10 opted-in drivers in zone must contribute that week; otherwise show "Not enough participants"
  - Driver sees their own percentile band and raw L/100km number privately
- **Leaderboard consent screen:** "Join weekly zone rankings using your logged fuel, mileage, session, and earnings metrics. Your name and profile are never shown. You can leave at any time."
- Week runs Mon 00:00 → Sun 23:59 in zone's local timezone. Snapshots computed Sunday night
- **DB tables needed:** `leaderboard_consent`, `weekly_leaderboard_snapshots`, `weekly_driver_results`
- **Legal notes:** PIPEDA-compliant, anonymized at database level, 10-driver minimum threshold prevents de-anonymization in small zones

### Private Earnings Percentile (Priority 12)
- Not a public leaderboard — purely private, shown only in driver's personal scorecard
- Format: "You're in the top 18% of Calgary drivers for earnings/hour this week" or "Your weekly earnings rank: 24 of 186 participating Calgary drivers"
- Uses same opted-in pool as fuel efficiency leaderboard (no separate consent)
- Never shows raw dollar amounts in comparative context
- Earnings data never stored in snapshot table — computed at read time, result discarded after display
- **Safeguard:** No earnings information persists in any shared/leaderboard table

### Log Completeness Score & Rewards (Priority 13)
- Each week, score completeness of driver's logs (0–100%):
  - Mileage logged: 30 pts
  - At least one fuel fill-up logged: 25 pts
  - Earnings logged: 30 pts
  - At least one expense logged: 15 pts
- Score shown on home screen and weekly scorecard
- 100% completeness for 4 consecutive weeks → "Clean Logs" badge
- Encourages app opens without pushing drivers to work more hours
- **DB column:** `weekly_log_completeness float` on `weekly_scorecards`

### Badges System (Priority 14)
- Status badges only — no prizes, no money, no real-world rewards
- Badges visible on driver's profile
- Badge ideas:
  - **Fuel Saver** — Top 25% fuel efficiency in zone for 2+ weeks
  - **Clean Logs** — 100% completeness score for 4 consecutive weeks
  - **Consistent Driver** — 30-day streak
  - **Weekly Finisher** — Completed full scorecard week (all 4 log types) for 8 weeks
  - **Profit Climber** — Improved profit/km week-over-week for 4 consecutive weeks
  - **Century Driver** — Logged 100 sessions total
  - **Zone Regular** — Active in zone community (posted or commented) for 4+ weeks
- **DB table needed:** `driver_badges` (user_id, badge_slug, earned_at)

### Community Feed Algorithm — Engagement-Weighted (Priority 15)
- Replace recency-only ranking with weighted engagement score
- Score formula: `score = upvotes × 2 + views × 0.1 + saves × 3 + comment_velocity × 5`
  - `comment_velocity` = comments in last 6 hours
  - Score decays exponentially (half-life ~48h)
- Zone posts shown first, then c/Canada posts
- Future personalization (Phase 3): per-user feed history
- **DB columns needed on `posts`:** `view_count int DEFAULT 0`, `save_count int DEFAULT 0`
- **DB table needed:** `post_saves` (user_id, post_id, saved_at)

### Most Distance Logged — Future Leaderboard Category (Priority 16)
- Add "most distance logged" as a second leaderboard category, behind fuel efficiency
- Framed as "Most Distance Logged" not "Most Driven" to avoid encouraging overwork
- Same privacy rules as fuel efficiency: opt-in, zone-only, percentile bands, 10-driver minimum
- Defer implementation to Phase 2 rollout; launch fuel efficiency first, add distance as second category

### Badges Visible Next to Username (Priority 17)
- Display earned badges as small icons next to username in community posts (top of each comment/post)
- Show top 2-3 most recent badges, with "+" indicator if more exist
- Badges clickable → opens user profile with full badge gallery
- **Depends on:** Badges System, Community section rendering

### User Badge Gallery & Profile Section (Priority 18)
- New "Badges" tab in user Profile screen shows:
  - **Earned Badges** section: all badges user has earned with earned_at date
  - **Upcoming Badges** section: badges user can aim for with progress indicators (e.g. "15/30 days toward Consistent Driver")
  - Badge descriptions on tap
- Admin can see badges on user profile view
- **Depends on:** Badges System

### Push Notifications — Configurable (Priority 19)
- User can enable/disable notifications in Settings:
  - Daily reminder to add mileage (time customizable)
  - New community posts in zone
  - New lowest gas prices alert
  - New promotional deals
  - Conversation replies (if following thread)
  - New follower notifications
- Default: off (explicit opt-in)
- **DB table needed:** `notification_preferences` (user_id, notification_type, enabled, time_of_day)
- **Depends on:** Push Notifications infrastructure, Settings screen

### Follow Conversations & Receive Notifications (Priority 20)
- User can "Follow" a conversation (post or comment thread)
- Receives push notification when someone replies to that thread
- Notification includes the reply text and replier name
- User can view all followed conversations in a dedicated "Following" tab
- Can unfollow anytime
- **DB table needed:** `user_follows_conversation` (user_id, post_id, comment_id, followed_at)
- **Depends on:** Push Notifications, Notification preferences

### Public User Profiles & Follow Users (Priority 21)
- Each user has a public profile accessible by tapping their username
- Profile shows:
  - Username + avatar (if available)
  - Zone + joining date
  - All earned badges (visible to everyone)
  - Recent posts count + best rated post
  - Option to "Follow" user
- Following user gets notified when they post a new comment (configurable)
- User can view their followers list
- **DB table needed:** `user_follows` (follower_user_id, following_user_id, followed_at)
- **Depends on:** User profiles, Badges, Push Notifications

### Nested Replies Support (Priority 23)
- Enable users to reply to replies (3-4 levels deep)
- Fix: replies are currently flattened when fetched after app restart
- Solution: add `parent_id` field to replies table (migration 011), update sync logic to recursively nest
- Supports multi-level comment threads like Reddit
- **DB changes:** `replies.parent_id uuid references replies(id)`
- **Code fix:** syncService.ts buildReplyTree() recursive function

### GPS: Idle/Waiting Detection (Priority 24)
- Detect idle time at known spots (airport queue, downtown hotspots)
- Track arrival/departure time, duration
- Label common locations
- **DB table ready:** `gps_idle_stops` (migration 009)

### Community Sub-Forums (Reddit-style)
- Each zone gets its own sub-forum automatically when the zone is created (e.g. c/Calgary, c/Edmonton, c/RedDeer)
- A global c/Canada sub-forum exists for all users regardless of zone
- Implemented as a `sub_forum` slug column on `posts` — no separate sub-forums table needed
- Community screen gains a horizontal chip/tab bar to switch between sub-forums; default view merges all subscribed sub-forums (like Reddit home feed)
- User sub-forum membership:
  - Auto-subscribed to their zone sub-forum + c/Canada on onboarding completion
  - Out-of-zone (Unassigned) users: only see c/Canada
  - Users can browse any sub-forum but can only post to ones they belong to
- **DB changes needed:**
  - `posts`: add `sub_forum text NOT NULL DEFAULT 'canada'`; backfill existing posts from `zone` column
  - `user_sub_forums` join table: `user_id uuid`, `sub_forum text` (tracks subscriptions)
- **Depends on:** User Onboarding Flow (zone assignment), Out-of-Zone User Handling

### Out-of-Zone User Handling
- Users outside all defined zones are assigned `profile.zone = 'Unassigned'` during onboarding
- `'Unassigned'` is a reserved value — filtered out of zone dropdowns shown to regular users
- Unassigned users retain full access to: expense tracking, mileage logs, fuel logs, gas prices (national view), c/Canada sub-forum
- Unassigned users have no access to: zone sub-forum (c/Calgary etc.), zone-specific deals/promos
- **Admin tooling:**
  - New admin view: "Out-of-Zone Users" — lists all `zone = 'Unassigned'` users with their GPS-detected approximate city (from `gps_detected_zones` table)
  - Admin can create a new zone and bulk-assign selected out-of-zone users to it (triggers zone row creation + sub-forum slug + profile bulk update)
  - Admin can also manually assign individual out-of-zone users to an existing zone
  - "Out of Zone" badge shown on user rows in admin user list
- **DB changes needed:**
  - RLS policies: ensure `'Unassigned'` is handled (no zone-filter writes by the user)
  - Admin service-role function: `assign_zone_to_users(user_ids uuid[], zone_name text)`
- **Depends on:** User Onboarding Flow

### Multi-Language Support (i18n)
- **Phase 1 — Legal requirement:** English (default) + French
  - Quebec's Bill 96 / Charter of the French Language requires French to be offered to Quebec users. Any enterprise serving Quebec consumers must make French available and must not display another language more prominently than French
  - French translations required for: all UI strings, T&C, Privacy Policy, Community Guidelines, push notifications, and email communications
- **Phase 2 — Growth languages:** Punjabi, Hindi, Spanish (large driver communities in Calgary, Edmonton, GTA, Vancouver)
- **Technical approach:**
  - Add `expo-localization` (reads device locale) + `react-i18next` + `i18next` for string management
  - Extract all hardcoded UI strings into locale JSON files (e.g. `locales/en.json`, `locales/fr.json`)
  - Language auto-detected from device locale on first launch; user can override in Profile settings
  - Locale stored in `profiles.locale` column (e.g. `'en'`, `'fr'`, `'pa'`)
  - RTL support consideration for future languages (Arabic, Urdu) — `I18nManager.forceRTL()`
- **Scope of work:**
  - All screen labels, buttons, error messages, toast notifications
  - Onboarding flow strings (T&C acceptance, zone selection prompts, location permission rationale)
  - Community-generated content is NOT translated (user posts remain in the language posted)
  - Legal documents (T&C, Privacy Policy) must have separate translated versions — not machine-translated
  - Gas price units and number formatting (e.g. decimal separator) should respect locale
- **DB changes needed:**
  - `profiles`: add `locale text NOT NULL DEFAULT 'en'`
- **Depends on:** Legal documents (French translation of T&C / Privacy Policy before Phase 1 ships)

### Bank Integration
- Connect bank accounts via Plaid or Flinks
- Auto-import earnings from Uber/Lyft deposits
- Auto-categorize transactions
- **PRD Phase 2**

### Advanced Analytics Dashboard
- Mileage trends (daily/weekly/monthly charts)
- Fuel efficiency over time
- Profit insights with breakdowns
- Earnings per hour metric (requires shift data)
- Expense vs earnings correlation
- **PRD Phase 2**

### Promotions Engine
- Admin-created promotional campaigns
- Zone targeting, date range, priority ranking
- Impression/CTR/conversion analytics
- Revenue tracking (pay-per-click, pay-per-lead)
- Sponsored forum posts
- **PRD Phase 2**

### CSV/PDF Expense Import
- Parse CSV files for bulk expense import
- Screenshot/PDF parsing for Uber statements
- Auto-categorization
- **PRD §3.5**

### Admin Analytics View
- User growth metrics
- Engagement metrics (DAU, MAU, session length)
- Zone performance comparison
- **PRD §9**

---

## Tier 3 — Lower Priority (Phase 3 / Future per PRD)

### Monthly "Wrapped" Report (Priority 18)
- Delivered on the 1st of every month (push notification + in-app full-screen experience)
- Showcases: total earnings (private), total distance, fuel efficiency trend vs previous month, best day of week for earnings, best single session, average vs zone average (fuel efficiency only), most efficient vehicle (if multi-vehicle enabled), most used expense category, streak milestones, badges earned
- Shareable summary card (opt-in): sensitive numbers blurred by default; driver can reveal before sharing
- **DB table needed:** `monthly_reports` (user_id, year_month, report_data JSONB)
- Monthly computation via Supabase pg_cron on last day of month at 23:50 UTC

### Multiple Vehicle Support (Priority 19)
- **Promote existing Tier 3 "Multi-Vehicle Support" and expand**
- Drivers can add multiple vehicles (make, model, year, odometer baseline per vehicle)
- All logs (mileage, fuel, sessions) tagged with active vehicle
- Analytics split per vehicle — efficiency, expense totals, profit/km per car
- Monthly Wrapped shows "Most efficient vehicle this month"
- **DB changes:** `vehicles` table (id, user_id, make, model, year, nickname, created_at); `active_vehicle_id` FK on `profiles`; vehicle_id FK on `mileage_logs`, `fuel_logs`, `drive_sessions`

### Better Weekly Analytics (Priority 20)
- Expand analytics/dashboard screen with:
  - Profit/hour trend (week-over-week chart)
  - Profit/km trend
  - Fuel cost/km
  - Best day of week (by earnings)
  - Best single session of the week
  - Earnings by platform (Uber/Lyft/etc — manually tagged)
  - Zone percentile for fuel efficiency (if opted in)
- All data sourced from driver's own logs — no external APIs

### Anti-Cheat (Future Scope — Priority 21)
- MVP relies on self-reported data
- Future: GPS support for mileage validation, outlier detection (impossible distances/efficiency), bank/import verification cross-check, suspicious pattern flags (admin view)
- No implementation now — note for future audit system

### AI Insights
- Spending pattern analysis
- Optimal driving hour recommendations
- Fuel efficiency tips based on driving patterns
- Predictive earnings forecasting
- **PRD Phase 3**

### Tax Automation
- Auto-generate CRA T2125 form
- Calculate business-use percentage from mileage logs
- HST/GST filing assistance
- **PRD Phase 3**

### Smart Trip Detection
- GPS + accelerometer fusion for trip detection
- Distinguish rideshare trips from personal driving
- Auto-tag trips by platform
- **PRD Phase 3**

### Multi-Platform Driver Support
- Track earnings from Uber, Lyft, DoorDash, Skip, etc.
- Unified dashboard across platforms
- Platform-specific analytics
- **PRD Future**

### Predictive Analytics
- Surge prediction by zone/time
- Demand forecasting
- Optimal repositioning suggestions
- **PRD Future**

### Maintenance Tracking
- Service schedule reminders (oil, tires, brakes)
- Cost tracking per service type
- Mileage-based alerts
- **PRD Future**

### Gamification
- Driver achievements/badges
- Weekly leaderboards (earnings, efficiency)
- Streak tracking
- **PRD Future**

### Multi-Vehicle Support
- Track multiple vehicles per driver
- Separate mileage/fuel logs per vehicle
- **PRD Open Question**

### Apple Sign-In
- ⚠️ **Promoted to Tier 1** — mandatory per App Store Guideline 4.8; any app with third-party login (Google OAuth) must also offer Sign in with Apple. See iOS App entry in Tier 1.
- Add Apple login option alongside Google OAuth in `src/screens/AuthScreen.tsx`
- **PRD §3.2**

### MFA Support
- Multi-factor authentication
- TOTP or SMS-based
- **PRD §3.2**

---

## Tier 4 — Infrastructure / DevOps

### Google Play Store — Launch Compliance
- **Google Play Console account** — register at play.google.com/console ($25 USD one-time fee)
- **Target API level** — all submissions after August 31, 2025 must target Android 15 (API 35); verify `compileSdkVersion` and `targetSdkVersion` in the Expo/Gradle config are at 35
- **Storage permissions audit** — `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` are deprecated in Android 13+ (API 33+); replace with `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` as appropriate in `app.json android.permissions`; `RECORD_AUDIO` needs justification in the Data Safety form
- **Data Safety form** — mandatory in Play Console; declare every data type collected (location, name, email, financial info, device IDs), whether it is shared with third parties, purpose, and whether it is encrypted. Must match `docs/PRIVACY_POLICY.md` exactly
- **Closed testing requirement** — Google requires at least 12 testers enrolled and 14 consecutive days of closed testing before promoting to production. Plan this into the release timeline
- **Store listing assets — Android:**
  - App icon: 512×512 PNG (already have adaptive icon in `assets/adaptive-icon.png` — verify size ✓)
  - Feature graphic: 1024×500 PNG (required; not currently created)
  - Phone screenshots: minimum 2, 16:9 or 9:16 ratio
  - Tablet screenshots: recommended (7" and 10")
- **Content rating** — complete the IARC questionnaire in Play Console; DriveTrack is likely rated Everyone (E)
- **Privacy Policy URL** — must be publicly accessible before submission; paste URL into Play Console store listing and Data Safety form
- **App category** — set to Tools or Finance
- **EAS Submit for Play Store** — configure `eas.json submit.production` with `serviceAccountKeyPath` (Google Play service account JSON) for automated AAB upload; AAB format already set in production profile ✓
- **App review demo account** — provide test credentials in Play Console release notes so reviewers can log in

### Dev / Preprod / Production Environments
- Create 3 separate Supabase projects: `drivetrack-dev`, `drivetrack-preprod`, `drivetrack-prod`
- Convert `app.json` → `app.config.js` to support dynamic env var injection at build time
- Per-environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_WEB_CLIENT_ID`
- Add 3 EAS build profiles in `eas.json`:
  - `dev`: channel=dev, distribution=internal, reads `.env.dev`
  - `preprod`: channel=preprod, distribution=internal, reads `.env.preprod`
  - `production`: existing profile, reads `.env.production`
- Migrate all secrets out of `app.json` into gitignored `.env.*` files; use EAS Secrets for CI/CD
- Run all DB migrations against each Supabase project; seed dev/preprod with anonymized test data
- Update Google OAuth redirect URIs + client IDs per environment in Google Cloud Console
- **Risk:** Each environment may require a separate Google OAuth client ID entry

### Audit Log Retention Automation
- Enable pg_cron for automatic audit_logs cleanup (>1 year)
- SQL provided in migration 009 (commented out — needs pg_cron enabled)

### Push Notifications
- Zone-specific notifications
- Gas price alerts
- Deal notifications
- Forum reply notifications

### Real-Time Updates
- Supabase real-time subscriptions for forum posts/comments
- Live gas price updates
- Presence indicators in community

### Offline Queue Retry
- Current sync is fire-and-forget with local queue
- Add exponential backoff retry for failed syncs
- Conflict resolution for simultaneous edits

### Error Monitoring
- Integrate Sentry or similar crash reporting
- Structured logging beyond console.warn
- Performance monitoring

### CI/CD Pipeline
- Automated EAS builds on merge to main
- Test suite (unit + integration)
- PR preview builds

### Geolocation Zone Auto-Assignment (Admin-Side)
- Define zone boundaries as polygons
- Point-in-polygon matching for GPS coordinates
- Currently zones are name-matched, not geo-fenced

---

## Deferred from Current Sprint

These items were discussed but explicitly deferred:

| Item | Reason | Revisit |
|------|--------|---------|
| IP address in audit logs | Needs server-side Edge Function | Next sprint |
| Geolocation zone auto-set | GPS infra not yet built | After GPS Priority 1 |
| Tax report tooltip (onboarding) | Low priority per user feedback | When tax features mature |
