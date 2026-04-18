import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';
import { ActionButton } from '../components/ActionButton';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// CRA 2025 mileage rates
const CRA_HIGH_RATE = 0.72; // first 5,000 km
const CRA_LOW_RATE = 0.66;  // after 5,000 km
const CRA_THRESHOLD = 5000;

function calcCRADeduction(businessKm: number, priorYearBizKm: number): number {
  const highAvailable = Math.max(0, CRA_THRESHOLD - priorYearBizKm);
  const highKm = Math.min(businessKm, highAvailable);
  const lowKm = businessKm - highKm;
  return highKm * CRA_HIGH_RATE + lowKm * CRA_LOW_RATE;
}

export function TaxReportScreen() {
  const navigation = useNavigation<any>();
  const { state } = useAppState();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentMonth);

  // ── Build report ─────────────────────────────────────────────────────────────
  const report = useMemo(() => {
    const monthStr = selectedMonth !== null
      ? `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}`
      : null;

    const filterByMonth = <T extends { date: string }>(items: T[]) =>
      monthStr ? items.filter((i) => i.date.startsWith(monthStr)) : items;

    const yearPrefix = String(currentYear);
    const filterByYear = <T extends { date: string }>(items: T[]) =>
      items.filter((i) => i.date.startsWith(yearPrefix));

    const mileage = filterByMonth(state.mileage);
    const fuel = filterByMonth(state.fuel);
    const expenses = filterByMonth(state.expenses);
    const earnings = filterByMonth(state.earnings);

    // Distance
    const totalKm = mileage.reduce((sum, i) => sum + Math.max(i.end - i.start, 0), 0);
    const businessKm = mileage.reduce((sum, i) =>
      i.isGigWork ? sum + Math.max(i.end - i.start, 0) : sum, 0);
    const businessPct = totalKm > 0 ? (businessKm / totalKm) * 100 : 0;

    // For CRA: km driven in gig work BEFORE this period (year-to-date prior)
    let priorBizKm = 0;
    if (selectedMonth !== null) {
      const priorMonthPrefix = `${currentYear}-`;
      priorBizKm = filterByYear(state.mileage)
        .filter((i) => {
          const m = parseInt(i.date.slice(5, 7), 10) - 1; // 0-indexed
          return m < selectedMonth && i.isGigWork;
        })
        .reduce((sum, i) => sum + Math.max(i.end - i.start, 0), 0);
      void priorMonthPrefix;
    }

    const craDeduction = calcCRADeduction(businessKm, priorBizKm);

    // Fuel & expenses
    const totalFuelCost = fuel.reduce((sum, i) => sum + i.cost, 0);
    const totalFuelLitres = fuel.reduce((sum, i) => sum + i.litres, 0);
    const totalEarnings = earnings.reduce((sum, i) => sum + i.amount, 0);

    const expensesByCategory: Record<string, number> = {};
    for (const e of expenses) {
      expensesByCategory[e.category] = (expensesByCategory[e.category] ?? 0) + e.amount;
    }
    const totalExpenses = expenses.reduce((sum, i) => sum + i.amount, 0);
    const totalHST = expenses.reduce((sum, i) => sum + (i.hstAmount ?? 0), 0);
    const netProfit = totalEarnings - totalFuelCost - totalExpenses;

    // Platform breakdown
    const platformTotals: Record<string, number> = {};
    for (const e of earnings) {
      const p = e.platform ?? 'Other';
      platformTotals[p] = (platformTotals[p] ?? 0) + e.amount;
    }

    // Monthly P&L for bar chart (full year, regardless of filter)
    const monthlyPL = MONTHS.map((_, idx) => {
      const mStr = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
      const mEarnings = state.earnings.filter((i) => i.date.startsWith(mStr)).reduce((s, i) => s + i.amount, 0);
      const mFuel = state.fuel.filter((i) => i.date.startsWith(mStr)).reduce((s, i) => s + i.cost, 0);
      const mExp = state.expenses.filter((i) => i.date.startsWith(mStr)).reduce((s, i) => s + i.amount, 0);
      return { label: MONTHS[idx], value: mEarnings - mFuel - mExp };
    });

    return {
      totalKm, businessKm, businessPct,
      totalFuelCost, totalFuelLitres,
      totalEarnings, totalExpenses, netProfit,
      expensesByCategory, platformTotals,
      craDeduction, priorBizKm, totalHST,
      mileageEntries: mileage.length,
      fuelEntries: fuel.length,
      earningsEntries: earnings.length,
      monthlyPL,
    };
  }, [selectedMonth, state]);

  // ── Share text ────────────────────────────────────────────────────────────────
  function handleShare() {
    const period = selectedMonth !== null ? `${MONTHS[selectedMonth]} ${currentYear}` : `Full year ${currentYear}`;
    const expLines = Object.entries(report.expensesByCategory).map(([c, a]) => `  ${c}: $${a.toFixed(2)}`).join('\n');
    const platLines = Object.entries(report.platformTotals).map(([p, a]) => `  ${p}: $${a.toFixed(2)}`).join('\n');
    const text = [
      `Driver Companion — Tax Report`,
      `Period: ${period}  |  Driver: ${state.profile.name} · ${state.profile.zone}`,
      ``,
      `EARNINGS`,
      `  Total: $${report.totalEarnings.toFixed(2)}  (${report.earningsEntries} entries)`,
      platLines,
      ``,
      `MILEAGE`,
      `  Total: ${report.totalKm.toFixed(0)} km  |  Business: ${report.businessKm.toFixed(0)} km (${report.businessPct.toFixed(0)}%)`,
      `  CRA deduction: $${report.craDeduction.toFixed(2)}  |  Actual fuel: $${report.totalFuelCost.toFixed(2)}`,
      ``,
      `FUEL`,
      `  Cost: $${report.totalFuelCost.toFixed(2)}  (${report.totalFuelLitres.toFixed(1)} L, ${report.fuelEntries} fill-ups)`,
      ``,
      `EXPENSES`,
      expLines || '  None',
      `  Total: $${report.totalExpenses.toFixed(2)}  |  HST/GST: $${report.totalHST.toFixed(2)}`,
      ``,
      `NET PROFIT: $${report.netProfit.toFixed(2)}`,
    ].join('\n');
    Share.share({ message: text, title: `Tax Report — ${period}` });
  }

  // ── CSV export ────────────────────────────────────────────────────────────────
  function handleExportCSV() {
    const period = selectedMonth !== null ? `${MONTHS[selectedMonth]} ${currentYear}` : `${currentYear}`;
    const rows: string[][] = [];
    rows.push(['Driver Companion Tax Report']);
    rows.push([`Period: ${period}`]);
    rows.push([`Driver: ${state.profile.name}`, state.profile.zone]);
    rows.push([]);
    rows.push(['EARNINGS']);
    rows.push(['Date', 'Platform', 'Amount', 'Note']);
    const monthStr = selectedMonth !== null ? `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}` : null;
    const filt = <T extends { date: string }>(arr: T[]) =>
      monthStr ? arr.filter((i) => i.date.startsWith(monthStr)) : arr;
    filt(state.earnings).forEach((e) =>
      rows.push([e.date, e.platform ?? 'Other', e.amount.toFixed(2), e.note]));
    rows.push([]);
    rows.push(['MILEAGE']);
    rows.push(['Date', 'Start km', 'End km', 'Distance', 'Gig work']);
    filt(state.mileage).forEach((m) =>
      rows.push([m.date, String(m.start), String(m.end), String(m.end - m.start), m.isGigWork ? 'Yes' : 'No']));
    rows.push([]);
    rows.push(['FUEL']);
    rows.push(['Date', 'Litres', 'Cost', 'Odometer']);
    filt(state.fuel).forEach((f) =>
      rows.push([f.date, f.litres.toFixed(1), f.cost.toFixed(2), String(f.odometer)]));
    rows.push([]);
    rows.push(['EXPENSES']);
    rows.push(['Date', 'Category', 'Amount', 'HST', 'Note']);
    filt(state.expenses).forEach((e) =>
      rows.push([e.date, e.category, e.amount.toFixed(2), (e.hstAmount ?? 0).toFixed(2), e.note]));
    rows.push([]);
    rows.push(['SUMMARY']);
    rows.push(['Total earnings', `$${report.totalEarnings.toFixed(2)}`]);
    rows.push(['Total km', `${report.totalKm.toFixed(0)} km`]);
    rows.push(['Business km', `${report.businessKm.toFixed(0)} km (${report.businessPct.toFixed(0)}%)`]);
    rows.push(['CRA deduction', `$${report.craDeduction.toFixed(2)}`]);
    rows.push(['Total fuel', `$${report.totalFuelCost.toFixed(2)}`]);
    rows.push(['Total expenses', `$${report.totalExpenses.toFixed(2)}`]);
    rows.push(['Total HST/GST', `$${report.totalHST.toFixed(2)}`]);
    rows.push(['Net profit', `$${report.netProfit.toFixed(2)}`]);

    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-report-${period.replace(/\s/g, '-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      Share.share({ message: csv, title: `Tax Report CSV — ${period}` });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Tax report</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Month picker */}
        <View style={styles.monthPicker}>
          <Text style={styles.sectionLabel}>Period</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthRow}>
            <Pressable
              style={[styles.monthChip, selectedMonth === null && styles.monthChipActive]}
              onPress={() => setSelectedMonth(null)}
            >
              <Text style={[styles.monthChipText, selectedMonth === null && styles.monthChipTextActive]}>All {currentYear}</Text>
            </Pressable>
            {MONTHS.map((m, idx) => (
              <Pressable
                key={idx}
                style={[styles.monthChip, selectedMonth === idx && styles.monthChipActive]}
                onPress={() => setSelectedMonth(idx)}
              >
                <Text style={[styles.monthChipText, selectedMonth === idx && styles.monthChipTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Net profit hero */}
        <View style={styles.profitHero}>
          <Text style={styles.profitLabel}>Net profit</Text>
          <Text style={[styles.profitAmount, report.netProfit < 0 && styles.profitNegative]}>
            {report.totalEarnings > 0 ? `$${report.netProfit.toFixed(0)}` : '—'}
          </Text>
          {report.totalEarnings > 0 && (
            <View style={styles.heroRow}>
              <HeroStat label="Earnings" value={`$${report.totalEarnings.toFixed(0)}`} />
              <View style={styles.heroDivider} />
              <HeroStat label="Fuel" value={`$${report.totalFuelCost.toFixed(0)}`} />
              <View style={styles.heroDivider} />
              <HeroStat label="Expenses" value={`$${report.totalExpenses.toFixed(0)}`} />
            </View>
          )}
        </View>

        {/* Monthly P&L bar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Monthly P&L — {currentYear}</Text>
          <BarChart data={report.monthlyPL} />
        </View>

        {/* Platform breakdown */}
        {Object.keys(report.platformTotals).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>By platform</Text>
            {Object.entries(report.platformTotals).map(([platform, amt]) => (
              <ReportRow key={platform} label={platform} value={`$${amt.toFixed(2)}`} />
            ))}
          </View>
        )}

        {/* CRA deduction calculator */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CRA mileage deduction (2025 rates)</Text>
          <ReportRow label="Business km" value={`${report.businessKm.toFixed(0)} km`} />
          <ReportRow label="Business use" value={`${report.businessPct.toFixed(0)}%`} />
          <ReportRow
            label={`CRA rate ($0.72 first ${CRA_THRESHOLD} km, $0.66 after)`}
            value={`$${report.craDeduction.toFixed(2)}`}
          />
          <ReportRow label="Actual fuel cost" value={`$${report.totalFuelCost.toFixed(2)}`} />
          <View style={styles.craRecommendRow}>
            <Text style={styles.craRecommendIcon}>
              {report.craDeduction >= report.totalFuelCost ? '✓' : '↑'}
            </Text>
            <Text style={styles.craRecommendText}>
              {report.craDeduction >= report.totalFuelCost
                ? `Use CRA rate — saves $${(report.craDeduction - report.totalFuelCost).toFixed(2)} vs actual fuel`
                : `Use actual fuel cost — $${(report.totalFuelCost - report.craDeduction).toFixed(2)} more than CRA rate`}
            </Text>
          </View>
        </View>

        {/* Mileage */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mileage</Text>
          <ReportRow label="Total km" value={`${report.totalKm.toFixed(0)} km`} />
          <ReportRow label="Business km" value={`${report.businessKm.toFixed(0)} km`} />
          <ReportRow label="Entries" value={String(report.mileageEntries)} />
        </View>

        {/* Fuel */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Fuel</Text>
          <ReportRow label="Total cost" value={`$${report.totalFuelCost.toFixed(2)}`} />
          <ReportRow label="Total litres" value={`${report.totalFuelLitres.toFixed(1)} L`} />
          <ReportRow label="Fill-ups" value={String(report.fuelEntries)} />
        </View>

        {/* Expenses by category */}
        {Object.keys(report.expensesByCategory).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Expenses by category</Text>
            {Object.entries(report.expensesByCategory).map(([cat, amt]) => (
              <ReportRow key={cat} label={cat} value={`$${amt.toFixed(2)}`} />
            ))}
            <ReportRow label="Total expenses" value={`$${report.totalExpenses.toFixed(2)}`} highlight />
            {report.totalHST > 0 && (
              <ReportRow label="HST/GST (ITCs)" value={`$${report.totalHST.toFixed(2)}`} highlight />
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <ActionButton label="Share report" onPress={handleShare} />
          <ActionButton label="Export CSV" onPress={handleExportCSV} tone="ghost" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ReportRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>{label}</Text>
      <Text style={[styles.reportValue, highlight && styles.reportValueHighlight]}>{value}</Text>
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

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const BAR_MAX_H = 80;

  return (
    <View style={barStyles.wrap}>
      <View style={barStyles.bars}>
        {data.map((d, i) => {
          const barH = Math.max((Math.abs(d.value) / maxAbs) * BAR_MAX_H, 2);
          const isPos = d.value >= 0;
          const isCurrentMonth = i === new Date().getMonth();
          return (
            <View key={i} style={barStyles.barCol}>
              <View style={barStyles.barTrack}>
                <View
                  style={[
                    barStyles.bar,
                    { height: barH, backgroundColor: isPos ? appTheme.colors.playstationBlue : appTheme.colors.warningRed },
                    isCurrentMonth && barStyles.barCurrent,
                  ]}
                />
              </View>
              <Text style={[barStyles.barLabel, isCurrentMonth && barStyles.barLabelCurrent]}>{d.label}</Text>
            </View>
          );
        })}
      </View>
      <View style={barStyles.baseline} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: {
    marginTop: appTheme.spacing.md,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 88,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
    minHeight: 2,
  },
  barCurrent: {
    opacity: 1,
  },
  barLabel: {
    color: appTheme.colors.bodyGray,
    fontSize: 8,
    fontWeight: '600',
  },
  barLabelCurrent: {
    color: appTheme.colors.playstationBlue,
  },
  baseline: {
    height: 1,
    backgroundColor: appTheme.surface.border,
    marginTop: 2,
  },
});

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
  backButton: { paddingVertical: 6, paddingRight: appTheme.spacing.sm },
  backText: {
    color: appTheme.colors.playstationBlue,
    ...appTheme.typography.body,
    fontWeight: '600',
  },
  screenTitle: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayL,
  },
  content: {
    paddingHorizontal: appTheme.spacing.base,
    paddingBottom: 60,
    gap: appTheme.spacing.base,
  },
  monthPicker: { gap: appTheme.spacing.sm },
  sectionLabel: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: appTheme.spacing.xs,
  },
  monthRow: { gap: appTheme.spacing.sm },
  monthChip: {
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
    borderRadius: appTheme.radii.button,
    backgroundColor: appTheme.surface.input,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  monthChipActive: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderColor: appTheme.colors.playstationBlue,
  },
  monthChipText: { color: appTheme.colors.secondaryText, fontSize: 13, fontWeight: '500' },
  monthChipTextActive: { color: appTheme.colors.inverseWhite },
  profitHero: {
    backgroundColor: appTheme.surface.hero,
    borderRadius: appTheme.radii.card,
    borderWidth: 1,
    borderColor: appTheme.colors.playstationBlue,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.sm,
  },
  profitLabel: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profitAmount: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayXL,
  },
  profitNegative: { color: appTheme.colors.warningRed },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.base,
    marginTop: appTheme.spacing.xs,
  },
  heroStat: { gap: 2 },
  heroStatValue: { color: appTheme.colors.inverseWhite, fontSize: 16, fontWeight: '600' },
  heroStatLabel: { color: appTheme.colors.bodyGray, ...appTheme.typography.micro },
  heroDivider: { width: 1, height: 20, backgroundColor: appTheme.surface.border },
  section: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.xs,
    ...appTheme.elevation.low,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: appTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.surface.border,
  },
  reportLabel: { color: appTheme.colors.secondaryText, ...appTheme.typography.body, flex: 1, marginRight: 8 },
  reportValue: { color: appTheme.colors.inverseWhite, ...appTheme.typography.body, fontWeight: '600' },
  reportValueHighlight: { color: appTheme.colors.playstationBlue },
  craRecommendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.sm,
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.media,
    padding: appTheme.spacing.md,
    marginTop: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.colors.playstationBlue,
  },
  craRecommendIcon: { color: appTheme.colors.playstationBlue, fontSize: 16, fontWeight: '700' },
  craRecommendText: {
    flex: 1,
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.caption,
    lineHeight: 18,
  },
  actions: { gap: appTheme.spacing.sm },
});
