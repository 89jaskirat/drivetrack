import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';

export function AppHeader({
  title,
  subtitle,
  onMenuPress,
  onProfilePress,
  onBack,
}: {
  title: string;
  subtitle: string;
  onMenuPress?: () => void;
  onProfilePress?: () => void;
  onBack?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {/* Back button — shown on detail screens instead of logo/avatar */}
        {onBack ? (
          <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
        ) : null}

        {/* Name + zone — tappable to open profile */}
        <Pressable onPress={onProfilePress} style={styles.profileBlock} disabled={!onProfilePress}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Pressable>

        {/* Burger menu — top-right, opens drawer from right */}
        {onMenuPress ? (
          <Pressable onPress={onMenuPress} style={({ pressed }) => [styles.menuButton, pressed && styles.buttonPressed]}>
            <Text style={styles.menuText}>≡</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
    paddingBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: appTheme.radii.button,
    borderWidth: 1.5,
    borderColor: appTheme.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: appTheme.colors.inverseWhite,
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 20,
  },
  profileBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayL,
  },
  subtitle: {
    color: appTheme.colors.darkLinkBlue,
    ...appTheme.typography.caption,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: appTheme.radii.button,
    backgroundColor: appTheme.colors.playstationBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  menuText: {
    color: appTheme.colors.inverseWhite,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
});
