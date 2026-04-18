import { useNavigation, useRoute } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../components/ActionButton';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';

/** ShiftScreen — logs odometer + (on end) earnings when starting or ending a shift */
export function ShiftScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode: 'start' | 'end' = route.params?.mode ?? 'start';

  const { state, startShift, endShift } = useAppState();
  const [odo, setOdo] = useState('');
  const [earnings, setEarnings] = useState('');
  const [photoTaken, setPhotoTaken] = useState(false);
  const fileInputRef = useRef<any>(null);

  const isStart = mode === 'start';
  const currentOdo = state.currentShift?.startOdo ?? 0;

  function handlePhoto() {
    if (Platform.OS === 'web') {
      // On web: trigger a hidden file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          // For the prototype we just acknowledge the photo was taken
          setPhotoTaken(true);
        }
      };
      input.click();
    } else {
      // Native: would use expo-camera — placeholder for now
      setPhotoTaken(true);
    }
  }

  function handleSubmit() {
    const odoNum = Number(odo);
    if (!odoNum) return;
    if (isStart) {
      startShift(odoNum);
    } else {
      endShift(odoNum, Number(earnings) || 0);
    }
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>{isStart ? 'Start shift' : 'End shift'}</Text>
      </View>

      <View style={styles.content}>
        {/* Context */}
        {!isStart && state.currentShift && (
          <View style={styles.contextCard}>
            <Text style={styles.contextLabel}>Shift started</Text>
            <Text style={styles.contextValue}>
              {new Date(state.currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={[styles.contextLabel, { marginTop: 8 }]}>Start odometer</Text>
            <Text style={styles.contextValue}>{currentOdo.toLocaleString()} km</Text>
          </View>
        )}

        {/* Odometer entry */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {isStart ? 'Start odometer (km)' : 'End odometer (km)'}
          </Text>
          <TextInput
            value={odo}
            onChangeText={setOdo}
            keyboardType="numeric"
            placeholder={isStart ? 'e.g. 128440' : `e.g. ${currentOdo + 150}`}
            placeholderTextColor={appTheme.colors.bodyGray}
            style={styles.input}
          />
        </View>

        {/* Photo capture */}
        <Pressable
          onPress={handlePhoto}
          style={({ pressed }) => [styles.photoButton, photoTaken && styles.photoTaken, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.photoIcon}>{photoTaken ? '✓' : '📷'}</Text>
          <Text style={styles.photoLabel}>
            {photoTaken ? 'Photo captured' : 'Take photo of odometer'}
          </Text>
        </Pressable>

        {/* Earnings — end mode only */}
        {!isStart && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Shift earnings ($)</Text>
            <TextInput
              value={earnings}
              onChangeText={setEarnings}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={appTheme.colors.bodyGray}
              style={styles.input}
            />
          </View>
        )}

        <ActionButton
          label={isStart ? 'Start shift' : 'End shift & save'}
          onPress={handleSubmit}
          tone={isStart ? 'primary' : 'commerce'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: appTheme.surface.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    paddingHorizontal: appTheme.spacing.base,
    paddingTop: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: appTheme.radii.button,
    borderWidth: 1.5,
    borderColor: appTheme.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: appTheme.colors.inverseWhite,
    fontSize: 18,
    fontWeight: '400',
  },
  title: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayL,
  },
  content: {
    flex: 1,
    paddingHorizontal: appTheme.spacing.base,
    gap: appTheme.spacing.base,
    paddingTop: appTheme.spacing.sm,
  },
  contextCard: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.lg,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  contextLabel: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contextValue: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayS,
    marginTop: 2,
  },
  section: {
    gap: appTheme.spacing.sm,
  },
  sectionLabel: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    borderRadius: appTheme.radii.input,
    backgroundColor: appTheme.surface.input,
    color: appTheme.colors.inverseWhite,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
    ...appTheme.typography.displayS,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.lg,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  photoTaken: {
    borderColor: appTheme.colors.playstationBlue,
  },
  photoIcon: {
    fontSize: 24,
  },
  photoLabel: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.body,
  },
});
