import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { ScreenFrame } from '../components/ScreenFrame';
import { SurfaceCard } from '../components/SurfaceCard';
import { zones } from '../data/seed';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';
import { ChoiceRow } from './shared/ChoiceRow';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { state, updateProfile } = useAppState();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: state.profile.name,
    phone: state.profile.phone,
    email: state.profile.email,
    zone: state.profile.zone,
  });

  function handleSave() {
    updateProfile(draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft({
      name: state.profile.name,
      phone: state.profile.phone,
      email: state.profile.email,
      zone: state.profile.zone,
    });
    setEditing(false);
  }

  return (
    <ScreenFrame
      header={
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Profile</Text>
          <Pressable onPress={editing ? handleCancel : () => setEditing(true)} style={styles.editButton}>
            <Text style={styles.editButtonText}>{editing ? 'Cancel' : 'Edit'}</Text>
          </Pressable>
        </View>
      }
    >
      {/* ── Personal information ─────────────────────────────────────────────── */}
      {editing ? (
        <SurfaceCard title="Edit profile">
          <EditField label="Name" value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} />
          <EditField label="Phone" value={draft.phone} onChangeText={(v) => setDraft({ ...draft, phone: v })} keyboardType="phone-pad" />
          <EditField label="Email" value={draft.email} onChangeText={(v) => setDraft({ ...draft, email: v })} keyboardType="email-address" />
          <ChoiceRow label="Zone" options={zones} value={draft.zone} onChange={(v) => setDraft({ ...draft, zone: v })} />
          <ActionButton label="Save changes" onPress={handleSave} />
        </SurfaceCard>
      ) : (
        <SurfaceCard title={state.profile.name} subtitle={`${state.profile.zone} · ${state.profile.role}`}>
          <DetailRow label="Phone" value={state.profile.phone} />
          <DetailRow label="Email" value={state.profile.email} />
          <DetailRow label="Zone" value={state.profile.zone} />
        </SurfaceCard>
      )}

      {/* ── Reports ──────────────────────────────────────────────────────────── */}
      <SurfaceCard title="Reports">
        <NavRow
          icon="📊"
          title="Expense report"
          subtitle="Monthly and yearly P&L, CRA deductions, CSV export"
          onPress={() => navigation.navigate('TaxReport')}
        />
      </SurfaceCard>

      {/* ── Settings ─────────────────────────────────────────────────────────── */}
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

      {/* ── Invite ───────────────────────────────────────────────────────────── */}
      <SurfaceCard title="Community">
        <NavRow
          icon="👥"
          title="Invite a driver"
          subtitle="Share via SMS, WhatsApp, or QR code"
          onPress={() => navigation.navigate('Invite')}
        />
      </SurfaceCard>
    </ScreenFrame>
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

function NavRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
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

function EditField({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
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
  navRowPressed: {
    borderColor: appTheme.colors.playstationBlue,
  },
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
});
