# DriveTrack — iOS Launch Plan

**Status:** Ready for execution
**Created:** 2026-04-21
**Expo SDK:** 54 (React Native 0.81.5)
**iOS Bundle ID:** `com.drivetrack.companion`

---

## Overview

DriveTrack is built with Expo / React Native, so the iOS version shares the same codebase as Android. There is no rewrite required. The work is split into five sequential phases: account setup, code changes, store asset preparation, beta testing, and submission.

**Estimated total effort:** 3–4 weeks (most of Phase 1 is waiting on Apple approval)

---

## Phase 1 — Apple Account and Credentials
*Do this first. Some steps have multi-day wait times.*

### 1.1 Apple Developer Program
- Enroll at [developer.apple.com/enroll](https://developer.apple.com/enroll) ($99 USD/year)
- Enrollment requires a D-U-N-S number if registering as a company; individual enrollment is faster
- Approval typically takes 24–48 hours; can take up to a week for organization accounts
- **Required before any of the following steps**

### 1.2 EAS iOS Credentials
Once enrolled, run the following to generate signing credentials via EAS (no Xcode required):
```
eas credentials --platform ios
```
EAS will create and store:
- **Distribution Certificate** — signs the app binary
- **Provisioning Profile** — ties the certificate to the App ID (`com.drivetrack.companion`)

Add to `eas.json` production iOS profile:
```json
"ios": {
  "simulator": false,
  "credentialsSource": "remote"
}
```

### 1.3 App Store Connect App Record
- Log in at [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- Create a new app: platform iOS, bundle ID `com.drivetrack.companion`, SKU `drivetrack-companion`
- Note the **Apple ID (numeric)** — needed for `eas submit`
- Note the **Apple Team ID** — found in Membership section of developer.apple.com

### 1.4 Google OAuth — iOS Client ID
The current `app.json` only has `googleWebClientId`. A separate iOS client ID is required:
- Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
- Create an OAuth 2.0 Client ID, type: **iOS**, bundle ID: `com.drivetrack.companion`
- Download the `GoogleService-Info.plist` (keep for reference; values go into `app.json`)
- Add to `app.json extra`:
  ```json
  "googleIosClientId": "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com"
  ```
- Also register the reverse client ID as a URL scheme (required for OAuth redirect):
  - In Google Cloud Console, the reversed client ID looks like `com.googleusercontent.apps.XXXXX`
  - Add to `app.json ios`:
    ```json
    "infoPlist": {
      "CFBundleURLTypes": [
        {
          "CFBundleURLSchemes": ["com.googleusercontent.apps.XXXXX"]
        }
      ]
    }
    ```

### 1.5 EAS Submit Configuration
Update `eas.json`:
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "89jaskirat@gmail.com",
      "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
      "appleTeamId": "YOUR_TEAM_ID"
    }
  }
}
```

---

## Phase 2 — Code Changes
*All changes are additive — no Android functionality is affected.*

### 2.1 Apple Sign-In (MANDATORY — App Store Guideline 4.8)
Apple requires Sign in with Apple on any app that offers third-party social login (Google OAuth). Rejection is certain without it.

**Install package:**
```
npx expo install expo-apple-authentication
```

**Add plugin to `app.json`:**
```json
"plugins": [
  "expo-apple-authentication"
]
```

**Enable capability in App Store Connect:**
- App Store Connect → App → App IDs → `com.drivetrack.companion` → Capabilities → Sign in with Apple → Enable

**Implementation in `src/services/authService.ts`:**
```typescript
import * as AppleAuthentication from 'expo-apple-authentication';

export async function signInWithApple(): Promise<AuthResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken!,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') return { success: false, error: 'cancelled' };
    return { success: false, error: e.message ?? 'Apple sign-in failed' };
  }
}
```

**Add Apple provider to Supabase:**
- Supabase Dashboard → Authentication → Providers → Apple → Enable
- Requires Apple Services ID, Team ID, Key ID, and private key from developer.apple.com

**Update `src/screens/AuthScreen.tsx`:**
- Import `AppleAuthentication` from `expo-apple-authentication`
- Render `AppleAuthentication.AppleAuthenticationButton` on iOS only:
  ```tsx
  import { Platform } from 'react-native';
  import * as AppleAuthentication from 'expo-apple-authentication';

  {Platform.OS === 'ios' && (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={8}
      style={{ width: '100%', height: 48, marginTop: 12 }}
      onPress={handleAppleSignIn}
    />
  )}
  ```
- Apple's HIG requires the Apple Sign-In button to be at least as prominent as the Google button

### 2.2 iOS Permission Strings
Add to `app.json` under `ios.infoPlist` (required for App Store review; app crashes on iOS without these when permission is requested):
```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.drivetrack.companion",
  "infoPlist": {
    "NSLocationWhenInUseUsageDescription": "DriveTrack uses your location to suggest the nearest driver zone and to track drive sessions when enabled.",
    "NSLocationAlwaysAndWhenInUseUsageDescription": "DriveTrack uses background location to automatically log drive sessions. This only runs when you enable GPS session tracking.",
    "NSMicrophoneUsageDescription": "DriveTrack may access the microphone if you attach audio notes to expense entries.",
    "CFBundleURLTypes": [
      { "CFBundleURLSchemes": ["com.googleusercontent.apps.XXXXX"] }
    ]
  }
}
```
Note: `NSPhotoLibraryUsageDescription` and `NSCameraUsageDescription` are already handled by the `expo-image-picker` plugin.

### 2.3 Google OAuth — Pass iOS Client ID
Update `authService.ts` `signInWithGoogle()` to pass the platform-appropriate client ID:
```typescript
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const googleClientId = Platform.OS === 'ios'
  ? Constants.expoConfig?.extra?.googleIosClientId
  : Constants.expoConfig?.extra?.googleWebClientId;

// Pass to signInWithOAuth options:
queryParams: { client_id: googleClientId }
```

### 2.4 iPad Layout Audit
`supportsTablet: true` means Apple will test on iPad. Every screen must render without broken layouts.

**Screens to audit on iPad simulator (12.9" and 9.7"):**
- `AuthScreen` — login buttons must not stretch to full 1024px width; constrain with `maxWidth`
- `HomeScreen` — dashboard cards should use a responsive grid, not fixed widths
- `CommunityScreen` — forum list and post detail should use readable line lengths
- `ProfileScreen` — form fields must not span full iPad width
- All modal screens — check they don't appear as tiny popups on iPad

**Quick fix pattern for most screens:**
```tsx
<View style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
  {/* screen content */}
</View>
```

### 2.5 Status Bar and System UI
- Verify `expo-status-bar` renders correctly on iOS (notch, Dynamic Island on iPhone 14 Pro+)
- Test with iOS safe area insets — ensure no content is clipped behind the home indicator bar
- Check that `"userInterfaceStyle": "dark"` in `app.json` looks intentional on iOS; iOS system sheets (action sheets, share sheets) will also appear dark

---

## Phase 3 — Store Assets
*Can be done in parallel with Phase 2.*

### 3.1 App Icon
- Current: `assets/icon.png`
- Required: 1024×1024 PNG, **no alpha channel (no transparency)**
- Verify: open `assets/icon.png` in an image editor and confirm it has no transparent pixels — EAS build will fail or Apple will reject if alpha is present
- iOS does its own corner rounding — export as square

### 3.2 Screenshots
Screenshots must be captured at specific device sizes. Use the Expo iOS simulator or a physical device.

| Slot | Device | Resolution | Status |
|---|---|---|---|
| iPhone 6.7" | iPhone 16 Pro Max | 1320×2868 | Required |
| iPhone 6.5" | iPhone 11 Pro Max | 1242×2688 | Recommended |
| iPad Pro 12.9" (6th gen) | iPad Pro 12.9" | 2048×2732 | Required (supportsTablet) |
| iPad Pro 12.9" (2nd gen) | iPad Pro 12.9" | 2048×2732 | Required (supportsTablet) |

**Screens to capture (suggested set of 5–8 per device):**
1. Home dashboard (mileage/earnings overview)
2. Expense entry
3. Community forum feed
4. Gas price map/list
5. Zone sub-forum post
6. Profile / zone selection
7. Deals/promos screen
8. Onboarding zone selection (once built)

### 3.3 App Store Connect Metadata
Fill in all fields in App Store Connect before first submission:

| Field | Value |
|---|---|
| Name | DriveTrack |
| Subtitle | Tools for Canadian Gig Drivers |
| Description | [300–4000 chars; write last, after screenshots] |
| Keywords | rideshare,uber,driver,mileage,expense,gig,Calgary,Edmonton |
| Support URL | [public URL or email page] |
| Marketing URL | [optional] |
| Privacy Policy URL | [public URL — required] |
| Primary Category | Productivity |
| Secondary Category | Finance |
| Copyright | © 2026 [Operator Legal Name] |

### 3.4 Privacy Nutrition Labels
In App Store Connect → App Privacy, declare every data type collected. Based on the Privacy Policy:

| Data Type | Collected | Linked to User | Used for Tracking |
|---|---|---|---|
| Name | Yes | Yes | No |
| Email Address | Yes | Yes | No |
| Phone Number | Yes (optional) | Yes | No |
| Precise Location | Yes (optional) | Yes | No |
| Coarse Location | Yes | Yes | No |
| User ID | Yes | Yes | No |
| Financial Info (expense amounts) | Yes | Yes | No |
| Usage Data | Yes | Yes | No |
| Crash Data | No | — | — |

### 3.5 Age Rating
Complete the Apple age rating questionnaire in App Store Connect.
Expected rating: **4+** (no objectionable content; community content is moderated).
Note: community forums technically allow user-generated content — answer "No" to the mature themes question since moderation is in place.

---

## Phase 4 — Beta Testing (TestFlight)

### 4.1 Build and Upload
```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```
The build uploads to App Store Connect automatically. TestFlight becomes available within 15–30 minutes.

### 4.2 Internal Testing (Day 1)
- Add internal testers (up to 100) via email in App Store Connect → TestFlight → Internal Testing
- No Apple review required — available within minutes of build processing
- Test: Google Sign-In, Apple Sign-In, onboarding, all screens, iPad layout

### 4.3 External TestFlight Beta (Days 2–14+)
- Submit build for Beta App Review (Apple reviews within ~1 day)
- Once approved, share the TestFlight public link with external testers
- Run for a minimum of 14 days before App Store submission
- Log and fix all iOS-specific bugs found during this period

### 4.4 Demo Account for Apple Review
Apple reviewers will log in to the app. Prepare:
- A dedicated test account (email + password login, not just Google OAuth)
- The account should have sample data (a few expenses, some community posts)
- Submit the credentials in the "Notes for App Review" field in App Store Connect

---

## Phase 5 — App Store Submission

### 5.1 Pre-Submission Checklist
- [ ] All Phase 2 code changes merged and tested
- [ ] Apple Sign-In working end-to-end
- [ ] iPad layout verified on all required simulators
- [ ] All screenshots uploaded to App Store Connect
- [ ] Privacy Nutrition Labels completed
- [ ] Age rating questionnaire completed
- [ ] Privacy Policy publicly accessible at a URL
- [ ] T&C and Community Guidelines publicly accessible
- [ ] All legal document placeholders ([OPERATOR NAME], [EMAIL], [ADDRESS]) filled in
- [ ] French translation of legal docs completed (for Quebec)
- [ ] Expo SDK version supports iOS 26 SDK (required for April 2026+ submissions — monitor expo.dev/changelog)
- [ ] Demo account credentials ready for Apple review notes

### 5.2 Submit
```bash
eas submit --platform ios --profile production --latest
```
Or submit manually in App Store Connect after uploading via Transporter.

### 5.3 Review Outcome
- Apple reviews 90% of submissions within 24 hours
- If rejected: read the rejection reason carefully, fix, and resubmit — do not appeal unless the rejection is clearly wrong
- Common first-submission rejections: missing Apple Sign-In, broken iPad layout, placeholder metadata

---

## Ongoing Maintenance

| Task | Frequency |
|---|---|
| Renew Apple Developer Program membership | Annually ($99 USD) |
| Renew distribution certificate (via EAS) | Every 12 months (EAS handles this) |
| Update provisioning profile after new device types | As needed |
| Submit app updates | On each feature release — must pass review |
| Respond to Apple age rating questionnaire updates | When Apple requests |
| Monitor iOS SDK requirement changes at developer.apple.com/news/upcoming-requirements | Monthly |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Apple Sign-In Supabase config fails | Medium | High — blocks iOS login | Test on simulator before TestFlight; Supabase has Apple provider docs |
| Google OAuth iOS redirect broken | Medium | High — blocks Google login on iOS | Test `makeRedirectUri` output on iOS simulator; verify URL scheme |
| iPad layout rejected | High | Medium — requires fixes and resubmission | Audit all screens on iPad 12.9" before submitting |
| Expo SDK doesn't support iOS 26 SDK by April 2026 | Low | High — blocks any update submission | Monitor expo.dev/changelog; plan Expo SDK upgrade if needed |
| App rejected for missing French language (Quebec) | Medium | Medium — legal risk, store rejection possible | Complete French translation before submission |
| Apple Review requests demo account, account fails | Medium | Medium — delays review | Test demo account thoroughly before submitting |

---

## Key Links

- [Apple Developer Enroll](https://developer.apple.com/enroll)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [EAS Build Docs — iOS](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs — iOS](https://docs.expo.dev/submit/ios/)
- [expo-apple-authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Supabase — Apple OAuth](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Apple Upcoming Requirements](https://developer.apple.com/news/upcoming-requirements/)

---

*DriveTrack iOS Launch Plan v1.0 — 2026-04-21*
