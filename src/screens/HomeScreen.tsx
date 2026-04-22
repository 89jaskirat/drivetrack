import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { CarouselRail } from '../components/CarouselRail';
import { FAB } from '../components/FAB';
import { ModalField, TrackingModal } from '../components/TrackingModal';
import { OnboardingTooltips } from '../components/OnboardingTooltips';
import { ScreenFrame } from '../components/ScreenFrame';
import { StreakWidget } from '../components/StreakWidget';
import { SurfaceCard } from '../components/SurfaceCard';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';
import { FUEL_TYPES, type FuelType } from '../types';
import { ChoiceRow } from './shared/ChoiceRow';

const TODAY = new Date().toISOString().slice(0, 10);

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { state, analytics, addMileage, addFuel, addExpense, addEarnings, trackingCategories } = useAppState();

  const [openModal, setOpenModal] = useState<'mileage' | 'fuel' | 'expense' | 'earnings' | null>(null);
  const [mileageForm, setMileageForm] = useState({ date: TODAY, start: '', end: '', offline: false, isGigWork: true });
  const [fuelForm, setFuelForm] = useState({ date: TODAY, litres: '', cost: '', odometer: '', fuelType: 'Regular' as FuelType });
  const [expenseForm, setExpenseForm] = useState({ date: TODAY, amount: '', category: 'Parking', note: '', hstAmount: '', receiptUri: '' });
  const [earningsForm, setEarningsForm] = useState({ date: TODAY, amount: '', note: '', platform: 'Uber' as 'Uber' | 'Lyft' | 'DoorDash' | 'Other' });

  const isShiftActive = !!state.currentShift;
  const unit = state.units === 'metric' ? 'km' : 'mi';
  const hasEarnings = analytics.earnings > 0;

  return (
    <View style={{ flex: 1 }}>
      <ScreenFrame
        header={
          // SimpleHeader — name + zone, no burger menu
          <View style={styles.simpleHeader}>
            <View>
              <Text style={styles.headerName}>{state.profile.name}</Text>
              <Text style={styles.headerZone}>{state.profile.zone} · driver</Text>
            </View>
          </View>
        }
      >
        {/* ShiftCard — Start / End shift */}
        <Pressable
          onPress={() => navigation.navigate('Shift', { mode: isShiftActive ? 'end' : 'start' })}
          style={({ pressed }) => [
            styles.shiftCard,
            isShiftActive ? styles.shiftCardActive : styles.shiftCardIdle,
            pressed && { opacity: 0.85 },
          ]}
        >
          {/* Status dot */}
          <View style={[styles.shiftDot, isShiftActive ? styles.shiftDotActive : styles.shiftDotIdle]} />

          {/* Info */}
          <View style={styles.shiftInfo}>
            <Text style={styles.shiftLabel}>{isShiftActive ? 'Shift in progress' : 'Ready to drive?'}</Text>
            {isShiftActive && state.currentShift ? (
              <Text style={styles.shiftSub}>
                Since {new Date(state.currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {'  ·  '}{state.currentShift.startOdo.toLocaleString()} km start
              </Text>
            ) : (
              <Text style={styles.shiftSub}>Tap to start tracking your shift</Text>
            )}
          </View>

          {/* CTA chip */}
          <View style={[styles.shiftChip, isShiftActive ? styles.shiftChipActive : styles.shiftChipIdle]}>
            <Text style={styles.shiftChipText}>{isShiftActive ? 'End' : 'Start'}</Text>
          </View>
        </Pressable>

        {/* Streak widget */}
        <StreakWidget streak={state.streak} />

        {/* MetricsPanel — 2×2 stat grid */}
        <View style={styles.heroPanel}>
          <Text style={styles.heroPanelLabel}>Net profit</Text>
          <Text style={styles.heroPanelAmount}>
            {hasEarnings ? `$${analytics.profit.toFixed(0)}` : '—'}
          </Text>
          <View style={styles.heroStats}>
            <HeroStat label={unit} value={analytics.km.toFixed(0)} />
            <View style={styles.heroDivider} />
            <HeroStat label="fuel" value={`$${analytics.fuelCost.toFixed(0)}`} />
            <View style={styles.heroDivider} />
            <HeroStat label="$/km" value={analytics.earningsPerKm > 0 ? analytics.earningsPerKm.toFixed(2) : '—'} />
          </View>
        </View>

        <SurfaceCard title="Snapshot">
          <View style={styles.metricGrid}>
            <MetricCell title="Distance" value={`${analytics.km.toFixed(0)} ${unit}`} />
            <MetricCell title="Earnings" value={hasEarnings ? `$${analytics.earnings.toFixed(0)}` : '—'} />
            <MetricCell title="Fuel" value={`$${analytics.fuelCost.toFixed(0)}`} />
            <MetricCell title="L / 100km" value={analytics.fuelPer100 > 0 ? `${analytics.fuelPer100.toFixed(1)}` : '—'} />
          </View>
        </SurfaceCard>

        {/* GasCarousel */}
        <SurfaceCard title="Lowest gas" subtitle={`${state.profile.zone} · today`}>
          <CarouselRail mode="gas" items={state.gas} />
        </SurfaceCard>

        {/* CommunityPulse */}
        <SurfaceCard title="Community pulse" subtitle={`Top posts · ${state.profile.zone}`}>
          <CarouselRail mode="community" items={state.posts} onOpenCommunity={() => navigation.navigate('Community')} />
        </SurfaceCard>
      </ScreenFrame>

      {/* TrackingFAB — add fuel / expense / mileage / earnings */}
      <FAB
        items={[
          {
            label: 'Earnings',
            onPress: () => setOpenModal('earnings'),
          },
          {
            label: 'Mileage',
            onPress: () => setOpenModal('mileage'),
          },
          {
            label: 'Fuel',
            onPress: () => setOpenModal('fuel'),
          },
          {
            label: 'Expense',
            onPress: () => setOpenModal('expense'),
            tone: 'commerce',
          },
        ]}
      />

      {/* TrackingModals */}
      <TrackingModal visible={openModal === 'earnings'} title="Add earnings" onClose={() => setOpenModal(null)}>
        <ModalField label="Date" value={earningsForm.date} onChangeText={(v) => setEarningsForm({ ...earningsForm, date: v })} placeholder="YYYY-MM-DD" />
        <ModalField label="Total earned ($)" value={earningsForm.amount} onChangeText={(v) => setEarningsForm({ ...earningsForm, amount: v })} keyboardType="decimal-pad" placeholder="0.00" />
        <ChoiceRow label="Platform" options={['Uber', 'Lyft', 'DoorDash', 'Other']} value={earningsForm.platform} onChange={(v) => setEarningsForm({ ...earningsForm, platform: v as typeof earningsForm.platform })} />
        <ModalField label="Note" value={earningsForm.note} onChangeText={(v) => setEarningsForm({ ...earningsForm, note: v })} placeholder="Airport surge..." multiline />
        <Pressable style={styles.saveBtn} onPress={() => { addEarnings({ date: earningsForm.date, amount: Number(earningsForm.amount), note: earningsForm.note, platform: earningsForm.platform }); setEarningsForm({ date: TODAY, amount: '', note: '', platform: 'Uber' }); setOpenModal(null); }}>
          <Text style={styles.saveBtnText}>Save earnings</Text>
        </Pressable>
      </TrackingModal>

      <TrackingModal visible={openModal === 'mileage'} title="Add mileage" onClose={() => setOpenModal(null)}>
        <ModalField label="Date" value={mileageForm.date} onChangeText={(v) => setMileageForm({ ...mileageForm, date: v })} placeholder="YYYY-MM-DD" />
        <ModalField label="Start odometer" value={mileageForm.start} onChangeText={(v) => setMileageForm({ ...mileageForm, start: v })} keyboardType="numeric" placeholder="128440" />
        <ModalField label="End odometer" value={mileageForm.end} onChangeText={(v) => setMileageForm({ ...mileageForm, end: v })} keyboardType="numeric" placeholder="128598" />
        <View style={styles.offlineRow}>
          <View style={styles.offlineCopy}>
            <Text style={styles.offlineLabel}>Gig work (deductible)</Text>
            <Text style={styles.offlineHint}>Mark if driven while active on a rideshare platform</Text>
          </View>
          <Switch
            value={mileageForm.isGigWork}
            onValueChange={(v) => setMileageForm({ ...mileageForm, isGigWork: v })}
            trackColor={{ false: appTheme.surface.border, true: appTheme.colors.playstationBlue }}
            thumbColor={appTheme.colors.inverseWhite}
          />
        </View>
        <View style={styles.offlineRow}>
          <View style={styles.offlineCopy}>
            <Text style={styles.offlineLabel}>Offline trip</Text>
            <Text style={styles.offlineHint}>Driving without being online on Uber</Text>
          </View>
          <Switch
            value={mileageForm.offline}
            onValueChange={(v) => setMileageForm({ ...mileageForm, offline: v })}
            trackColor={{ false: appTheme.surface.border, true: appTheme.colors.playstationBlue }}
            thumbColor={appTheme.colors.inverseWhite}
          />
        </View>
        <Pressable style={styles.saveBtn} onPress={() => { addMileage({ date: mileageForm.date, start: Number(mileageForm.start), end: Number(mileageForm.end), offline: mileageForm.offline, isGigWork: mileageForm.isGigWork }); setMileageForm({ date: TODAY, start: '', end: '', offline: false, isGigWork: true }); setOpenModal(null); }}>
          <Text style={styles.saveBtnText}>Save mileage</Text>
        </Pressable>
      </TrackingModal>

      <TrackingModal visible={openModal === 'fuel'} title="Add fuel" onClose={() => setOpenModal(null)}>
        <ModalField label="Date" value={fuelForm.date} onChangeText={(v) => setFuelForm({ ...fuelForm, date: v })} placeholder="YYYY-MM-DD" />
        <ChoiceRow label="Fuel type" options={FUEL_TYPES} value={fuelForm.fuelType} onChange={(v) => setFuelForm({ ...fuelForm, fuelType: v as FuelType })} />
        <ModalField label="Litres" value={fuelForm.litres} onChangeText={(v) => setFuelForm({ ...fuelForm, litres: v })} keyboardType="decimal-pad" placeholder="41.2" />
        <ModalField label="Cost ($)" value={fuelForm.cost} onChangeText={(v) => setFuelForm({ ...fuelForm, cost: v })} keyboardType="decimal-pad" placeholder="57.31" />
        <ModalField label="Odometer" value={fuelForm.odometer} onChangeText={(v) => setFuelForm({ ...fuelForm, odometer: v })} keyboardType="numeric" placeholder="128390" />
        <Pressable style={styles.saveBtn} onPress={() => { addFuel({ date: fuelForm.date, litres: Number(fuelForm.litres), cost: Number(fuelForm.cost), odometer: Number(fuelForm.odometer), fuelType: fuelForm.fuelType }); setFuelForm({ date: TODAY, litres: '', cost: '', odometer: '', fuelType: 'Regular' }); setOpenModal(null); }}>
          <Text style={styles.saveBtnText}>Save fuel</Text>
        </Pressable>
      </TrackingModal>

      <TrackingModal visible={openModal === 'expense'} title="Add expense" onClose={() => setOpenModal(null)}>
        <ModalField label="Date" value={expenseForm.date} onChangeText={(v) => setExpenseForm({ ...expenseForm, date: v })} placeholder="YYYY-MM-DD" />
        <ChoiceRow label="Category" options={trackingCategories} value={expenseForm.category} onChange={(v) => setExpenseForm({ ...expenseForm, category: v })} />
        <ModalField label="Amount ($)" value={expenseForm.amount} onChangeText={(v) => setExpenseForm({ ...expenseForm, amount: v })} keyboardType="decimal-pad" placeholder="0.00" />
        <ModalField label="HST / GST portion ($)" value={expenseForm.hstAmount} onChangeText={(v) => setExpenseForm({ ...expenseForm, hstAmount: v })} keyboardType="decimal-pad" placeholder="0.00 (optional)" />
        <ModalField label="Note" value={expenseForm.note} onChangeText={(v) => setExpenseForm({ ...expenseForm, note: v })} placeholder="Details..." />
        {/* Receipt photo */}
        <Pressable
          style={styles.receiptBtn}
          onPress={() => {
            if (Platform.OS === 'web') {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e: any) => {
                const file = e.target?.files?.[0];
                if (file) setExpenseForm((f) => ({ ...f, receiptUri: file.name }));
              };
              input.click();
            }
          }}
        >
          <Text style={styles.receiptIcon}>{expenseForm.receiptUri ? '✓' : '📷'}</Text>
          <Text style={styles.receiptLabel}>
            {expenseForm.receiptUri ? expenseForm.receiptUri : 'Attach receipt photo'}
          </Text>
          {expenseForm.receiptUri ? (
            <Pressable onPress={() => setExpenseForm((f) => ({ ...f, receiptUri: '' }))} hitSlop={8}>
              <Text style={styles.receiptRemove}>✕</Text>
            </Pressable>
          ) : null}
        </Pressable>
        <Pressable style={[styles.saveBtn, styles.saveBtnCommerce]} onPress={() => { addExpense({ date: expenseForm.date, amount: Number(expenseForm.amount), category: expenseForm.category, note: expenseForm.note, hstAmount: expenseForm.hstAmount ? Number(expenseForm.hstAmount) : undefined, receiptUri: expenseForm.receiptUri || undefined }); setExpenseForm({ date: TODAY, amount: '', note: '', category: 'Parking', hstAmount: '', receiptUri: '' }); setOpenModal(null); }}>
          <Text style={styles.saveBtnText}>Save expense</Text>
        </Pressable>
      </TrackingModal>

      {/* First-install onboarding tooltips */}
      <OnboardingTooltips />
    </View>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function MetricCell({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricLabel}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  simpleHeader: {
    paddingTop: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.md,
  },
  headerName: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayL,
  },
  headerZone: {
    color: appTheme.colors.darkLinkBlue,
    ...appTheme.typography.caption,
    marginTop: 2,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: appTheme.radii.card,
    paddingVertical: appTheme.spacing.md,
    paddingHorizontal: appTheme.spacing.base,
    gap: appTheme.spacing.md,
    borderWidth: 1.5,
    marginTop: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.base,
  },
  shiftCardIdle: {
    backgroundColor: appTheme.surface.hero,
    borderColor: appTheme.colors.playstationBlue,
  },
  shiftCardActive: {
    backgroundColor: '#1a0a0a',
    borderColor: '#e53935',
  },
  shiftDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  shiftDotIdle: {
    backgroundColor: appTheme.colors.playstationBlue,
  },
  shiftDotActive: {
    backgroundColor: '#e53935',
  },
  shiftInfo: {
    flex: 1,
    gap: 3,
  },
  shiftLabel: {
    color: appTheme.colors.inverseWhite,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  shiftSub: {
    color: appTheme.colors.bodyGray,
    fontSize: 12,
    lineHeight: 16,
  },
  shiftChip: {
    paddingHorizontal: appTheme.spacing.base,
    paddingVertical: 8,
    borderRadius: 100,
    minWidth: 60,
    alignItems: 'center',
  },
  shiftChipIdle: {
    backgroundColor: appTheme.colors.playstationBlue,
  },
  shiftChipActive: {
    backgroundColor: '#e53935',
  },
  shiftChipText: {
    color: appTheme.colors.inverseWhite,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroPanel: {
    backgroundColor: appTheme.surface.hero,
    borderRadius: appTheme.radii.card,
    borderWidth: 1,
    borderColor: appTheme.colors.playstationBlue,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.sm,
  },
  heroPanelLabel: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroPanelAmount: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayXL,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: appTheme.spacing.sm,
    gap: appTheme.spacing.base,
  },
  heroDivider: {
    width: 1,
    height: 20,
    backgroundColor: appTheme.surface.border,
  },
  heroStat: { gap: 2 },
  heroStatValue: {
    color: appTheme.colors.inverseWhite,
    fontSize: 18,
    fontWeight: '600',
  },
  heroStatLabel: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.sm,
  },
  metricCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.media,
    padding: appTheme.spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  metricLabel: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    color: appTheme.colors.inverseWhite,
    fontSize: 24,
    fontWeight: '300',
  },
  saveBtn: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: appTheme.radii.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnCommerce: {
    backgroundColor: appTheme.colors.commerceOrange,
  },
  saveBtnText: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.button,
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.input,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  receiptIcon: { fontSize: 16 },
  receiptLabel: {
    flex: 1,
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.body,
  },
  receiptRemove: {
    color: appTheme.colors.bodyGray,
    fontSize: 14,
    fontWeight: '600',
  },
  offlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.input,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  offlineCopy: { flex: 1, gap: 2 },
  offlineLabel: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.body,
    fontWeight: '600',
  },
  offlineHint: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
  },
});
