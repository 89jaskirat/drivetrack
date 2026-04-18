import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';

export function AppMenu({
  open,
  onClose,
  onProfilePress,
  onSettingsPress,
}: {
  open: boolean;
  onClose: () => void;
  onProfilePress: () => void;
  onSettingsPress: () => void;
}) {
  if (!open) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.drawer}>
        <Text style={styles.title}>Menu</Text>
        <MenuItem
          label="Profile"
          description="Name, phone, email, and account details"
          onPress={onProfilePress}
        />
        <MenuItem
          label="Settings"
          description="Units, GPS consent, and local preferences"
          onPress={onSettingsPress}
        />
      </View>
    </View>
  );
}

function MenuItem({ label, description, onPress }: { label: string; description: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={onPress}
    >
      <Text style={styles.itemTitle}>{label}</Text>
      <Text style={styles.itemBody}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  drawer: {
    width: 300,
    backgroundColor: appTheme.surface.hero,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.base,
    borderLeftWidth: 1,
    borderLeftColor: appTheme.colors.playstationBlue,
  },
  title: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayL,
    marginBottom: appTheme.spacing.sm,
  },
  item: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.base,
    gap: 6,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  itemPressed: {
    borderColor: appTheme.colors.playstationBlue,
  },
  itemTitle: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.headingS,
  },
  itemBody: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.caption,
    lineHeight: 18,
  },
});
