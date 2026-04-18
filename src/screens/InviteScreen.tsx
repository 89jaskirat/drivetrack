import { useNavigation } from '@react-navigation/native';
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';

const APP_STORE_URL = 'https://drivercompanion.app'; // placeholder deeplink

function buildInviteText(name: string, zone: string) {
  return `Hey! ${name} invited you to Driver Companion — the app I use to track mileage, earnings, and expenses while driving in ${zone}.\n\nJoin here: ${APP_STORE_URL}`;
}

// Simple QR-code-like visual placeholder (22×22 grid of colored cells)
// A real scannable QR requires react-native-qrcode-svg — this is a stand-in.
function QRPlaceholder({ value }: { value: string }) {
  // Deterministic "pattern" from the string
  const seed = value.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const size = 13;
  const cells: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    cells[r] = [];
    for (let c = 0; c < size; c++) {
      // finder pattern corners
      const inCorner =
        (r < 3 && c < 3) ||
        (r < 3 && c >= size - 3) ||
        (r >= size - 3 && c < 3);
      cells[r][c] = inCorner || ((seed * (r + 1) * (c + 1)) % 7 < 3);
    }
  }
  const cell = 14;
  return (
    <View style={qrStyles.outer}>
      <View style={qrStyles.inner}>
        {cells.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((on, ci) => (
              <View
                key={ci}
                style={{
                  width: cell,
                  height: cell,
                  backgroundColor: on ? appTheme.colors.inverseWhite : appTheme.colors.consoleBlack,
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={qrStyles.note}>
        <Text style={qrStyles.noteText}>Add react-native-qrcode-svg for scannable QR</Text>
      </View>
    </View>
  );
}

const qrStyles = StyleSheet.create({
  outer: { alignItems: 'center', gap: appTheme.spacing.sm },
  inner: {
    borderWidth: 3,
    borderColor: appTheme.colors.inverseWhite,
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  note: {
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.button,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 6,
  },
  noteText: {
    color: appTheme.colors.bodyGray,
    fontSize: 10,
    fontWeight: '500',
  },
});

export function InviteScreen() {
  const navigation = useNavigation<any>();
  const { state } = useAppState();
  const inviteText = buildInviteText(state.profile.name, state.profile.zone);

  function sendSMS() {
    const body = encodeURIComponent(inviteText);
    Linking.openURL(`sms:?body=${body}`).catch(() => {
      Share.share({ message: inviteText });
    });
  }

  function sendWhatsApp() {
    const body = encodeURIComponent(inviteText);
    Linking.openURL(`whatsapp://send?text=${body}`).catch(() => {
      Share.share({ message: inviteText });
    });
  }

  function shareLink() {
    Share.share({ message: inviteText, title: 'Join Driver Companion' });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Invite drivers</Text>
      </View>

      <View style={styles.content}>
        {/* QR code section */}
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Share your invite</Text>
          <Text style={styles.qrSub}>
            Show this to a driver and they can join your {state.profile.zone} community.
          </Text>
          <View style={styles.qrWrap}>
            <QRPlaceholder value={APP_STORE_URL} />
          </View>
          <View style={styles.linkBox}>
            <Text style={styles.linkLabel}>Invite link</Text>
            <Text style={styles.linkValue} numberOfLines={1}>{APP_STORE_URL}</Text>
          </View>
        </View>

        {/* Share buttons */}
        <Text style={styles.sectionLabel}>Send invite via</Text>
        <View style={styles.shareGrid}>
          <ShareBtn icon="💬" label="SMS" onPress={sendSMS} />
          <ShareBtn icon="🟢" label="WhatsApp" onPress={sendWhatsApp} />
          <ShareBtn icon="↑" label="Share..." onPress={shareLink} />
        </View>

        <View style={styles.invitePreview}>
          <Text style={styles.invitePreviewLabel}>Message preview</Text>
          <Text style={styles.invitePreviewText}>{inviteText}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ShareBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <Text style={styles.shareBtnIcon}>{icon}</Text>
      <Text style={styles.shareBtnLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: appTheme.surface.screen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    paddingHorizontal: appTheme.spacing.base,
    paddingTop: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.md,
  },
  backButton: { paddingVertical: 6, paddingRight: appTheme.spacing.sm },
  backText: { color: appTheme.colors.playstationBlue, ...appTheme.typography.body, fontWeight: '600' },
  screenTitle: { color: appTheme.colors.inverseWhite, ...appTheme.typography.displayL },
  content: {
    flex: 1,
    paddingHorizontal: appTheme.spacing.base,
    gap: appTheme.spacing.base,
  },
  qrCard: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    ...appTheme.elevation.low,
  },
  qrTitle: { color: appTheme.colors.inverseWhite, ...appTheme.typography.headingS },
  qrSub: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  qrWrap: { alignItems: 'center' },
  linkBox: {
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.input,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    width: '100%',
    gap: 2,
  },
  linkLabel: { color: appTheme.colors.bodyGray, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  linkValue: { color: appTheme.colors.darkLinkBlue, fontSize: 13, fontWeight: '500' },
  sectionLabel: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  shareGrid: {
    flexDirection: 'row',
    gap: appTheme.spacing.md,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.lg,
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  shareBtnIcon: { fontSize: 28 },
  shareBtnLabel: { color: appTheme.colors.secondaryText, fontSize: 12, fontWeight: '600' },
  invitePreview: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    borderLeftWidth: 3,
    borderLeftColor: appTheme.colors.playstationBlue,
  },
  invitePreviewLabel: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  invitePreviewText: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.caption,
    lineHeight: 20,
  },
});
