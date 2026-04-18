import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';

export type FABItem = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'commerce';
};

/** FloatingActionButton — expandable speed-dial in the bottom-right corner */
export function FAB({ items }: { items: FABItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Backdrop */}
      {open && (
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
      )}

      {/* Speed-dial items */}
      {open && (
        <View style={styles.itemList}>
          {[...items].reverse().map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.item,
                item.tone === 'commerce' && styles.itemCommerce,
                pressed && styles.itemPressed,
              ]}
              onPress={() => {
                setOpen(false);
                item.onPress();
              }}
            >
              <Text style={styles.itemLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Main FAB button */}
      <Pressable
        style={({ pressed }) => [styles.fab, open && styles.fabOpen, pressed && styles.fabPressed]}
        onPress={() => setOpen((v) => !v)}
      >
        <Text style={styles.fabIcon}>{open ? '×' : '+'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    // extend backdrop across full screen
    top: -1000,
    left: -1000,
    right: -100,
    bottom: -100,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: -1,
  },
  itemList: {
    gap: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.md,
    alignItems: 'flex-end',
  },
  item: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: appTheme.radii.button,
    paddingHorizontal: appTheme.spacing.xl,
    paddingVertical: 12,
    minWidth: 160,
    alignItems: 'center',
    ...appTheme.elevation.mid,
  },
  itemCommerce: {
    backgroundColor: appTheme.colors.commerceOrange,
  },
  itemPressed: {
    opacity: 0.7,
  },
  itemLabel: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.button,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: appTheme.colors.playstationBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...appTheme.elevation.mid,
  },
  fabOpen: {
    backgroundColor: appTheme.surface.border,
  },
  fabPressed: {
    opacity: 0.8,
  },
  fabIcon: {
    color: appTheme.colors.inverseWhite,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});
