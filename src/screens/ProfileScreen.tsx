import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { ScreenFrame } from '../components/ScreenFrame';
import { SurfaceCard } from '../components/SurfaceCard';
import { zones } from '../data/seed';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';
import { ChoiceRow } from './shared/ChoiceRow';

// NHTSA free API — no key required
const NHTSA = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// Common makes sold in Canada — shown instantly while NHTSA loads
const COMMON_MAKES = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
  'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia',
  'Land Rover', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi',
  'Nissan', 'Pontiac', 'RAM', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
];

const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

async function fetchMakes(): Promise<string[]> {
  try {
    const res = await fetch(`${NHTSA}/GetMakesForVehicleType/car?format=json`);
    const json = await res.json();
    return (json.Results as { Make_Name: string }[]).map((r) => r.Make_Name).sort();
  } catch {
    return [];
  }
}

async function fetchModels(make: string, year: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${NHTSA}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`,
    );
    const json = await res.json();
    return (json.Results as { Model_Name: string }[]).map((r) => r.Model_Name).sort();
  } catch {
    return [];
  }
}

// ── Picker Modal ──────────────────────────────────────────────────────────────

function PickerModal({
  visible,
  title,
  options,
  loading,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  loading?: boolean;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [visible]);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          {/* Header */}
          <View style={modal.header}>
            <Text style={modal.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={modal.close}>✕</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View style={modal.searchWrap}>
            <TextInput
              ref={inputRef}
              style={modal.search}
              placeholder={`Search ${title.toLowerCase()}…`}
              placeholderTextColor={appTheme.colors.bodyGray}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          {/* List */}
          {loading ? (
            <ActivityIndicator
              color={appTheme.colors.playstationBlue}
              style={{ marginTop: 40 }}
            />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [modal.item, pressed && modal.itemPressed]}
                  onPress={() => { onSelect(item); onClose(); }}
                >
                  <Text style={modal.itemText}>{item}</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={modal.empty}>No results for "{query}"</Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── DropdownField — a pressable field that opens the picker modal ─────────────

function DropdownField({
  label,
  value,
  placeholder,
  disabled,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
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

// ── Main screen ───────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { state, updateProfile, refreshFromCloud } = useAppState();
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState({
    name: state.profile.name,
    phone: state.profile.phone,
    email: state.profile.email,
    zone: state.profile.zone,
    vehicleMake: state.profile.vehicleMake ?? '',
    vehicleModel: state.profile.vehicleModel ?? '',
    vehicleYear: state.profile.vehicleYear ? String(state.profile.vehicleYear) : '',
  });

  // NHTSA data
  const [makes, setMakes] = useState<string[]>(COMMON_MAKES);
  const [models, setModels] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Modal state
  const [openPicker, setOpenPicker] = useState<'year' | 'make' | 'model' | null>(null);

  // Load full NHTSA make list once when editing opens
  useEffect(() => {
    if (!editing) return;
    setLoadingMakes(true);
    fetchMakes().then((m) => {
      if (m.length > 0) setMakes(m);
      setLoadingMakes(false);
    });
  }, [editing]);

  // Load models when make + year change
  useEffect(() => {
    if (!draft.vehicleMake || !draft.vehicleYear) { setModels([]); return; }
    setLoadingModels(true);
    fetchModels(draft.vehicleMake, draft.vehicleYear).then((m) => {
      setModels(m);
      setLoadingModels(false);
    });
  }, [draft.vehicleMake, draft.vehicleYear]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFromCloud();
    setRefreshing(false);
  }, [refreshFromCloud]);

  function handleSave() {
    updateProfile({
      ...draft,
      vehicleYear: draft.vehicleYear ? Number(draft.vehicleYear) : undefined,
    });
    setEditing(false);
  }

  function handleCancel() {
    setDraft({
      name: state.profile.name,
      phone: state.profile.phone,
      email: state.profile.email,
      zone: state.profile.zone,
      vehicleMake: state.profile.vehicleMake ?? '',
      vehicleModel: state.profile.vehicleModel ?? '',
      vehicleYear: state.profile.vehicleYear ? String(state.profile.vehicleYear) : '',
    });
    setEditing(false);
  }

  return (
    <>
      <ScreenFrame
        onRefresh={handleRefresh}
        refreshing={refreshing}
        header={
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Profile</Text>
            <Pressable onPress={editing ? handleCancel : () => setEditing(true)} style={styles.editButton}>
              <Text style={styles.editButtonText}>{editing ? 'Cancel' : 'Edit'}</Text>
            </Pressable>
          </View>
        }
      >
        {editing ? (
          <>
            <SurfaceCard title="Edit profile">
              <EditField label="Name" value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} />
              <EditField label="Phone" value={draft.phone} onChangeText={(v) => setDraft({ ...draft, phone: v })} keyboardType="phone-pad" />
              <EditField label="Email" value={draft.email} onChangeText={(v) => setDraft({ ...draft, email: v })} keyboardType="email-address" />
              <ChoiceRow label="Zone" options={zones} value={draft.zone} onChange={(v) => setDraft({ ...draft, zone: v })} />
            </SurfaceCard>

            <SurfaceCard title="Vehicle" subtitle="Used for fuel efficiency calculations">
              <DropdownField
                label="Year"
                value={draft.vehicleYear}
                placeholder="Select year"
                onPress={() => setOpenPicker('year')}
              />
              <DropdownField
                label="Make"
                value={draft.vehicleMake}
                placeholder="Select make"
                onPress={() => setOpenPicker('make')}
              />
              <DropdownField
                label="Model"
                value={draft.vehicleModel}
                placeholder={!draft.vehicleMake || !draft.vehicleYear ? 'Select make & year first' : 'Select model'}
                disabled={!draft.vehicleMake || !draft.vehicleYear}
                onPress={() => setOpenPicker('model')}
              />
              <ActionButton label="Save changes" onPress={handleSave} />
            </SurfaceCard>
          </>
        ) : (
          <>
            <SurfaceCard title={state.profile.name} subtitle={`${state.profile.zone} · ${state.profile.role}`}>
              <DetailRow label="Phone" value={state.profile.phone} />
              <DetailRow label="Email" value={state.profile.email} />
              <DetailRow label="Zone" value={state.profile.zone} />
            </SurfaceCard>

            {(state.profile.vehicleMake || state.profile.vehicleYear) && (
              <SurfaceCard title="Vehicle">
                <DetailRow
                  label="Car"
                  value={[state.profile.vehicleYear, state.profile.vehicleMake, state.profile.vehicleModel]
                    .filter(Boolean).join(' ')}
                />
              </SurfaceCard>
            )}
          </>
        )}

        <SurfaceCard title="Reports">
          <NavRow
            icon="📊"
            title="Expense report"
            subtitle="Monthly and yearly P&L, CRA deductions, CSV export"
            onPress={() => navigation.navigate('TaxReport')}
          />
        </SurfaceCard>

        <SurfaceCard title="Settings">
          <NavRow
            icon="⚙"
            title="App settings"
            subtitle="Units, GPS consent, preferences"
            onPress={() => navigation.navigate('Settings')}
          />
          <NavRow
            icon="🔁"
            title="Recurring expenses"
            subtitle="Insurance, phone, lease — auto-populate monthly"
            onPress={() => navigation.navigate('RepeatingExpenses')}
          />
        </SurfaceCard>

        <SurfaceCard title="Community">
          <NavRow
            icon="👥"
            title="Invite a driver"
            subtitle="Share via SMS, WhatsApp, or QR code"
            onPress={() => navigation.navigate('Invite')}
          />
        </SurfaceCard>
      </ScreenFrame>

      {/* ── Picker modals — rendered outside ScreenFrame to cover full screen ── */}
      <PickerModal
        visible={openPicker === 'year'}
        title="Year"
        options={YEARS}
        onSelect={(v) => setDraft({ ...draft, vehicleYear: v, vehicleModel: '' })}
        onClose={() => setOpenPicker(null)}
      />
      <PickerModal
        visible={openPicker === 'make'}
        title="Make"
        options={makes}
        loading={loadingMakes}
        onSelect={(v) => setDraft({ ...draft, vehicleMake: v, vehicleModel: '' })}
        onClose={() => setOpenPicker(null)}
      />
      <PickerModal
        visible={openPicker === 'model'}
        title="Model"
        options={models}
        loading={loadingModels}
        onSelect={(v) => setDraft({ ...draft, vehicleModel: v })}
        onClose={() => setOpenPicker(null)}
      />
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function NavRow({ icon, title, subtitle, onPress }: {
  icon: string; title: string; subtitle: string; onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.navRow, pressed && styles.navRowPressed]}
      onPress={onPress}
    >
      <View style={styles.navIcon}>
        <Text style={styles.navIconText}>{icon}</Text>
      </View>
      <View style={styles.navContent}>
        <Text style={styles.navTitle}>{title}</Text>
        <Text style={styles.navSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.navChevron}>→</Text>
    </Pressable>
  );
}

function EditField({ label, value, onChangeText, keyboardType }: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
}) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.editInput}
        placeholderTextColor={appTheme.colors.bodyGray}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.md,
  },
  screenTitle: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.headingS,
    flex: 1,
  },
  editButton: {
    paddingHorizontal: appTheme.spacing.base,
    paddingVertical: appTheme.spacing.sm,
    borderRadius: appTheme.radii.button,
    borderWidth: 1.5,
    borderColor: appTheme.colors.playstationBlue,
  },
  editButtonText: {
    color: appTheme.colors.playstationBlue,
    ...appTheme.typography.button,
  },
  detailRow: {
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.media,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  detailLabel: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.body,
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.media,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  navRowPressed: { borderColor: appTheme.colors.playstationBlue },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: appTheme.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconText: { fontSize: 18 },
  navContent: { flex: 1, gap: 2 },
  navTitle: { color: appTheme.colors.inverseWhite, ...appTheme.typography.body, fontWeight: '600' },
  navSubtitle: { color: appTheme.colors.bodyGray, ...appTheme.typography.caption, lineHeight: 18 },
  navChevron: { color: appTheme.colors.playstationBlue, fontSize: 16, fontWeight: '700' },
  editField: { gap: appTheme.spacing.sm },
  editLabel: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    borderRadius: appTheme.radii.input,
    backgroundColor: appTheme.surface.input,
    color: appTheme.colors.inverseWhite,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
    ...appTheme.typography.body,
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
    paddingVertical: appTheme.spacing.md,
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

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: appTheme.surface.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 32,
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
