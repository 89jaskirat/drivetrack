import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { AppHeader } from '../components/AppHeader';
import { ScreenFrame } from '../components/ScreenFrame';
import { SurfaceCard } from '../components/SurfaceCard';
import { ModalField, TrackingModal } from '../components/TrackingModal';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';
import { FUEL_TYPES, type FuelType } from '../types';
import { ChoiceRow } from './shared/ChoiceRow';

const TODAY = new Date().toISOString().slice(0, 10);

export function TrackScreen() {
  const { state, addMileage, addFuel, addExpense, addEarnings, trackingCategories } = useAppState();
  const [openModal, setOpenModal] = useState<'mileage' | 'fuel' | 'expense' | 'earnings' | null>(null);

  const [mileageForm, setMileageForm] = useState({ date: TODAY, start: '', end: '' });
  const [fuelForm, setFuelForm] = useState({ date: TODAY, litres: '', cost: '', odometer: '', fuelType: 'Regular' as FuelType });
  const [expenseForm, setExpenseForm] = useState({ date: TODAY, amount: '', category: 'Parking', note: '' });
  const [earningsForm, setEarningsForm] = useState({ date: TODAY, amount: '', note: '' });

  return (
    <View style={{ flex: 1 }}>
      <ScreenFrame
        header={
          <AppHeader
            title={state.profile.name}
            subtitle="Tracking summaries"
          />
        }
      >
        <SurfaceCard title="Earnings" subtitle="Daily totals from your rides.">
          <SummaryRow
            label="Entries"
            value={String(state.earnings.length)}
          />
          <SummaryRow
            label="Latest"
            value={
              state.earnings[0]
                ? `${state.earnings[0].date} · $${state.earnings[0].amount.toFixed(2)}`
                : 'No entries yet'
            }
          />
          <ActionButton label="Add earnings" onPress={() => setOpenModal('earnings')} />
        </SurfaceCard>

        <SurfaceCard title="Mileage" subtitle="Odometer logs for tax-ready distance records.">
          <SummaryRow label="Entries" value={String(state.mileage.length)} />
          <SummaryRow
            label="Latest"
            value={
              state.mileage[0]
                ? `${state.mileage[0].date} · ${state.mileage[0].end - state.mileage[0].start} km`
                : 'No entries yet'
            }
          />
          <ActionButton label="Add mileage" onPress={() => setOpenModal('mileage')} />
        </SurfaceCard>

        <SurfaceCard title="Fuel" subtitle="Track spend and fill-ups for efficiency trends.">
          <SummaryRow label="Entries" value={String(state.fuel.length)} />
          <SummaryRow
            label="Latest"
            value={state.fuel[0] ? `${state.fuel[0].date} · $${state.fuel[0].cost.toFixed(2)}` : 'No entries yet'}
          />
          <ActionButton label="Add fuel purchase" onPress={() => setOpenModal('fuel')} />
        </SurfaceCard>

        <SurfaceCard title="Expenses" subtitle="Parking, maintenance, lease, and all supporting costs.">
          <SummaryRow label="Entries" value={String(state.expenses.length)} />
          <SummaryRow
            label="Latest"
            value={
              state.expenses[0]
                ? `${state.expenses[0].category} · $${state.expenses[0].amount.toFixed(2)}`
                : 'No entries yet'
            }
          />
          <ActionButton label="Add expense" onPress={() => setOpenModal('expense')} tone="commerce" />
        </SurfaceCard>
      </ScreenFrame>

      {/* Earnings modal */}
      <TrackingModal
        visible={openModal === 'earnings'}
        title="Add earnings"
        onClose={() => setOpenModal(null)}
      >
        <ModalField
          label="Date"
          value={earningsForm.date}
          onChangeText={(v) => setEarningsForm({ ...earningsForm, date: v })}
          placeholder="YYYY-MM-DD"
        />
        <ModalField
          label="Total earned ($)"
          value={earningsForm.amount}
          onChangeText={(v) => setEarningsForm({ ...earningsForm, amount: v })}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <ModalField
          label="Note (optional)"
          value={earningsForm.note}
          onChangeText={(v) => setEarningsForm({ ...earningsForm, note: v })}
          placeholder="Airport surge, downtown..."
          multiline
        />
        <ActionButton
          label="Save earnings"
          onPress={() => {
            addEarnings({
              date: earningsForm.date,
              amount: Number(earningsForm.amount),
              note: earningsForm.note,
            });
            setEarningsForm({ date: TODAY, amount: '', note: '' });
            setOpenModal(null);
          }}
        />
      </TrackingModal>

      {/* Mileage modal */}
      <TrackingModal
        visible={openModal === 'mileage'}
        title="Add mileage"
        onClose={() => setOpenModal(null)}
      >
        <ModalField
          label="Date"
          value={mileageForm.date}
          onChangeText={(v) => setMileageForm({ ...mileageForm, date: v })}
          placeholder="YYYY-MM-DD"
        />
        <ModalField
          label="Start odometer"
          value={mileageForm.start}
          onChangeText={(v) => setMileageForm({ ...mileageForm, start: v })}
          keyboardType="numeric"
          placeholder="128440"
        />
        <ModalField
          label="End odometer"
          value={mileageForm.end}
          onChangeText={(v) => setMileageForm({ ...mileageForm, end: v })}
          keyboardType="numeric"
          placeholder="128598"
        />
        <ActionButton
          label="Save mileage"
          onPress={() => {
            addMileage({ date: mileageForm.date, start: Number(mileageForm.start), end: Number(mileageForm.end) });
            setMileageForm({ date: TODAY, start: '', end: '' });
            setOpenModal(null);
          }}
        />
      </TrackingModal>

      {/* Fuel modal */}
      <TrackingModal
        visible={openModal === 'fuel'}
        title="Add fuel purchase"
        onClose={() => setOpenModal(null)}
      >
        <ModalField
          label="Date"
          value={fuelForm.date}
          onChangeText={(v) => setFuelForm({ ...fuelForm, date: v })}
          placeholder="YYYY-MM-DD"
        />
        <ModalField
          label="Litres"
          value={fuelForm.litres}
          onChangeText={(v) => setFuelForm({ ...fuelForm, litres: v })}
          keyboardType="decimal-pad"
          placeholder="41.2"
        />
        <ChoiceRow
          label="Fuel type"
          options={FUEL_TYPES}
          value={fuelForm.fuelType}
          onChange={(v) => setFuelForm({ ...fuelForm, fuelType: v as FuelType })}
        />
        <ModalField
          label="Cost ($)"
          value={fuelForm.cost}
          onChangeText={(v) => setFuelForm({ ...fuelForm, cost: v })}
          keyboardType="decimal-pad"
          placeholder="57.31"
        />
        <ModalField
          label="Odometer"
          value={fuelForm.odometer}
          onChangeText={(v) => setFuelForm({ ...fuelForm, odometer: v })}
          keyboardType="numeric"
          placeholder="128390"
        />
        <ActionButton
          label="Save fuel purchase"
          onPress={() => {
            addFuel({
              date: fuelForm.date,
              litres: Number(fuelForm.litres),
              cost: Number(fuelForm.cost),
              odometer: Number(fuelForm.odometer),
              fuelType: fuelForm.fuelType,
            });
            setFuelForm({ date: TODAY, litres: '', cost: '', odometer: '', fuelType: 'Regular' });
            setOpenModal(null);
          }}
        />
      </TrackingModal>

      {/* Expense modal */}
      <TrackingModal
        visible={openModal === 'expense'}
        title="Add expense"
        onClose={() => setOpenModal(null)}
      >
        <ModalField
          label="Date"
          value={expenseForm.date}
          onChangeText={(v) => setExpenseForm({ ...expenseForm, date: v })}
          placeholder="YYYY-MM-DD"
        />
        <ChoiceRow
          label="Category"
          options={trackingCategories}
          value={expenseForm.category}
          onChange={(v) => setExpenseForm({ ...expenseForm, category: v })}
        />
        <ModalField
          label="Amount ($)"
          value={expenseForm.amount}
          onChangeText={(v) => setExpenseForm({ ...expenseForm, amount: v })}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <ModalField
          label="Note"
          value={expenseForm.note}
          onChangeText={(v) => setExpenseForm({ ...expenseForm, note: v })}
          placeholder="Details..."
        />
        <ActionButton
          label="Save expense"
          tone="commerce"
          onPress={() => {
            addExpense({
              date: expenseForm.date,
              amount: Number(expenseForm.amount),
              category: expenseForm.category,
              note: expenseForm.note,
            });
            setExpenseForm({ date: TODAY, amount: '', note: '', category: 'Parking' });
            setOpenModal(null);
          }}
        />
      </TrackingModal>

    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.media,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  summaryLabel: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.caption,
  },
  summaryValue: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.body,
    fontWeight: '600',
  },
});
