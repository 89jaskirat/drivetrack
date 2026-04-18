import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';
import { RecurringExpense } from '../types';
import { ChoiceRow } from './shared/ChoiceRow';
import { expenseCategories } from '../data/seed';

export function RepeatingExpensesScreen() {
  const navigation = useNavigation<any>();
  const { state, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense, applyRecurringExpenses } = useAppState();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', category: 'Insurance', dayOfMonth: '1' });

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const monthKey = new Date().toISOString().slice(0, 7);
  const alreadyApplied = state.recurringAppliedMonths.includes(monthKey);
  const activeCount = state.recurringExpenses.filter((r) => r.active).length;

  function handleSave() {
    if (!form.name.trim() || !form.amount) return;
    addRecurringExpense({
      name: form.name.trim(),
      amount: Number(form.amount),
      category: form.category,
      dayOfMonth: Number(form.dayOfMonth) || 1,
      active: true,
    });
    setForm({ name: '', amount: '', category: 'Insurance', dayOfMonth: '1' });
    setShowForm(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Recurring expenses</Text>
        <Pressable onPress={() => setShowForm((v) => !v)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>{showForm ? 'Cancel' : '+ Add'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Apply this month banner */}
        <View style={[styles.applyBanner, alreadyApplied && styles.applyBannerDone]}>
          <View style={styles.applyBannerText}>
            <Text style={styles.applyBannerTitle}>
              {alreadyApplied ? `Applied for ${currentMonth}` : `Apply for ${currentMonth}`}
            </Text>
            <Text style={styles.applyBannerSub}>
              {alreadyApplied
                ? `${activeCount} expense${activeCount !== 1 ? 's' : ''} added to this month`
                : `${activeCount} active expense${activeCount !== 1 ? 's' : ''} will be added`}
            </Text>
          </View>
          {!alreadyApplied && (
            <Pressable
              style={[styles.applyBtn, activeCount === 0 && styles.applyBtnDisabled]}
              disabled={activeCount === 0}
              onPress={applyRecurringExpenses}
            >
              <Text style={styles.applyBtnText}>Apply now</Text>
            </Pressable>
          )}
        </View>

        {/* Add form */}
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>New recurring expense</Text>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="e.g. Phone bill"
                placeholderTextColor={appTheme.colors.bodyGray}
                style={styles.input}
              />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Monthly amount ($)</Text>
              <TextInput
                value={form.amount}
                onChangeText={(v) => setForm({ ...form, amount: v })}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={appTheme.colors.bodyGray}
                style={styles.input}
              />
            </View>
            <ChoiceRow label="Category" options={expenseCategories} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Day of month</Text>
              <TextInput
                value={form.dayOfMonth}
                onChangeText={(v) => setForm({ ...form, dayOfMonth: v })}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={appTheme.colors.bodyGray}
                style={styles.input}
              />
            </View>
            <Pressable
              style={[styles.saveBtn, (!form.name.trim() || !form.amount) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!form.name.trim() || !form.amount}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        )}

        {/* List */}
        {state.recurringExpenses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No recurring expenses yet.</Text>
            <Text style={styles.emptyHint}>Tap "+ Add" to create one for insurance, phone, lease, etc.</Text>
          </View>
        ) : (
          state.recurringExpenses.map((re) => (
            <RecurringRow
              key={re.id}
              item={re}
              onToggle={(active) => updateRecurringExpense(re.id, { active })}
              onDelete={() => deleteRecurringExpense(re.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RecurringRow({
  item,
  onToggle,
  onDelete,
}: {
  item: RecurringExpense;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.row, !item.active && styles.rowInactive]}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowMeta}>
          {item.category} · day {item.dayOfMonth} · ${item.amount.toFixed(2)}/mo
        </Text>
      </View>
      <View style={styles.rowActions}>
        <Switch
          value={item.active}
          onValueChange={onToggle}
          trackColor={{ false: appTheme.surface.border, true: appTheme.colors.playstationBlue }}
          thumbColor={appTheme.colors.inverseWhite}
        />
        <Pressable onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
          <Text style={styles.deleteIcon}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: appTheme.surface.screen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    paddingHorizontal: appTheme.spacing.base,
    paddingTop: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.md,
  },
  backButton: { paddingVertical: 6, paddingRight: appTheme.spacing.sm },
  backText: { color: appTheme.colors.playstationBlue, ...appTheme.typography.body, fontWeight: '600' },
  screenTitle: { flex: 1, color: appTheme.colors.inverseWhite, ...appTheme.typography.displayL },
  addBtn: {
    paddingHorizontal: appTheme.spacing.base,
    paddingVertical: 8,
    borderRadius: appTheme.radii.button,
    borderWidth: 1.5,
    borderColor: appTheme.colors.playstationBlue,
  },
  addBtnText: { color: appTheme.colors.playstationBlue, fontSize: 13, fontWeight: '700' },
  content: {
    paddingHorizontal: appTheme.spacing.base,
    paddingBottom: 60,
    gap: appTheme.spacing.base,
  },
  applyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: appTheme.colors.playstationBlue,
    ...appTheme.elevation.low,
  },
  applyBannerDone: {
    borderColor: appTheme.surface.border,
  },
  applyBannerText: { flex: 1, gap: 3 },
  applyBannerTitle: { color: appTheme.colors.inverseWhite, ...appTheme.typography.body, fontWeight: '600' },
  applyBannerSub: { color: appTheme.colors.bodyGray, ...appTheme.typography.caption },
  applyBtn: {
    backgroundColor: appTheme.colors.playstationBlue,
    paddingHorizontal: appTheme.spacing.base,
    paddingVertical: 10,
    borderRadius: appTheme.radii.button,
  },
  applyBtnDisabled: { backgroundColor: appTheme.surface.border },
  applyBtnText: { color: appTheme.colors.inverseWhite, fontSize: 13, fontWeight: '700' },
  form: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.base,
    ...appTheme.elevation.low,
  },
  formTitle: { color: appTheme.colors.inverseWhite, ...appTheme.typography.headingS },
  fieldWrap: { gap: appTheme.spacing.sm },
  fieldLabel: {
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
    ...appTheme.typography.body,
  },
  saveBtn: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: appTheme.radii.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: appTheme.surface.border },
  saveBtnText: { color: appTheme.colors.inverseWhite, ...appTheme.typography.button },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    ...appTheme.elevation.low,
  },
  rowInactive: { opacity: 0.5 },
  rowLeft: { flex: 1, gap: 4 },
  rowName: { color: appTheme.colors.inverseWhite, ...appTheme.typography.body, fontWeight: '600' },
  rowMeta: { color: appTheme.colors.bodyGray, ...appTheme.typography.caption },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: appTheme.spacing.md },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: appTheme.surface.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  deleteIcon: { color: appTheme.colors.bodyGray, fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 60, gap: appTheme.spacing.sm },
  emptyText: { color: appTheme.colors.inverseWhite, ...appTheme.typography.body },
  emptyHint: { color: appTheme.colors.bodyGray, ...appTheme.typography.caption, textAlign: 'center' },
});
