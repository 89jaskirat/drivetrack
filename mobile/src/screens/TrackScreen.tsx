import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { AppHeader } from '../components/AppHeader';
import { AppMenu } from '../components/AppMenu';
import { ScreenFrame } from '../components/ScreenFrame';
import { SurfaceCard } from '../components/SurfaceCard';
import { ModalField, TrackingModal } from '../components/TrackingModal';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';
import { ChoiceRow } from './shared/ChoiceRow';

export function TrackScreen() {
  const navigation = useNavigation<any>();
  const { state, addMileage, addFuel, addExpense, trackingCategories } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openModal, setOpenModal] = useState<'mileage' | 'fuel' | 'expense' | null>(null);
  const [mileageForm, setMileageForm] = useState({ date: '2026-04-14', start: '', end: '' });
  const [fuelForm, setFuelForm] = useState({ date: '2026-04-14', litres: '', cost: '', odometer: '' });
  const [expenseForm, setExpenseForm] = useState({ date: '2026-04-14', amount: '', category: 'Parking', note: '' });

  return (
    <View style={{ flex: 1 }}>
      <ScreenFrame
        header={
          <AppHeader
            title={state.profile.name}
            subtitle="Tracking summaries"
            onMenuPress={() => setMenuOpen(true)}
            onProfilePress={() => navigation.navigate('Profile')}
          />
        }
      >
        <SurfaceCard componentName="MileageSummaryCard" title="Mileage" subtitle="Daily odometer logs for tax-ready distance records.">
          <SummaryValue label="Entries" value={String(state.mileage.length)} />
          <SummaryValue label="Latest" value={state.mileage[0] ? `${state.mileage[0].date} • ${state.mileage[0].end - state.mileage[0].start} km` : 'No entries'} />
          <ActionButton label="Add mileage" onPress={() => setOpenModal('mileage')} />
        </SurfaceCard>

        <SurfaceCard componentName="FuelSummaryCard" title="Fuel" subtitle="Track spend and fill-ups for efficiency trends.">
          <SummaryValue label="Entries" value={String(state.fuel.length)} />
          <SummaryValue label="Latest" value={state.fuel[0] ? `${state.fuel[0].date} • $${state.fuel[0].cost.toFixed(2)}` : 'No entries'} />
          <ActionButton label="Add fuel purchase" onPress={() => setOpenModal('fuel')} />
        </SurfaceCard>

        <SurfaceCard componentName="ExpenseSummaryCard" title="Expenses" subtitle="Capture parking, maintenance, lease, and all supporting costs.">
          <SummaryValue label="Entries" value={String(state.expenses.length)} />
          <SummaryValue label="Latest" value={state.expenses[0] ? `${state.expenses[0].category} • $${state.expenses[0].amount.toFixed(2)}` : 'No entries'} />
          <ActionButton label="Add expense" onPress={() => setOpenModal('expense')} tone="commerce" />
        </SurfaceCard>
      </ScreenFrame>

      <TrackingModal
        visible={openModal === 'mileage'}
        title="Add mileage"
        componentName="MileageEntryModal"
        onClose={() => setOpenModal(null)}
      >
        <ModalField label="Date" value={mileageForm.date} onChangeText={(value) => setMileageForm({ ...mileageForm, date: value })} />
        <ModalField label="Start odometer" value={mileageForm.start} onChangeText={(value) => setMileageForm({ ...mileageForm, start: value })} keyboardType="numeric" />
        <ModalField label="End odometer" value={mileageForm.end} onChangeText={(value) => setMileageForm({ ...mileageForm, end: value })} keyboardType="numeric" />
        <ActionButton
          label="Save mileage"
          onPress={() => {
            addMileage({ date: mileageForm.date, start: Number(mileageForm.start), end: Number(mileageForm.end) });
            setMileageForm({ ...mileageForm, start: '', end: '' });
            setOpenModal(null);
          }}
        />
      </TrackingModal>

      <TrackingModal
        visible={openModal === 'fuel'}
        title="Add fuel purchase"
        componentName="FuelEntryModal"
        onClose={() => setOpenModal(null)}
      >
        <ModalField label="Date" value={fuelForm.date} onChangeText={(value) => setFuelForm({ ...fuelForm, date: value })} />
        <ModalField label="Litres" value={fuelForm.litres} onChangeText={(value) => setFuelForm({ ...fuelForm, litres: value })} keyboardType="decimal-pad" />
        <ModalField label="Cost" value={fuelForm.cost} onChangeText={(value) => setFuelForm({ ...fuelForm, cost: value })} keyboardType="decimal-pad" />
        <ModalField label="Odometer" value={fuelForm.odometer} onChangeText={(value) => setFuelForm({ ...fuelForm, odometer: value })} keyboardType="numeric" />
        <ActionButton
          label="Save fuel purchase"
          onPress={() => {
            addFuel({
              date: fuelForm.date,
              litres: Number(fuelForm.litres),
              cost: Number(fuelForm.cost),
              odometer: Number(fuelForm.odometer),
            });
            setFuelForm({ ...fuelForm, litres: '', cost: '', odometer: '' });
            setOpenModal(null);
          }}
        />
      </TrackingModal>

      <TrackingModal
        visible={openModal === 'expense'}
        title="Add expense"
        componentName="ExpenseEntryModal"
        onClose={() => setOpenModal(null)}
      >
        <ModalField label="Date" value={expenseForm.date} onChangeText={(value) => setExpenseForm({ ...expenseForm, date: value })} />
        <ChoiceRow label="Category" options={trackingCategories} value={expenseForm.category} onChange={(value) => setExpenseForm({ ...expenseForm, category: value })} />
        <ModalField label="Amount" value={expenseForm.amount} onChangeText={(value) => setExpenseForm({ ...expenseForm, amount: value })} keyboardType="decimal-pad" />
        <ModalField label="Note" value={expenseForm.note} onChangeText={(value) => setExpenseForm({ ...expenseForm, note: value })} />
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
            setExpenseForm({ ...expenseForm, amount: '', note: '' });
            setOpenModal(null);
          }}
        />
      </TrackingModal>

      <AppMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onProfilePress={() => {
          setMenuOpen(false);
          navigation.navigate('Profile');
        }}
        onSettingsPress={() => {
          setMenuOpen(false);
          navigation.navigate('Settings');
        }}
      />
    </View>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: appTheme.colors.iceMist,
    borderRadius: appTheme.radii.media,
    padding: 14,
  },
  summaryLabel: {
    color: appTheme.colors.bodyGray,
    fontSize: 12,
  },
  summaryValue: {
    color: appTheme.colors.displayInk,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
});
