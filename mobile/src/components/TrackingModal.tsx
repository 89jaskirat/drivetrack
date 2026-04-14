import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { ComponentLabel } from './ComponentLabel';
import { appTheme } from '../theme';

export function TrackingModal({
  visible,
  title,
  componentName,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  componentName: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ComponentLabel name={componentName} tone="light" />
          <Text style={styles.title}>{title}</Text>
          <View style={styles.body}>{children}</View>
          <ActionButton label="Close" onPress={onClose} tone="light" />
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
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: appTheme.colors.paperWhite,
    borderTopLeftRadius: appTheme.radii.card,
    borderTopRightRadius: appTheme.radii.card,
    padding: 20,
    gap: 14,
  },
  title: {
    color: appTheme.colors.displayInk,
    fontSize: 28,
    fontWeight: '300',
  },
  body: {
    gap: 12,
  },
  field: {
    gap: 8,
  },
  label: {
    color: appTheme.colors.deepCharcoal,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: appTheme.colors.muteGray,
    borderRadius: appTheme.radii.input,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: appTheme.colors.deepCharcoal,
    backgroundColor: appTheme.colors.paperWhite,
  },
  inputTall: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
});
