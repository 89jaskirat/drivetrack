import { Pressable, StyleSheet, Text } from 'react-native';
import { appTheme } from '../theme';

export function ActionButton({
  label,
  onPress,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'commerce' | 'ghost';
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        tone === 'commerce' && styles.commerce,
        tone === 'ghost' && styles.ghost,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, tone === 'ghost' && styles.textGhost]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: appTheme.radii.button,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  commerce: {
    backgroundColor: appTheme.colors.commerceOrange,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: appTheme.colors.secondaryText,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.button,
  },
  textGhost: {
    color: appTheme.colors.secondaryText,
  },
});
