import { Pressable, StyleSheet, Text } from 'react-native';
import { appTheme } from '../theme';

export function ActionButton({
  label,
  onPress,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'commerce' | 'light';
}) {
  return (
    <Pressable style={[styles.button, tone === 'commerce' && styles.commerce, tone === 'light' && styles.light]} onPress={onPress}>
      <Text style={[styles.text, tone === 'light' && styles.textLight]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: appTheme.radii.button,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  commerce: {
    backgroundColor: appTheme.colors.commerceOrange,
  },
  light: {
    backgroundColor: appTheme.colors.paperWhite,
    borderWidth: 2,
    borderColor: appTheme.colors.playstationBlue,
  },
  text: {
    color: appTheme.colors.inverseWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  textLight: {
    color: appTheme.colors.playstationBlue,
  },
});
