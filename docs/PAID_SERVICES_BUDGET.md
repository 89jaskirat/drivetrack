# DriveTrack — Paid Services & Budget Analysis

**Version 1.0**
**Date:** 2026-04-21
**Exchange Rate Used:** 1 USD = 1.37 CAD (April 2026)

> All prices sourced April 2026. Third-party pricing changes frequently — re-verify before committing. Ranges reflect low/high estimates; real costs depend on usage volume.

---

## Quick Summary

| Phase | One-Time | Monthly (CAD) |
|---|---|---|
| Pre-launch (legal + accounts) | $9,000–$17,000 CAD | — |
| Launch / 0–1k users | — | $50–$100/month |
| Growth / 1k–10k users | — | $350–$800/month |
| Scale / 10k+ users | — | $1,500–$5,000+/month |

---

## 1. Platform Fees

These are non-negotiable gates to publishing on either app store.

| Item | Cost | Frequency | Notes |
|---|---|---|---|
| Apple Developer Program | $99 USD (~$136 CAD) | Annual | Required before any iOS build, TestFlight, or App Store submission. Backlog: *iOS App — Tier 1* |
| Google Play Console | $25 USD (~$34 CAD) | One-time | Required before any Play Store submission. Backlog: *Google Play Store — Tier 4* |

**Subtotal — Platform Fees:**
- One-time: ~$34 CAD
- Annual recurring: ~$136 CAD/year

---

## 2. Infrastructure

### 2.1 Supabase (Database + Auth + Storage + Edge Functions)

Current stack. Three separate projects required for dev/preprod/prod environments (Backlog: *Dev/Preprod/Production Environments*).

| Project | Plan | Cost (USD/month) | Cost (CAD/month) |
|---|---|---|---|
| drivetrack-dev | Free | $0 | $0 |
| drivetrack-preprod | Free | $0 | $0 |
| drivetrack-prod | Pro | $25–75 | $34–103 |

**Pro plan includes:** 8 GB database, 100k MAU, 100 GB storage, 250 GB egress, pg_cron (needed for audit log retention). Overages billed on usage.

**When to upgrade prod to Team ($599/month):** Beyond ~100k MAU or when point-in-time recovery becomes required.

### 2.2 EAS Build & Submit (Expo Application Services)

Required for building iOS and Android binaries and submitting to app stores.

| Tier | Cost (USD/month) | Cost (CAD/month) | Build Limit | When to Use |
|---|---|---|---|---|
| Free | $0 | $0 | 30 builds/month | Development and early testing |
| Starter | $19 | $26 | Priority builds + credits | At launch / active release cycle |
| Production | $99 | $136 | Higher concurrency | Multiple team members, frequent releases |

**Recommendation:** Start on Free tier during development. Move to Starter ($26 CAD/month) when approaching launch and needing priority build queues.

### 2.3 Domain + Static Hosting

Required for: Privacy Policy public URL (mandatory for both app stores), Support URL, marketing page.

| Item | Cost | Frequency |
|---|---|---|
| Domain (e.g. drivetrackapp.ca) | ~$18 CAD | Annual |
| Static hosting (Vercel or GitHub Pages) | $0 | — |

**Subtotal — Infrastructure (launch phase):** ~$34–103 CAD/month + $18 CAD/year domain

---

## 3. Legal & Compliance

These are one-time pre-launch costs. Cannot be skipped — both app stores require a Privacy Policy and both Canadian law (PIPEDA) and Quebec law (Bill 96) impose obligations.

### 3.1 Canadian Legal Counsel

Review and approval of three drafted documents: `docs/TERMS_AND_CONDITIONS.md`, `docs/PRIVACY_POLICY.md`, `docs/COMMUNITY_GUIDELINES.md`.

| Item | Estimated Cost (CAD) |
|---|---|
| Legal review — T&C, Privacy Policy, Community Guidelines | $3,000–$8,000 |
| Ongoing legal retainer (updates, new features) | $500–$2,000/year |

**Note:** A tech startup legal package with a Canadian firm typically covers initial document review + one round of revisions. Prices vary widely by city (Toronto/Vancouver higher than smaller markets).

### 3.2 French Translation of Legal Documents

Mandatory for operating in Quebec (Bill 96 / Charter of the French Language). Must be done by a professional human translator — machine translation is not acceptable for legal documents.

Document word counts (approximate):

| Document | Word Count | Cost @ $0.25/word CAD |
|---|---|---|
| Terms and Conditions | ~7,500 words | ~$1,875 |
| Privacy Policy | ~4,000 words | ~$1,000 |
| Community Guidelines | ~2,500 words | ~$625 |
| **Total** | **~14,000 words** | **~$3,500** |

**Range:** $2,800–$4,200 CAD depending on translator rates and rush fees.

### 3.3 UI String Translation (French — Phase 1 i18n)

All UI labels, buttons, error messages, and notifications must be translated. This can use a mix of professional translation and machine-assisted (DeepL) with human review.

| Item | Cost |
|---|---|
| Professional translation of UI strings (~3,000 words) | $750–$900 CAD |
| DeepL API (machine draft, human review) | $0–$25 USD/month |

**Subtotal — Legal & Compliance (one-time):** $6,550–$13,100 CAD

---

## 4. Development & Monitoring Tools

### 4.1 Error Monitoring — Sentry

Backlog: *Error Monitoring — Tier 4*. Required for production crash visibility on both iOS and Android.

| Plan | Cost (USD/month) | Cost (CAD/month) | Errors Included |
|---|---|---|---|
| Developer (Free) | $0 | $0 | 5k errors, 1 user |
| Team | $26 | $36 | 50k errors, unlimited users |

**Recommendation:** Free during development, Team plan at launch.

### 4.2 CI/CD — GitHub Actions

Backlog: *CI/CD Pipeline — Tier 4*. Automated EAS builds on push to main.

| Plan | Cost | Minutes/Month |
|---|---|---|
| Free (public or private repo) | $0 | 2,000 min |
| Team | $4 USD/user/month | 3,000 min |

**Recommendation:** GitHub Free is sufficient for a solo developer or small team.

### 4.3 Analytics — Admin Dashboard

Backlog: *Admin Analytics View — Tier 2*. For DAU/MAU, session length, zone performance.

| Service | Free Tier | Paid |
|---|---|---|
| PostHog (self-hostable) | 1M events/month | $0–$450 USD/month |
| Mixpanel | 20M events/month | $28 USD/month |

**Recommendation:** PostHog Cloud free tier is sufficient at launch and for years of moderate usage.

**Subtotal — Tools (launch phase):** $36 CAD/month (Sentry Team only)

---

## 5. Third-Party Integrations

### 5.1 Transactional Email — Launch (Phase 1)

Required for: password reset emails, auth confirmations, future notification emails.

| Service | Free Tier | Paid Tier |
|---|---|---|
| Resend | 3,000 emails/month | $20 USD/month (50k emails) |
| SendGrid | 100 emails/day | $19.95 USD/month (50k emails) |

**Recommendation:** Resend free tier is sufficient at launch. Upgrade when email volume exceeds 3k/month.

**Cost at launch:** $0. **Cost at growth:** ~$27 CAD/month.

### 5.2 Push Notifications — Launch (Phase 1)

Backlog: *Push Notifications — Tier 4*. Expo's push notification service is free and routes through Apple APNs and Google FCM at no additional charge.

| Service | Cost |
|---|---|
| Expo Push Notifications | $0 |

**If advanced segmentation or analytics are needed later:**

| Service | Free Tier | Paid |
|---|---|---|
| OneSignal | 10k subscribers | $9 USD/month (100k) |

**Cost at launch:** $0.

### 5.3 Google Maps API — Phase 1 (Gas Price Navigation)

PRD §3.8. Used for showing nearest gas stations and navigating to them.

Google provides a **$200 USD/month free credit** for all Maps API usage. This covers approximately:
- ~28,000 Dynamic Map loads, or
- ~20,000 Directions API requests, or
- ~11,000 Places API requests

| Usage Level | Monthly Cost (CAD) |
|---|---|
| Under free credit (~0–5k active users) | $0 |
| Moderate (~5k–20k users) | $50–$200 |
| High (20k+ users) | $200–$800+ |

**Cost at launch:** $0 (comfortably under the free credit for early user counts).

### 5.4 Bank Integration — Phase 2

Backlog: *Bank Integration — Tier 2*. Plaid is the recommended provider for Canada (Flinks is an alternative but has non-public enterprise pricing).

| Item | Cost (USD) |
|---|---|
| Development / Sandbox | Free |
| Per bank account linked | ~$0.50–$2.00/connection |
| Balance checks (ongoing) | ~$0.05–$0.15/call |

**Estimated monthly cost:**

| Active Linked Users | Estimated Monthly Cost (CAD) |
|---|---|
| 100 | $10–$40 |
| 1,000 | $100–$400 |
| 5,000 | $500–$2,000 |

**Note:** Plaid does not publish official pricing. Actual rates are negotiated. Budget $1–2 CAD/active linked user/month as a conservative estimate.

### 5.5 AI Insights — Phase 3

Backlog: *AI Insights — Tier 3*. Spending pattern analysis, driving hour recommendations, predictive earnings. Built on Claude API.

**Recommended model:** Claude Haiku 4.5 for cost efficiency ($1.00 input / $5.00 output per 1M tokens).

**Estimated per-user cost:**
- Each AI insight call: ~500 input tokens + ~400 output tokens
- Cost per call: ~$0.0005 + ~$0.002 = **~$0.0025 USD per insight**
- At 5 insights/user/month: **~$0.0125 USD/user/month**

| Active Users Using AI | Monthly Cost (CAD) |
|---|---|
| 1,000 | ~$17 |
| 5,000 | ~$85 |
| 10,000 | ~$170 |

**Cost is negligible at early scale.** Use Claude Haiku 4.5 for routine insights; escalate to Sonnet 4.6 only for complex reasoning tasks.

### 5.6 CSV / PDF Expense Parsing — Phase 2

Backlog: *CSV/PDF Expense Import — Tier 2*. For parsing Uber statements and receipts.

| Service | Free Tier | Paid |
|---|---|---|
| Mindee | 250 pages/month | $0.10/page after free tier |
| Google Document AI | None | $65 USD/1,000 pages |

**Recommendation:** Mindee. Free tier covers ~250 receipt uploads/month, which is adequate at launch.

| Monthly Receipt Uploads | Monthly Cost (CAD) |
|---|---|
| Under 250 pages | $0 |
| 500 pages | ~$34 |
| 2,000 pages | ~$241 |

### 5.7 SMS / MFA — Phase 3

Backlog: *MFA Support — Tier 3*. If TOTP-only (Google Authenticator), cost is $0. If SMS-based:

| Service | Cost (Canada) |
|---|---|
| Twilio SMS | ~$0.0085 USD/SMS (~$0.012 CAD) |
| Supabase Phone Auth (via Twilio) | Same rate, configured in Supabase Dashboard |

**Estimated monthly cost:**
- 1,000 MAU × 1 SMS login/month = $12 CAD/month
- 10,000 MAU × 1 SMS login/month = $120 CAD/month

**Recommendation:** Launch with TOTP-only MFA (free). Add SMS as an optional upgrade later.

### 5.8 i18n Phase 2 — Machine Translation (Punjabi, Hindi, Spanish)

Backlog: *Multi-Language Support — Tier 2*. UI strings for non-legal content can use machine translation with human review.

| Service | Free Tier | Paid |
|---|---|---|
| DeepL API | 500k chars/month | $6.99 USD/month (1M chars) |

**Cost:** $0–$10 CAD/month. Human review for each language adds one-time cost (~$500–$1,000 CAD per language for quality assurance pass).

---

## 6. Phase Budget Summary

All amounts in CAD. USD converted at 1 USD = 1.37 CAD (April 2026).

### Pre-Launch — One-Time Costs

| Item | Low Estimate | High Estimate |
|---|---|---|
| Google Play Console | $34 | $34 |
| Apple Developer Program (first year) | $136 | $136 |
| Canadian legal counsel | $3,000 | $8,000 |
| French translation — legal docs (3 documents) | $2,800 | $4,200 |
| French translation — UI strings | $750 | $900 |
| Domain name (first year) | $18 | $18 |
| **Total One-Time Pre-Launch** | **$6,738** | **$13,288** |

### Monthly Recurring — Phase 1 Launch (0–1,000 Users)

| Service | Low | High | Notes |
|---|---|---|---|
| Supabase Pro (prod) | $34 | $103 | $25–75 USD/month |
| Apple Developer Program | $11 | $11 | $136/year ÷ 12 |
| EAS Build | $0 | $26 | Free tier likely sufficient |
| Sentry | $0 | $36 | Free tier at launch |
| Email (Resend) | $0 | $0 | Under free tier |
| Push Notifications | $0 | $0 | Expo free |
| Google Maps API | $0 | $0 | Under $200 credit |
| Analytics (PostHog) | $0 | $0 | Free tier |
| **Monthly Total** | **$45** | **$176** |  |

### Monthly Recurring — Phase 2 Growth (1,000–10,000 Users)

| Service | Low | High | Notes |
|---|---|---|---|
| Supabase Pro (prod) | $68 | $137 | Usage overages kicking in |
| Supabase (preprod, if needed) | $0 | $34 | May stay on free |
| Apple Developer Program | $11 | $11 | |
| EAS Build Starter | $26 | $136 | $19–99 USD/month |
| Sentry Team | $36 | $36 | |
| Email (Resend) | $27 | $27 | 50k emails/month |
| Google Maps API | $0 | $274 | Depends on usage |
| Bank Integration (Plaid) | $68 | $548 | Per active linked user |
| Analytics (PostHog) | $0 | $0 | Still under free tier |
| DeepL (i18n) | $0 | $14 | |
| **Monthly Total** | **$236** | **$1,217** |  |

### Monthly Recurring — Phase 3 Scale (10,000+ Users)

| Service | Low | High | Notes |
|---|---|---|---|
| Supabase Pro/Team (prod) | $137 | $822 | May need Team plan |
| Supabase (preprod) | $34 | $68 | |
| Apple Developer Program | $11 | $11 | |
| EAS Production | $136 | $136 | |
| Sentry Team | $36 | $36 | |
| Email | $27 | $82 | Higher volume |
| Google Maps API | $137 | $548 | |
| Bank Integration (Plaid) | $548 | $2,740 | 5k linked users |
| AI Insights (Claude Haiku) | $85 | $342 | 5k–10k AI users |
| CSV Parsing (Mindee) | $0 | $240 | |
| SMS MFA (Twilio) | $0 | $120 | If SMS MFA enabled |
| Push Notifications (OneSignal) | $0 | $25 | If advanced features needed |
| Analytics (PostHog paid) | $0 | $616 | If > 1M events |
| **Monthly Total** | **$1,151** | **$5,786** |  |

---

## 7. Services With $0 Cost (Free Tiers That Cover Expected Usage)

These services are required but cost nothing at early scale:

| Service | Why Free | Backlog Item |
|---|---|---|
| Expo Push Notifications | Expo's service is free; uses Apple APNs + Google FCM at no charge | Push Notifications — Tier 4 |
| GitHub Actions CI/CD | 2,000 free minutes/month covers typical build/test workflows | CI/CD Pipeline — Tier 4 |
| Google Maps API | $200 USD/month free credit covers ~28k map loads | Gas Price Navigation — PRD §3.8 |
| PostHog Analytics | 1M events/month free | Admin Analytics — Tier 2 |
| Vercel Static Hosting | Free for static sites | Privacy Policy URL |
| Mindee Document Parsing | 250 pages/month free | CSV/PDF Import — Tier 2 |
| DeepL Translation | 500k chars/month free | i18n — Tier 2 |
| Supabase Auth | Included in free/Pro plan | Core auth |
| Supabase Edge Functions | 500k invocations/month free (Pro plan) | IP logging, zone functions |
| Supabase Realtime | Included in Pro plan | Real-time forum updates |

---

## 8. Services Mentioned in PRD Not Yet Budgeted

The PRD §2 mentions AWS as the target infrastructure (S3, Shield, WAF). The current implementation uses Supabase, which runs on AWS under the hood. Direct AWS is not currently required, but if the team migrates away from Supabase in the future:

| AWS Service | Estimated Cost |
|---|---|
| S3 storage | ~$0.023 USD/GB/month |
| AWS Shield Standard | Free |
| AWS Shield Advanced | $3,000 USD/month (enterprise only — not recommended at this stage) |
| AWS WAF | ~$5 USD/month + $1 per million requests |

**Recommendation:** Stay on Supabase (which provides equivalent protections) until scale justifies a direct AWS migration. This avoids significant DevOps overhead.

---

## 9. Notes & Assumptions

1. **Exchange rate:** 1 USD = 1.37 CAD as of April 2026. Verify before budgeting.
2. **Legal costs** are highly variable by jurisdiction, firm size, and complexity. Obtain quotes from at least two Canadian law firms before budgeting.
3. **Plaid pricing** is not publicly disclosed. Actual rates are negotiated. The estimates above are based on industry research. Request a quote from Plaid directly before committing to Phase 2.
4. **Apple Developer Program** fee must be paid annually without interruption — a lapsed membership causes the app to be removed from the App Store within days.
5. **Supabase** free tier allows 2 projects. The third project (prod or preprod) requires at minimum a Pro plan on the organization.
6. **EAS Build** free tier resets monthly. If you are doing a sustained release push, upgrade to Starter to avoid build queue delays.
7. **All AI costs** are usage-based. If AI features are launched to all users at once, monitor the first billing cycle closely.
8. **French translation** rates assume standard legal/technical text. Rush rates add 25–50%.
9. **Flinks** (alternative to Plaid for Canadian banks) does not publish pricing — contact them directly if Plaid's rates prove too high.
10. Prices are subject to change. This document should be reviewed quarterly and updated before each new phase launch.

---

*DriveTrack Paid Services & Budget v1.0 — 2026-04-21*
*Re-verify all pricing before committing to any service.*
