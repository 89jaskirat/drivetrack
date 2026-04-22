import { useNavigation, useRoute } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ScreenFrame } from '../components/ScreenFrame';
import { appTheme } from '../theme';

// Bundled legal doc content — keep in sync with docs/*.md
const DOCS = {
  terms: {
    title: 'Terms & Conditions',
    version: 'Version 1.0 · Last Updated: 2026-04-21',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By downloading, installing, or using the DriveTrack mobile application, creating an account, or clicking "I Accept," you agree to be legally bound by these Terms and Conditions and our Privacy Policy.\n\nIf you do not agree to these Terms, you must not use the App.',
      },
      {
        heading: '2. Description of Service',
        body: 'DriveTrack is a companion application for Canadian rideshare and gig-economy drivers. The App provides:\n\n• Expense and mileage tracking\n• Fuel log management\n• Community forums (zone-based)\n• Gas price aggregation\n• Deals and promotions\n• Zone-based information and resources',
      },
      {
        heading: '3. Eligibility',
        body: 'You must be at least 18 years old, a Canadian resident or authorized worker, and possess the legal capacity to enter a binding contract.',
      },
      {
        heading: '4. Account Registration',
        body: 'You are responsible for maintaining the confidentiality of your credentials and all activity under your account. You agree to provide accurate, current information.',
      },
      {
        heading: '5. Privacy & Data Collection',
        body: 'Your data is handled in accordance with our Privacy Policy and Canada\'s PIPEDA regulations. Location data is collected only with your explicit consent and may be revoked at any time in Settings.',
      },
      {
        heading: '6. Community Guidelines',
        body: 'You agree not to post content that is abusive, misleading, illegal, or infringes on the rights of others. Violations may result in content removal, suspension, or termination of your account.',
      },
      {
        heading: '7. Limitation of Liability',
        body: 'DriveTrack is provided "as-is" without warranties of any kind, express or implied. We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the App.',
      },
      {
        heading: '8. Governing Law',
        body: 'These Terms are governed by and construed in accordance with the laws of Canada and the Province of Ontario, without regard to conflict of law principles.',
      },
      {
        heading: '9. Changes to Terms',
        body: 'We may revise these Terms from time to time. We will notify you of material changes via push notification or in-app message. Continued use of the App after changes constitutes your acceptance.',
      },
      {
        heading: '10. Contact',
        body: 'Questions about these Terms? Contact us at: support@drivetrackapp.ca',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    version: 'Version 1.0 · Last Updated: 2026-04-21',
    sections: [
      {
        heading: 'Overview',
        body: 'DriveTrack is committed to protecting your privacy in accordance with Canada\'s Personal Information Protection and Electronic Documents Act (PIPEDA). This policy explains what we collect, why we collect it, and how it is used.',
      },
      {
        heading: 'Information We Collect',
        body: 'We collect only information you voluntarily provide:\n\n• Account: email, name, phone number\n• Profile: vehicle make/model/year, city zone\n• Driving data: mileage logs, fuel fill-ups, expenses, earnings\n• Location: GPS coordinates (only with explicit consent, can be revoked)\n• Device: IP address, device type, OS version (for bug diagnosis)\n• Usage: in-app screens visited, feature usage (anonymized)',
      },
      {
        heading: 'How We Use Your Information',
        body: 'Your data is used to:\n\n• Provide the core app features (tracking, analytics)\n• Personalize community content by zone\n• Compute anonymized leaderboard percentiles (only if opted in)\n• Diagnose technical issues and improve the app\n• Send notifications you have enabled\n• Comply with legal obligations',
      },
      {
        heading: 'Data Sharing',
        body: 'We do not sell your personal information. We share data only with:\n\n• Supabase (database hosting, PIPEDA-compliant)\n• AWS S3 (encrypted file storage)\n• Sentry (error monitoring, anonymized)\n\nAll third-party processors are contractually bound to confidentiality.',
      },
      {
        heading: 'Location Data',
        body: 'GPS location is collected only when you explicitly grant permission and enable GPS tracking in Settings. You may revoke this permission at any time. Location data is used solely for zone detection and drive session tracking.',
      },
      {
        heading: 'Data Retention',
        body: 'Your data is retained for as long as your account is active. You may request deletion of your account and all associated data by contacting support@drivetrackapp.ca. Deletion is processed within 30 days.',
      },
      {
        heading: 'Your Rights (PIPEDA)',
        body: 'You have the right to:\n\n• Access the personal information we hold about you\n• Correct inaccurate information\n• Withdraw consent for data collection\n• Request deletion of your data\n• File a complaint with the Office of the Privacy Commissioner of Canada',
      },
      {
        heading: 'Contact',
        body: 'Privacy Officer: support@drivetrackapp.ca\nOffice of the Privacy Commissioner: www.priv.gc.ca',
      },
    ],
  },
  community: {
    title: 'Community Guidelines',
    version: 'Last Updated: 2026-04-21',
    sections: [
      {
        heading: 'Our Community',
        body: 'DriveTrack forums are for Canadian rideshare and gig drivers to share tips, ask questions, and support each other. Please keep discussions respectful and on-topic.',
      },
      {
        heading: 'Allowed Content',
        body: '✓ Driving tips and strategies\n✓ Zone-specific road conditions and demand\n✓ Vehicle maintenance advice\n✓ Expense and tax questions\n✓ Gas price and deal sharing\n✓ Platform policy discussions',
      },
      {
        heading: 'Prohibited Content',
        body: '✗ Abusive, harassing, or threatening language\n✗ Discrimination based on race, gender, religion, or other protected characteristics\n✗ Personal attacks on other users\n✗ Spam, self-promotion, or commercial advertising\n✗ Misinformation or deliberately misleading content\n✗ Content that violates any applicable law\n✗ Sharing of personal information about others without consent',
      },
      {
        heading: 'Enforcement',
        body: 'Violations may result in content removal, temporary suspension, or permanent account termination at DriveTrack\'s discretion. Appeals can be submitted to support@drivetrackapp.ca.',
      },
    ],
  },
} as const;

type DocKey = keyof typeof DOCS;

export function LegalScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const docKey: DocKey = route.params?.doc ?? 'terms';
  const doc = DOCS[docKey];

  return (
    <View style={{ flex: 1 }}>
      <ScreenFrame
        header={
          <AppHeader
            title={doc.title}
            subtitle={doc.version}
            onBack={() => navigation.goBack()}
          />
        }
      >
        {doc.sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </ScreenFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: appTheme.spacing.xl,
    gap: appTheme.spacing.sm,
  },
  heading: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayS,
  },
  body: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.body,
    lineHeight: 22,
  },
});
