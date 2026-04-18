import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../../theme';

export function ChoiceRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[styles.choice, value === option && styles.choiceActive]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.choiceText, value === option && styles.choiceTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: appTheme.spacing.sm,
  },
  label: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.sm,
  },
  choice: {
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 10,
    borderRadius: appTheme.radii.button,
    backgroundColor: appTheme.surface.input,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  choiceActive: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderColor: appTheme.colors.playstationBlue,
  },
  choiceText: {
    color: appTheme.colors.secondaryText,
    fontWeight: '500',
    fontSize: 13,
  },
  choiceTextActive: {
    color: appTheme.colors.inverseWhite,
  },
});
