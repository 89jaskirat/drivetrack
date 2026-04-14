import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';
import { ComponentLabel } from './ComponentLabel';

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
        <ComponentLabel name="BurgerMenuDrawer" />
        <Text style={styles.title}>Menu</Text>
        <Pressable style={styles.item} onPress={onProfilePress}>
          <Text style={styles.itemTitle}>Profile</Text>
          <Text style={styles.itemBody}>Name, phone, email, and account details</Text>
        </Pressable>
        <Pressable style={styles.item} onPress={onSettingsPress}>
          <Text style={styles.itemTitle}>Settings</Text>
          <Text style={styles.itemBody}>Units, GPS consent, and local preferences</Text>
        </Pressable>
      </View>
    </View>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    width: 290,
    backgroundColor: appTheme.colors.shadowBlack,
    padding: 20,
    gap: 16,
    borderLeftWidth: 1,
    borderLeftColor: appTheme.colors.playstationBlue,
  },
  title: {
    color: appTheme.colors.inverseWhite,
    fontSize: 30,
    fontWeight: '300',
  },
  item: {
    backgroundColor: appTheme.colors.paperWhite,
    borderRadius: appTheme.radii.card,
    padding: 16,
    gap: 6,
  },
  itemTitle: {
    color: appTheme.colors.displayInk,
    fontSize: 18,
    fontWeight: '700',
  },
  itemBody: {
    color: appTheme.colors.bodyGray,
    lineHeight: 20,
  },
});
