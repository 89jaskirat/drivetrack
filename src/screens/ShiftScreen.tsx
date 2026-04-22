import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isStart = mode === 'start';
  const currentOdo = state.currentShift?.startOdo ?? 0;

  async function handlePhoto() {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }

    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      // Fall back to gallery if camera denied
      const galleryResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
      });
      if (!galleryResult.canceled && galleryResult.assets[0]) {
        await runOCR(galleryResult.assets[0].uri);
      }
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await runOCR(result.assets[0].uri);
    }
  }

  async function runOCR(uri: string) {
    setScanning(true);
    setPhotoTaken(true);
    try {
      const result = await TextRecognition.recognize(uri);
      // Find the largest number in recognized text — likely the odometer reading
      const allNumbers = (result.text.match(/\d{4,7}/g) ?? []).map(Number);
      if (allNumbers.length > 0) {
        const best = allNumbers.reduce((a, b) => (b > a ? b : a), 0);
        setOdo(String(best));
      }
    } catch (e) {
      // OCR failed — user can type manually
    } finally {
      setScanning(false);
    }
  }

  function handleWebFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoTaken(true);
    e.target.value = '';
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
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleWebFileChange}
        />
      )}

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

        {/* Camera / OCR button */}
        <Pressable
          onPress={handlePhoto}
          disabled={scanning}
          style={({ pressed }) => [styles.photoButton, photoTaken && styles.photoTaken, pressed && { opacity: 0.7 }]}
        >
          {scanning
            ? <ActivityIndicator color={appTheme.colors.playstationBlue} />
            : <Text style={styles.photoIcon}>{photoTaken ? '✓' : '📷'}</Text>}
          <View style={{ flex: 1 }}>
            <Text style={styles.photoLabel}>
              {scanning ? 'Reading odometer…' : photoTaken ? 'Photo captured' : 'Scan odometer with camera'}
            </Text>
            {!photoTaken && !scanning && (
              <Text style={styles.photoHint}>Tap to open camera · reading auto-filled below</Text>
            )}
          </View>
        </Pressable>

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
          {photoTaken && odo ? (
            <Text style={styles.ocrNote}>✓ Auto-filled from photo — edit if needed</Text>
          ) : null}
        </View>

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
  photoHint: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
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
  ocrNote: {
    color: appTheme.colors.playstationBlue,
    ...appTheme.typography.micro,
  },
});
