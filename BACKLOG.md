# Feature Backlog

Last updated: 2026-04-20

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

### IP Address Logging in Audit
- Capture user IP on login for audit_logs
- Requires server-side component (Supabase Edge Function or proxy)
- Mobile clients don't have reliable self-IP detection
- Edge function approach: `supabase.functions.invoke('get-client-ip')`

---

## Tier 2 — Medium Priority (Phase 2 per PRD)

### GPS: Idle/Waiting Detection (Priority 4)
- Detect idle time at known spots (airport queue, downtown hotspots)
- Track arrival/departure time, duration
- Label common locations
- **DB table ready:** `gps_idle_stops` (migration 009)

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
- Add Apple login option alongside Google OAuth
- Required for iOS App Store compliance
- **PRD §3.2**

### MFA Support
- Multi-factor authentication
- TOTP or SMS-based
- **PRD §3.2**

---

## Tier 4 — Infrastructure / DevOps

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
