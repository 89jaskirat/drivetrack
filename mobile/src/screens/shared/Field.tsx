import { StyleSheet, Text, TextInput, View } from 'react-native';
import { appTheme } from '../../theme';

export function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={appTheme.colors.bodyGray}
        style={[styles.input, multiline && styles.tall]}
      />
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
  input: {
    borderWidth: 1,
    borderColor: appTheme.colors.muteGray,
    borderRadius: appTheme.radii.input,
    backgroundColor: appTheme.colors.paperWhite,
    color: appTheme.colors.deepCharcoal,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tall: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
