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
          <Pressable key={option} style={[styles.choice, value === option && styles.choiceActive]} onPress={() => onChange(option)}>
            <Text style={[styles.choiceText, value === option && styles.choiceTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: appTheme.colors.deepCharcoal,
    fontWeight: '600',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: appTheme.radii.button,
    backgroundColor: appTheme.colors.iceMist,
  },
  choiceActive: {
    backgroundColor: appTheme.colors.playstationBlue,
  },
  choiceText: {
    color: appTheme.colors.deepCharcoal,
    fontWeight: '500',
  },
  choiceTextActive: {
    color: appTheme.colors.inverseWhite,
  },
});
