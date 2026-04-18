import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { appTheme } from '../theme';

export function TrackingModal({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.body}>{children}</View>
          <ActionButton label="Close" onPress={onClose} tone="ghost" />
        </View>
      </View>
    </Modal>
  );
}

export function ModalField({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.inputTall]}
        placeholderTextColor={appTheme.colors.bodyGray}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: appTheme.surface.card,
    borderTopLeftRadius: appTheme.radii.cardLarge,
    borderTopRightRadius: appTheme.radii.cardLarge,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.base,
    borderTopWidth: 1,
    borderTopColor: appTheme.surface.border,
  },
  title: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayM,
  },
  body: {
    gap: appTheme.spacing.md,
  },
  field: {
    gap: appTheme.spacing.sm,
  },
  label: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    borderRadius: appTheme.radii.input,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
    color: appTheme.colors.inverseWhite,
    backgroundColor: appTheme.surface.input,
    ...appTheme.typography.body,
  },
  inputTall: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
});
