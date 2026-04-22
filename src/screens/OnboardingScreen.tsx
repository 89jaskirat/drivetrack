import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../state/AppStateContext';
import { detectZone, SUPPORTED_ZONES } from '../services/zoneDetectionService';
import { upsertProfile } from '../services/syncService';
import { supabase } from '../lib/supabase';
import { appTheme } from '../theme';

const ONBOARDING_DONE_KEY = 'drivetrack-onboarding-complete';

// ── NHTSA vehicle API ─────────────────────────────────────────────────────────
const NHTSA = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const COMMON_MAKES = [
  'Acura','Audi','BMW','Chevrolet','Ford','GMC','Honda','Hyundai','Kia',
  'Lexus','Mazda','Mercedes-Benz','Nissan','Subaru','Tesla','Toyota','Volkswagen',
];
const YEARS = Array.from({ length: 25 }, (_, i) => String(new Date().getFullYear() - i));

async function fetchMakes(): Promise<string[]> {
  try {
    const res = await fetch(`${NHTSA}/GetMakesForVehicleType/car?format=json`);
    const json = await res.json();
    return (json.Results as any[]).map((r) => (r.MakeName || r.Make_Name || '') as string).filter(Boolean).sort();
  } catch { return []; }
}

async function fetchModels(make: string, year: string): Promise<string[]> {
  try {
    const res = await fetch(`${NHTSA}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`);
    const json = await res.json();
    return (json.Results as { Model_Name: string }[]).map((r) => r.Model_Name).sort();
  } catch { return []; }
}

const TERMS_TEXT = `DriveTrack — Terms and Conditions
Version 1.0 · Last Updated: 2026-04-21

IMPORTANT: This is a draft pending legal review before public launch.

1. ACCEPTANCE OF TERMS
By using the DriveTrack application you agree to be legally bound by these Terms and our Privacy Policy. If you do not agree, you must not use the App.

2. DESCRIPTION OF SERVICE
DriveTrack is a companion app for Canadian rideshare and gig-economy drivers. It provides expense & mileage tracking, fuel log management, community forums, gas price aggregation, deals & promotions, and zone-based information.

3. ELIGIBILITY
You must be at least 18 years of age, a Canadian resident or authorized worker, and possess the legal capacity to enter into a binding contract to use the App.

4. ACCOUNT REGISTRATION
You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and keep it up to date.

5. PRIVACY & DATA
Your data is handled in accordance with our Privacy Policy and Canadian PIPEDA regulations. Location data is collected only with your explicit consent and can be revoked at any time.

6. COMMUNITY GUIDELINES
You agree not to post content that is abusive, misleading, illegal, or violates the rights of others. Violations may result in account suspension or termination.

7. LIMITATION OF LIABILITY
DriveTrack is provided "as-is" without warranties of any kind. We are not liable for indirect, incidental, or consequential damages arising from your use of the App.

8. GOVERNING LAW
These Terms are governed by the laws of Canada and the Province of Ontario.

9. CHANGES TO TERMS
We may update these Terms from time to time. Continued use of the App constitutes acceptance of the revised Terms.

For the full Terms and Privacy Policy, visit Settings → Legal Documents within the App.`;

type Step = 'welcome' | 'terms' | 'zone' | 'vehicle';

interface Props {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const { state, updateProfile } = useAppState();
  const [step, setStep] = useState<Step>('welcome');

  // Terms step
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [acceptingTerms, setAcceptingTerms] = useState(false);

  // Zone step
  const [detectedZone, setDetectedZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState('Calgary');
  const [detectingZone, setDetectingZone] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);

  // Vehicle step
  const [vehicleMake, setVehicleMake] = useState(state.profile.vehicleMake ?? '');
  const [vehicleModel, setVehicleModel] = useState(state.profile.vehicleModel ?? '');
  const [vehicleYear, setVehicleYear] = useState(
    state.profile.vehicleYear ? String(state.profile.vehicleYear) : '',
  );
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Fade animation between steps
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function transitionTo(next: Step) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  // Auto-detect zone when entering zone step
  useEffect(() => {
    if (step !== 'zone') return;
    setDetectingZone(true);
    detectZone().then((zone) => {
      setDetectingZone(false);
      if (zone) {
        setDetectedZone(zone);
        setSelectedZone(zone);
      }
    });
  }, [step]);

  async function handleAcceptTerms() {
    if (!termsAgreed) return;
    setAcceptingTerms(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (uid) {
        await upsertProfile({
          id: uid,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          terms_version: 1,
        });
        updateProfile({ termsAccepted: true, termsAcceptedAt: new Date().toISOString(), termsVersion: 1 });
      }
      transitionTo('zone');
    } finally {
      setAcceptingTerms(false);
    }
  }

  function handleConfirmZone() {
    updateProfile({ zone: selectedZone });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id) {
        upsertProfile({ id: data.session.user.id, zone: selectedZone });
      }
    });
    transitionTo('vehicle');
  }

  async function handleFinish(saveVehicle: boolean) {
    setSavingVehicle(true);
    try {
      if (saveVehicle && (vehicleMake || vehicleModel)) {
        const year = vehicleYear ? parseInt(vehicleYear, 10) : undefined;
        updateProfile({ vehicleMake, vehicleModel, vehicleYear: year });
        const { data } = await supabase.auth.getSession();
        if (data.session?.user?.id) {
          await upsertProfile({
            id: data.session.user.id,
            vehicle_make: vehicleMake,
            vehicle_model: vehicleModel,
            vehicle_year: year ?? null,
          });
        }
      }
      await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
      onComplete();
    } finally {
      setSavingVehicle(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {step === 'welcome' && <WelcomeStep onNext={() => transitionTo('terms')} />}
        {step === 'terms' && (
          <TermsStep
            hasScrolled={hasScrolledTerms}
            agreed={termsAgreed}
            accepting={acceptingTerms}
            onScroll={() => setHasScrolledTerms(true)}
            onToggleAgreed={() => setTermsAgreed((v) => !v)}
            onAccept={handleAcceptTerms}
          />
        )}
        {step === 'zone' && (
          <ZoneStep
            detecting={detectingZone}
            detected={detectedZone}
            selected={selectedZone}
            showPicker={showZonePicker}
            onTogglePicker={() => setShowZonePicker((v) => !v)}
            onSelectZone={(z) => { setSelectedZone(z); setShowZonePicker(false); }}
            onSkip={() => transitionTo('vehicle')}
            onConfirm={handleConfirmZone}
          />
        )}
        {step === 'vehicle' && (
          <VehicleStep
            make={vehicleMake}
            model={vehicleModel}
            year={vehicleYear}
            saving={savingVehicle}
            onChangeMake={setVehicleMake}
            onChangeModel={setVehicleModel}
            onChangeYear={setVehicleYear}
            onSkip={() => handleFinish(false)}
            onSave={() => handleFinish(true)}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

// ── Step: Welcome ─────────────────────────────────────────────────────────────

const TAGLINES = ['Track Earnings', 'Optimize Fuel', 'Connect with Drivers'];

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const glowAnims = useRef(TAGLINES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  useEffect(() => {
    let current = 0;
    const tick = () => {
      const next = (current + 1) % TAGLINES.length;
      Animated.parallel([
        Animated.timing(glowAnims[current], { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.timing(glowAnims[next], { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
      current = next;
      setActiveIndex(next);
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.stepCenter}>
      <View style={styles.appLogoWrap}>
        <Image
          source={require('../../assets/adaptive-icon.png')}
          style={styles.appLogo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.welcomeTitle}>Welcome to DriveTrack</Text>
      <View style={styles.taglineList}>
        {TAGLINES.map((label, i) => (
          <Animated.Text
            key={label}
            style={[
              styles.taglineText,
              {
                color: glowAnims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [appTheme.colors.bodyGray, appTheme.colors.inverseWhite],
                }),
                fontSize: glowAnims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [15, 18],
                }),
                fontWeight: activeIndex === i ? '600' : '400',
              },
            ]}
          >
            {label}
          </Animated.Text>
        ))}
      </View>
      <Pressable style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

// ── Step: Terms & Conditions ──────────────────────────────────────────────────

function TermsStep({
  hasScrolled,
  agreed,
  accepting,
  onScroll,
  onToggleAgreed,
  onAccept,
}: {
  hasScrolled: boolean;
  agreed: boolean;
  accepting: boolean;
  onScroll: () => void;
  onToggleAgreed: () => void;
  onAccept: () => void;
}) {
  function handleScroll(e: any) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isNearBottom) onScroll();
  }

  return (
    <View style={styles.stepFull}>
      <Text style={styles.stepTitle}>Terms & Conditions</Text>
      <Text style={styles.stepSub}>Please read and accept before continuing.</Text>

      <ScrollView
        style={styles.termsScroll}
        contentContainerStyle={styles.termsContent}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        showsVerticalScrollIndicator
      >
        <Text style={styles.termsText}>{TERMS_TEXT}</Text>
      </ScrollView>

      {!hasScrolled && (
        <Text style={styles.scrollHint}>↓ Scroll to the bottom to accept</Text>
      )}

      <Pressable style={styles.checkRow} onPress={onToggleAgreed}>
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
          {agreed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkLabel}>
          I have read and agree to the Terms & Conditions and Privacy Policy
        </Text>
      </Pressable>

      <View style={styles.rowActions}>
        <Pressable
          style={[styles.primaryBtn, styles.flex1, (!hasScrolled || !agreed || accepting) && styles.btnDisabled]}
          onPress={onAccept}
          disabled={!hasScrolled || !agreed || accepting}
        >
          {accepting
            ? <ActivityIndicator color={appTheme.colors.inverseWhite} />
            : <Text style={styles.primaryBtnText}>Accept & Continue</Text>}
        </Pressable>
      </View>
    </View>
  );
}

// ── Step: Zone Detection ──────────────────────────────────────────────────────

function ZoneStep({
  detecting,
  detected,
  selected,
  showPicker,
  onTogglePicker,
  onSelectZone,
  onSkip,
  onConfirm,
}: {
  detecting: boolean;
  detected: string | null;
  selected: string;
  showPicker: boolean;
  onTogglePicker: () => void;
  onSelectZone: (z: string) => void;
  onSkip: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.stepCenter}>
      <Text style={styles.stepIcon}>📍</Text>
      <Text style={styles.stepTitle}>Where do you drive?</Text>
      <Text style={styles.stepSub}>
        We'll show you relevant gas prices, deals, and community posts for your area.
      </Text>

      {detecting ? (
        <View style={styles.detectingRow}>
          <ActivityIndicator color={appTheme.colors.playstationBlue} />
          <Text style={styles.detectingText}>Detecting your location…</Text>
        </View>
      ) : (
        <>
          {detected && (
            <Text style={styles.detectedLabel}>
              📍 Detected: <Text style={styles.detectedZone}>{detected}</Text>
            </Text>
          )}

          <Pressable style={styles.zonePicker} onPress={onTogglePicker}>
            <Text style={styles.zonePickerText}>{selected}</Text>
            <Text style={styles.zonePickerChevron}>▾</Text>
          </Pressable>

          {showPicker && (
            <ScrollView style={styles.zoneList} nestedScrollEnabled>
              {SUPPORTED_ZONES.map((z) => (
                <Pressable
                  key={z}
                  style={[styles.zoneItem, z === selected && styles.zoneItemSelected]}
                  onPress={() => onSelectZone(z)}
                >
                  <Text style={[styles.zoneItemText, z === selected && styles.zoneItemTextSelected]}>
                    {z}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </>
      )}

      <View style={[styles.rowActions, { marginTop: appTheme.spacing.xl }]}>
        <Pressable style={[styles.secondaryBtn, styles.flex1]} onPress={onSkip}>
          <Text style={styles.secondaryBtnText}>Skip</Text>
        </Pressable>
        <Pressable style={[styles.primaryBtn, styles.flex1]} onPress={onConfirm} disabled={detecting}>
          <Text style={styles.primaryBtnText}>Confirm</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Step: Vehicle ─────────────────────────────────────────────────────────────

function VehicleStep({
  make, model, year, saving, onChangeMake, onChangeModel, onChangeYear, onSkip, onSave,
}: {
  make: string; model: string; year: string; saving: boolean;
  onChangeMake: (v: string) => void;
  onChangeModel: (v: string) => void;
  onChangeYear: (v: string) => void;
  onSkip: () => void;
  onSave: () => void;
}) {
  const [makes, setMakes] = useState<string[]>(COMMON_MAKES);
  const [models, setModels] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [openPicker, setOpenPicker] = useState<'year' | 'make' | 'model' | null>(null);

  useEffect(() => {
    setLoadingMakes(true);
    fetchMakes().then((m) => { if (m.length > 0) setMakes(m); setLoadingMakes(false); });
  }, []);

  useEffect(() => {
    if (!make || !year) { setModels([]); return; }
    setLoadingModels(true);
    fetchModels(make, year).then((m) => { setModels(m); setLoadingModels(false); });
  }, [make, year]);

  const hasData = make.trim().length > 0 || model.trim().length > 0;

  return (
    <>
      <View style={styles.stepCenter}>
        <Text style={styles.stepIcon}>🚘</Text>
        <Text style={styles.stepTitle}>Your Vehicle</Text>
        <Text style={styles.stepSub}>
          Optional — helps us calculate accurate fuel efficiency metrics.
        </Text>

        <View style={styles.vehicleFields}>
          <VehicleDropdown label="Year" value={year} placeholder="Select year"
            onPress={() => setOpenPicker('year')} />
          <VehicleDropdown label="Make" value={make} placeholder="Select make"
            onPress={() => setOpenPicker('make')} />
          <VehicleDropdown label="Model" value={model}
            placeholder={!make || !year ? 'Select make & year first' : 'Select model'}
            disabled={!make || !year}
            onPress={() => setOpenPicker('model')} />
        </View>

        <View style={[styles.rowActions, { marginTop: appTheme.spacing.xl }]}>
          <Pressable style={[styles.secondaryBtn, styles.flex1]} onPress={onSkip} disabled={saving}>
            <Text style={styles.secondaryBtnText}>Skip</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryBtn, styles.flex1, !hasData && styles.btnDisabled]}
            onPress={onSave}
            disabled={saving || !hasData}
          >
            {saving
              ? <ActivityIndicator color={appTheme.colors.inverseWhite} />
              : <Text style={styles.primaryBtnText}>Save & Finish</Text>}
          </Pressable>
        </View>
      </View>

      <VehiclePickerModal visible={openPicker === 'year'} title="Year"
        options={YEARS} onSelect={(v) => { onChangeMake(make); onChangeYear(v); onChangeModel(''); setOpenPicker(null); }}
        onClose={() => setOpenPicker(null)} />
      <VehiclePickerModal visible={openPicker === 'make'} title="Make"
        options={makes} loading={loadingMakes}
        onSelect={(v) => { onChangeMake(v); onChangeModel(''); setOpenPicker(null); }}
        onClose={() => setOpenPicker(null)} />
      <VehiclePickerModal visible={openPicker === 'model'} title="Model"
        options={models} loading={loadingModels}
        onSelect={(v) => { onChangeModel(v); setOpenPicker(null); }}
        onClose={() => setOpenPicker(null)} />
    </>
  );
}

function VehicleDropdown({ label, value, placeholder, disabled, onPress }: {
  label: string; value: string; placeholder: string; disabled?: boolean; onPress: () => void;
}) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        style={[styles.dropdown, disabled && styles.dropdownDisabled]}
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
      >
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownChevron}>▾</Text>
      </Pressable>
    </View>
  );
}

function VehiclePickerModal({ visible, title, options, loading, onSelect, onClose }: {
  visible: boolean; title: string; options: string[]; loading?: boolean;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  useEffect(() => { if (visible) setQuery(''); }, [visible]);
  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={pickerStyles.overlay} onPress={onClose}>
        <Pressable style={pickerStyles.sheet} onPress={() => {}}>
          <View style={pickerStyles.header}>
            <Text style={pickerStyles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}><Text style={pickerStyles.close}>✕</Text></Pressable>
          </View>
          <View style={pickerStyles.searchWrap}>
            <TextInput
              style={pickerStyles.search}
              placeholder={`Search ${title.toLowerCase()}…`}
              placeholderTextColor={appTheme.colors.bodyGray}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <View style={{ flex: 1 }}>
            {loading
              ? <ActivityIndicator color={appTheme.colors.playstationBlue} style={{ marginTop: 40 }} />
              : <FlatList
                  data={filtered}
                  keyExtractor={(item, i) => `${item}-${i}`}
                  keyboardShouldPersistTaps="always"
                  renderItem={({ item }) => (
                    <Pressable
                      style={({ pressed }) => [pickerStyles.item, pressed && pickerStyles.itemPressed]}
                      onPress={() => onSelect(item)}
                    >
                      <Text style={pickerStyles.itemText}>{item}</Text>
                    </Pressable>
                  )}
                  ListEmptyComponent={<Text style={pickerStyles.empty}>No results</Text>}
                />
            }
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: appTheme.surface.screen,
  },
  container: {
    flex: 1,
  },
  stepCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.xl,
    gap: appTheme.spacing.lg,
  },
  stepFull: {
    flex: 1,
    paddingHorizontal: appTheme.spacing.xl,
    paddingTop: appTheme.spacing.xl,
    gap: appTheme.spacing.md,
  },
  appLogoWrap: {
    width: 180,
    height: 180,
    borderRadius: 36,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  appLogo: {
    width: 180,
    height: 180,
  },
  taglineList: {
    gap: appTheme.spacing.md,
    alignItems: 'center',
  },
  taglineText: {
    textAlign: 'center',
  },
  stepIcon: {
    fontSize: 48,
  },
  welcomeTitle: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayL,
    textAlign: 'center',
  },
  stepTitle: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayM,
    textAlign: 'center',
  },
  stepSub: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: appTheme.radii.button,
    paddingVertical: 14,
    paddingHorizontal: appTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryBtnText: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.button,
  },
  secondaryBtn: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.button,
    paddingVertical: 14,
    paddingHorizontal: appTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    minHeight: 48,
  },
  secondaryBtnText: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.button,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  flex1: {
    flex: 1,
  },
  rowActions: {
    flexDirection: 'row',
    gap: appTheme.spacing.md,
    width: '100%',
  },
  // Terms
  termsScroll: {
    flex: 1,
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  termsContent: {
    padding: appTheme.spacing.xl,
  },
  termsText: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.caption,
    lineHeight: 20,
  },
  scrollHint: {
    color: appTheme.colors.playstationBlue,
    ...appTheme.typography.caption,
    textAlign: 'center',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: appTheme.surface.border,
    backgroundColor: appTheme.surface.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderColor: appTheme.colors.playstationBlue,
  },
  checkmark: {
    color: appTheme.colors.inverseWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  checkLabel: {
    flex: 1,
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.caption,
    lineHeight: 18,
  },
  // Zone
  detectingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
  },
  detectingText: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.body,
  },
  detectedLabel: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.body,
  },
  detectedZone: {
    color: appTheme.colors.inverseWhite,
    fontWeight: '700',
  },
  zonePicker: {
    width: '100%',
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.button,
    borderWidth: 1,
    borderColor: appTheme.colors.playstationBlue,
    paddingVertical: 14,
    paddingHorizontal: appTheme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zonePickerText: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.body,
    fontWeight: '600',
  },
  zonePickerChevron: {
    color: appTheme.colors.playstationBlue,
    fontSize: 16,
  },
  zoneList: {
    width: '100%',
    maxHeight: 220,
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  zoneItem: {
    paddingVertical: 12,
    paddingHorizontal: appTheme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.surface.border,
  },
  zoneItemSelected: {
    backgroundColor: appTheme.colors.playstationBlue + '22',
  },
  zoneItemText: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.body,
  },
  zoneItemTextSelected: {
    color: appTheme.colors.inverseWhite,
    fontWeight: '600',
  },
  // Vehicle
  formGroup: {
    width: '100%',
    gap: appTheme.spacing.xs,
  },
  fieldLabel: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.caption,
    fontWeight: '600',
  },
  input: {
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.button,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    paddingVertical: 12,
    paddingHorizontal: appTheme.spacing.xl,
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.body,
  },
  vehicleFields: {
    width: '100%',
    gap: appTheme.spacing.md,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    borderRadius: appTheme.radii.input,
    backgroundColor: appTheme.surface.input,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownDisabled: { opacity: 0.4 },
  dropdownText: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.body,
    flex: 1,
  },
  dropdownPlaceholder: { color: appTheme.colors.bodyGray },
  dropdownChevron: { color: appTheme.colors.bodyGray, fontSize: 14, marginLeft: 8 },
});

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: appTheme.surface.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '75%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.surface.border,
  },
  title: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.headingS,
  },
  close: {
    color: appTheme.colors.bodyGray,
    fontSize: 18,
  },
  searchWrap: {
    paddingHorizontal: appTheme.spacing.base,
    paddingVertical: appTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.surface.border,
  },
  search: {
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.input,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.body,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  item: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.surface.border,
  },
  itemPressed: { backgroundColor: appTheme.surface.input },
  itemText: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.body,
  },
  empty: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.body,
    textAlign: 'center',
    marginTop: 40,
  },
});
