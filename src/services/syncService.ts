/**
 * syncService — background sync between local AsyncStorage state and Supabase.
 *
 * Strategy (offline-first):
 *  - Write to local state first (instant, works offline)
 *  - Then push to Supabase in background (no await at call site)
 *  - On app start, pullAll() fetches remote data and overwrites local
 *
 * All functions are fire-and-forget friendly: they log errors but never throw,
 * so a network failure never breaks the local UX.
 */

import { supabase } from '../lib/supabase';
import type {
  MileageLog,
  FuelLog,
  ExpenseLog,
  EarningsLog,
  ShiftSession,
  RecurringExpense,
  ForumPost,
} from '../types';

// ── Table name mapping ────────────────────────────────────────────────────────
type SyncTable =
  | 'mileage_logs'
  | 'fuel_logs'
  | 'expense_logs'
  | 'earnings_logs'
  | 'shifts'
  | 'recurring_expenses'
  | 'recurring_applied_months'
  | 'posts';

// ── Push a single row ─────────────────────────────────────────────────────────
// Uses upsert so it works for both insert and update.
export async function pushRow(table: SyncTable, row: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
    if (error) console.warn(`[Sync] pushRow(${table}) failed:`, error.message);
  } catch (err: any) {
    console.warn(`[Sync] pushRow(${table}) exception:`, err?.message);
  }
}

// ── Delete a row ──────────────────────────────────────────────────────────────
export async function deleteRow(table: SyncTable, id: string): Promise<void> {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.warn(`[Sync] deleteRow(${table}, ${id}) failed:`, error.message);
  } catch (err: any) {
    console.warn(`[Sync] deleteRow exception:`, err?.message);
  }
}

// ── Pull all user data from Supabase ─────────────────────────────────────────
// Called once on app start (after auth). Returns null on network error.
export async function pullAll(userId: string): Promise<PulledData | null> {
  try {
    const [
      mileageRes,
      fuelRes,
      expenseRes,
      earningsRes,
      shiftsRes,
      recurringRes,
      appliedRes,
      profileRes,
    ] = await Promise.all([
      supabase.from('mileage_logs').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('fuel_logs').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('expense_logs').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('earnings_logs').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('shifts').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('recurring_expenses').select('*').eq('user_id', userId),
      supabase.from('recurring_applied_months').select('month_key').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('id', userId).single(),
    ]);

    return {
      mileage: (mileageRes.data ?? []).map(rowToMileage),
      fuel: (fuelRes.data ?? []).map(rowToFuel),
      expenses: (expenseRes.data ?? []).map(rowToExpense),
      earnings: (earningsRes.data ?? []).map(rowToEarnings),
      shifts: (shiftsRes.data ?? []).map(rowToShift),
      recurringExpenses: (recurringRes.data ?? []).map(rowToRecurring),
      recurringAppliedMonths: (appliedRes.data ?? []).map((r: any) => r.month_key as string),
      profile: profileRes.data ?? null,
    };
  } catch (err: any) {
    console.warn('[Sync] pullAll failed:', err?.message);
    return null;
  }
}

// ── Upsert profile ────────────────────────────────────────────────────────────
export async function upsertProfile(row: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
    if (error) console.warn('[Sync] upsertProfile failed:', error.message);
  } catch (err: any) {
    console.warn('[Sync] upsertProfile exception:', err?.message);
  }
}

// ── Row → local type converters ───────────────────────────────────────────────

function rowToMileage(r: any): MileageLog {
  return {
    id: r.id,
    date: r.date,
    start: r.start_odo,
    end: r.end_odo,
    isGigWork: r.is_gig_work,
  };
}

function rowToFuel(r: any): FuelLog {
  return {
    id: r.id,
    date: r.date,
    litres: r.litres,
    cost: r.cost,
    odometer: r.odometer,
    fuelType: r.fuel_type ?? 'Regular',
  };
}

function rowToExpense(r: any): ExpenseLog {
  return {
    id: r.id,
    date: r.date,
    amount: r.amount,
    category: r.category,
    note: r.note ?? '',
    receiptUri: r.receipt_url ?? '',
    hstAmount: r.hst_amount ?? 0,
  };
}

function rowToEarnings(r: any): EarningsLog {
  return {
    id: r.id,
    date: r.date,
    amount: r.amount,
    note: r.note ?? '',
    platform: r.platform ?? 'Uber',
  };
}

function rowToShift(r: any): ShiftSession {
  return {
    id: r.id,
    startTime: r.start_time,
    startOdo: r.start_odo,
    endTime: r.end_time ?? undefined,
    endOdo: r.end_odo ?? undefined,
    earnings: r.earnings,
    distanceKm: r.distance,
    durationMinutes: r.duration,
  };
}

function rowToRecurring(r: any): RecurringExpense {
  return {
    id: r.id,
    name: r.name,
    amount: r.amount,
    category: r.category,
    dayOfMonth: r.day_of_month,
    active: r.active,
  };
}

// ── Pulled data shape ─────────────────────────────────────────────────────────
export interface PulledData {
  mileage: MileageLog[];
  fuel: FuelLog[];
  expenses: ExpenseLog[];
  earnings: EarningsLog[];
  shifts: ShiftSession[];
  recurringExpenses: RecurringExpense[];
  recurringAppliedMonths: string[];
  profile: Record<string, unknown> | null;
}
