# 🚗 DriveTrack — Companion App for Canadian Rideshare Drivers

> **Mobile-first SaaS platform** helping Uber/Lyft drivers manage operations, optimize taxes, track profitability, maintain vehicles, access hyperlocal communities, and discover cost-saving opportunities.

## 🎯 Overview

DriveTrack is built for gig economy drivers in Canada. It fills a critical gap: while Uber and Lyft don't provide driver analytics or tax tools, DriveTrack does — all in one mobile app.

**Core value propositions:**
- 📊 **Profitability tracking** — earnings per km, earnings per hour, profit margins by day/week/month
- 🧮 **Tax optimization** — mileage logs, expense tracking, CRA T2125 form generation (coming soon)
- ⛽ **Fuel efficiency analytics** — L/100km trends, cost per km, zone leaderboards
- 🌍 **Hyperlocal community** — zone-based forums, best gas prices, local deals
- 🏆 **Gamification** — streaks, badges, weekly scorecards, friendly competition
- 🤝 **Multi-platform** — iOS, Android, and web admin portal

---

## ✨ Key Features

### 1. **Session & Mileage Tracking**
- Auto-detect drive sessions via GPS or manual entry
- Odometer-based distance tracking with deduplication
- Expense categorization (fuel, maintenance, insurance, parking, tolls, lease, misc)
- Recurring expense automation

### 2. **Analytics Dashboard**
- Weekly personal scorecards (earnings, efficiency, completeness score)
- Fuel efficiency metrics (L/100km, MPG) with trend charts
- Profit per km and profit per hour breakdowns
- Week-over-week comparisons
- Zone-based percentile rankings (opt-in)

### 3. **Zone-Based Community**
- Reddit-style forums per zone (c/Calgary, c/Edmonton, c/RedDeer, c/Canada)
- Upvoting/downvoting, threaded comments (3-4 levels deep)
- Engagement-weighted feed algorithm (upvotes, views, saves, comment velocity)
- User badges visible on profiles
- Follow users and conversations

### 4. **Gamification & Engagement**
- **Daily streaks** — Consistent logging with 3 grace days/month
- **Badges** — Status badges (Fuel Saver, Clean Logs, Consistent Driver, etc.)
- **Weekly scorecard** — Personal Monday morning recap
- **Monthly Wrapped** — Spotify-style annual/monthly report
- **Leaderboards** — Zone-scoped fuel efficiency rankings (anonymous percentile bands)

### 5. **Real-Time Data**
- Gas price discovery (lowest prices by zone, updated by admins)
- Promotional deals for drivers (mechanics, gas stations, insurance brokers)
- Push notifications (customizable for daily reminders, new posts, price alerts)

### 6. **Multi-Platform Support**
- Uber/Lyft earnings tagged by platform
- Bank integration (Plaid) for auto-import of deposits (Phase 2)
- CSV/PDF expense import with OCR (Phase 2)

### 7. **Privacy-First Design**
- PIPEDA-compliant (Canadian personal data protection)
- Explicit opt-in for leaderboards and analytics sharing
- Anonymized percentile-based rankings (no public earnings data)
- 10-driver minimum threshold to prevent de-anonymization in small zones

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile (iOS & Android)** | React Native (Expo SDK 54) |
| **Web Admin** | React + TypeScript |
| **Backend** | Supabase (PostgreSQL + Edge Functions) |
| **Authentication** | Supabase Auth (email/password, Google OAuth, Apple Sign-In) |
| **Real-time** | Supabase Realtime (forum updates) |
| **Cloud Storage** | AWS S3 (encrypted) |
| **Maps & Navigation** | Google Maps API |
| **Analytics** | PostHog (free tier) or custom dashboard |
| **Error Monitoring** | Sentry (paid tier for production) |
| **Push Notifications** | Expo Push Notifications |
| **CI/CD** | EAS Build + EAS Submit for app store distribution |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Yarn or npm
- Expo CLI: `npm install -g expo-cli`
- Supabase account (free tier available)
- Google Cloud account (for Maps API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/drivetrack.git
   cd drivetrack
   ```

2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id
   ```

4. **Run database migrations**
   ```bash
   # In Supabase Dashboard → SQL Editor:
   # Copy and paste contents of supabase/migrations/001_initial_schema.sql
   # Then run migrations 002-011 in order
   ```

5. **Start the dev server**
   ```bash
   # iOS simulator (macOS only)
   yarn ios
   
   # Android emulator
   yarn android
   
   # Web (Expo web)
   CI=1 expo start
   # Then press 'w' in the terminal
   ```

6. **Access the app**
   - Scan QR code with Expo Go app (iOS/Android)
   - Or use simulator/emulator built into your IDE

---

## 📱 App Screens

| Screen | Purpose |
|--------|---------|
| **Home** | Dashboard with weekly analytics, streak counter, upcoming notifications |
| **Track** | Log mileage, fuel, earnings, expenses (main data entry) |
| **Community** | Zone forums, user posts, comment threads, leaderboards |
| **Deals** | Promotions marketplace for local businesses |
| **Knowledge** | In-app articles (taxes, maintenance tips, efficiency guides) |
| **Profile** | User info, badges, settings, notification preferences |

---

## 🔐 Security & Compliance

- **PIPEDA** — Personal data protection for Canadian users
- **Ontario/Quebec governing law** — Terms & Conditions reviewed by Canadian legal counsel
- **Encryption** — AES-256 for sensitive data at rest; TLS 1.2+ in transit
- **RLS Policies** — Row-level security on all user tables (Supabase)
- **HTTPS only** — No unencrypted connections
- **Auth** — JWT tokens, MFA support (TOTP + SMS coming)

---

## 📊 Analytics & Data

DriveTrack collects **only** what drivers voluntarily log:
- Mileage (start/end odometer)
- Fuel (liters, cost, odometer)
- Earnings (amount, platform)
- Expenses (category, amount, date)
- Location (for zone detection; optional)

**Not collected:**
- Uber/Lyft trip data (no API access)
- Continuous GPS tracking (opt-in only)
- Personal browsing behavior outside the app

See [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md) for details.

---

## 🌍 Roadmap

### Phase 1 (MVP — April 2026)
- ✅ Auth + zone detection
- ✅ Mileage + fuel tracking
- ✅ Manual expenses
- ✅ Basic forum
- ✅ Gamification (streaks, badges, weekly scorecard)
- 🔄 iOS App Store submission
- 🔄 Android Play Store submission

### Phase 2 (Growth)
- Bank integration (Plaid)
- Advanced analytics dashboard
- Promotions engine
- Multi-language support (French, Punjabi, Hindi, Spanish)
- Zone leaderboards (fuel efficiency, distance)
- Follow users & conversations

### Phase 3 (Maturity)
- AI-powered insights (Claude API)
- Tax automation (CRA T2125)
- Smart trip detection (GPS + accelerometer)
- Monthly Wrapped reports
- Multi-vehicle support

### Future
- Multi-platform driver support (Lyft, DoorDash, Skip)
- Predictive analytics (surge prediction, demand forecasting)
- Maintenance tracking (oil changes, tire rotations)
- Gamification (leaderboards, achievements)

---

## 📈 Budget & Costs

For a breakdown of all third-party services, platform fees, and infrastructure costs, see [docs/PAID_SERVICES_BUDGET.md](docs/PAID_SERVICES_BUDGET.md).

**Summary:**
| Phase | One-Time | Monthly |
|-------|----------|---------|
| **Pre-launch** | $9k–$17k CAD | — |
| **Launch (0–1k users)** | — | $50–$100 |
| **Growth (1k–10k users)** | — | $350–$800 |
| **Scale (10k+ users)** | — | $1.5k–$5.8k |

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Development workflow:**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and commit: `git commit -m "Add your feature"`
4. Push to your fork: `git push origin feature/your-feature`
5. Open a pull request with a clear description

**Code standards:**
- TypeScript for type safety
- Linting: `yarn lint`
- Format: Prettier (auto-format on save)
- Tests: Jest (run with `yarn test`)

---

## 📄 Documentation

- [**PRD (Product Requirements Document)**](project-context/PRD.md) — Full product vision
- [**iOS Launch Plan**](docs/IOS_LAUNCH_PLAN.md) — 5-phase plan for App Store submission
- [**Paid Services & Budget**](docs/PAID_SERVICES_BUDGET.md) — Complete cost breakdown
- [**Terms & Conditions**](docs/TERMS_AND_CONDITIONS.md) — Legal terms (PIPEDA-compliant)
- [**Privacy Policy**](docs/PRIVACY_POLICY.md) — Data handling practices
- [**Community Guidelines**](docs/COMMUNITY_GUIDELINES.md) — Forum moderation rules
- [**BACKLOG.md**](BACKLOG.md) — Feature backlog organized by tier and priority

---

## 🐛 Known Issues & Workarounds

| Issue | Status | Workaround |
|-------|--------|-----------|
| GPS battery drain on long sessions | 🔄 Investigating | Enable GPS session tracking only when needed; background tracking is aggressive on iOS |
| Some Android devices skip odometer validation | ⏳ Q3 2026 | Manual entry is reliable; GPS validation coming in Phase 2 |
| Push notifications delayed on Android (30s+) | 🎯 FCM config | Ensure device has Google Play Services installed |

---

## 📞 Support

- **Bug reports**: Open an issue on GitHub
- **Feature requests**: Discuss in our community forum (in-app)
- **Email support**: [support@drivetrackapp.ca](mailto:support@drivetrackapp.ca)
- **Twitter**: [@DriveTrackApp](https://twitter.com/drivetrackapp)

---

## 📜 License

DriveTrack is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/)
- Powered by [Supabase](https://supabase.com/)
- Maps by [Google Maps Platform](https://developers.google.com/maps)
- Icons by [Feather Icons](https://feathericons.com/)

---

## 👨‍💻 About

**DriveTrack** started as a personal project to help Canadian gig drivers track profitability and optimize taxes. It's now a full-featured SaaS platform with a growing community of drivers.

**Current team:**
- Product & Engineering: Jaskirat (@yourusername)

**Interested in collaborating?** Reach out via GitHub or email support@drivetrackapp.ca.

---

**Last updated:** April 2026  
**Status:** Beta (iOS & Android live on app stores)
