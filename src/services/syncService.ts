/**
 * syncService — background sync between local AsyncStorage state and Supabase.
 *
 * Strategy (offline-first):
 *  - Write to local state first (instant, works offline)
 *  - Then push to Supabase in background (no await at call site)
 *  - On app start, pullAll() fetches remote data and overwrites local
 *
 * Error handling:
 *  - Errors are collected via onSyncError callback so the UI can display them.
 *  - Functions never throw so a network failure never breaks the local UX.
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
  ForumComment,
  Deal,
  DealCategory,
  GasPrice,
} from '../types';

// ── Error callback ────────────────────────────────────────────────────────────
let _onSyncError: ((msg: string) => void) | null = null;
export function setSyncErrorHandler(handler: (msg: string) => void) {
  _onSyncError = handler;
}
function reportError(msg: string) {
  console.warn(msg);
  _onSyncError?.(msg);
}

// ── Table name mapping ────────────────────────────────────────────────────────
type SyncTable =
  | 'mileage_logs'
  | 'fuel_logs'
  | 'expense_logs'
  | 'earnings_logs'
  | 'shifts'
  | 'recurring_expenses'
  | 'recurring_applied_months'
  | 'posts'
  | 'comments'
  | 'replies';

// ── Push a single row ─────────────────────────────────────────────────────────
// Uses upsert so it works for both insert and update.
export async function pushRow(table: SyncTable, row: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
    if (error) reportError(`[Sync] pushRow(${table}) failed: ${error.message}`);
  } catch (err: any) {
    reportError(`[Sync] pushRow(${table}) exception: ${err?.message}`);
  }
}

// ── Delete a row ──────────────────────────────────────────────────────────────
export async function deleteRow(table: SyncTable, id: string): Promise<void> {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) reportError(`[Sync] deleteRow(${table}, ${id}) failed: ${error.message}`);
  } catch (err: any) {
    reportError(`[Sync] deleteRow exception: ${err?.message}`);
  }
}

// ── Increment a vote column ──────────────────────────────────────────────────
export async function incrementVote(
  table: 'posts' | 'comments',
  id: string,
  column: 'up_votes' | 'down_votes',
): Promise<void> {
  try {
    const { data, error: fetchErr } = await supabase.from(table).select(column).eq('id', id).single();
    if (fetchErr || !data) return;
    const newVal = ((data as any)[column] ?? 0) + 1;
    const { error } = await supabase.from(table).update({ [column]: newVal }).eq('id', id);
    if (error) reportError(`[Sync] incrementVote(${table}, ${id}) failed: ${error.message}`);
  } catch (err: any) {
    reportError(`[Sync] incrementVote exception: ${err?.message}`);
  }
}

// ── Pull all user data from Supabase ─────────────────────────────────────────
// Called once on app start (after auth). Returns null on network error.
export async function pullAll(userId: string): Promise<PulledData | null> {
  try {
    // Gas prices: show previous day's prices until 6am MST (UTC-7)
    const nowUtc = new Date();
    const mstHour = (nowUtc.getUTCHours() + 24 - 7) % 24;
    const gasPriceDate = new Date(nowUtc);
    if (mstHour < 6) gasPriceDate.setUTCDate(gasPriceDate.getUTCDate() - 1);
    const today = gasPriceDate.toISOString().split('T')[0];

    const [
      mileageRes,
      fuelRes,
      expenseRes,
      earningsRes,
      shiftsRes,
      recurringRes,
      appliedRes,
      profileRes,
      dealsRes,
      postsRes,
      commentsRes,
      repliesRes,
      gasRes,
    ] = await Promise.all([
      supabase.from('mileage_logs').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('fuel_logs').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('expense_logs').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('earnings_logs').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('shifts').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('recurring_expenses').select('*').eq('user_id', userId),
      supabase.from('recurring_applied_months').select('month_key').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('id', userId).single(),
      // Global data
      supabase.from('deals').select('*'),
      // Community posts — most recent 50, excluding soft-deleted
      supabase
        .from('posts')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50),
      // All comments for those posts
      supabase.from('comments').select('*').eq('is_deleted', false).order('created_at'),
      // All replies
      supabase.from('replies').select('*').order('created_at'),
      // Today's Regular gas prices, joined with station info
      supabase
        .from('gas_price_entries')
        .select('*, gas_stations(name, address)')
        .eq('date', today)
        .eq('fuel_type', 'Regular'),
    ]);

    // Build a map of comments per post, and nest replies into comments
    const commentsRaw = commentsRes.data ?? [];
    const repliesRaw = repliesRes.data ?? [];

    // Group replies by comment_id
    const repliesByComment = new Map<string, ForumComment[]>();
    for (const r of repliesRaw) {
      const arr = repliesByComment.get(r.comment_id) ?? [];
      arr.push({
        id: r.id,
        author: r.author_name,
        body: r.body,
        votes: 0,
        replies: [],
      });
      repliesByComment.set(r.comment_id, arr);
    }

    // Group comments by post_id, attaching replies
    const commentsByPost = new Map<string, ForumComment[]>();
    for (const c of commentsRaw) {
      const arr = commentsByPost.get(c.post_id) ?? [];
      arr.push({
        id: c.id,
        author: c.author_name,
        body: c.body,
        votes: (c.up_votes ?? 0) - (c.down_votes ?? 0),
        replies: repliesByComment.get(c.id) ?? [],
      });
      commentsByPost.set(c.post_id, arr);
    }

    // Build posts with nested comments
    const posts: ForumPost[] = (postsRes.data ?? []).map((r: any) => ({
      id: r.id,
      author: r.author_name,
      title: r.title,
      body: r.body ?? '',
      votes: (r.up_votes ?? 0) - (r.down_votes ?? 0),
      comments: commentsByPost.get(r.id) ?? [],
      tags: r.tags ?? [],
    }));

    return {
      mileage: (mileageRes.data ?? []).map(rowToMileage),
      fuel: (fuelRes.data ?? []).map(rowToFuel),
      expenses: (expenseRes.data ?? []).map(rowToExpense),
      earnings: (earningsRes.data ?? []).map(rowToEarnings),
      shifts: (shiftsRes.data ?? []).map(rowToShift),
      recurringExpenses: (recurringRes.data ?? []).map(rowToRecurring),
      recurringAppliedMonths: (appliedRes.data ?? []).map((r: any) => r.month_key as string),
      profile: profileRes.data ?? null,
      deals: (dealsRes.data ?? []).map(rowToDeal),
      posts,
      gas: (gasRes.data ?? []).map(rowToGasPrice),
    };
  } catch (err: any) {
    reportError(`[Sync] pullAll failed: ${err?.message}`);
    return null;
  }
}

// ── Upsert profile ────────────────────────────────────────────────────────────
export async function upsertProfile(row: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
    if (error) reportError(`[Sync] upsertProfile failed: ${error.message}`);
  } catch (err: any) {
    reportError(`[Sync] upsertProfile exception: ${err?.message}`);
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

function rowToDeal(r: any): Deal {
  return {
    id: r.id,
    sponsor: r.sponsor,
    category: r.category as DealCategory,
    headline: r.headline,
    detail: r.detail ?? '',
    cta: r.cta ?? 'Learn more',
    zone: r.zone ?? 'Calgary',
  };
}

function rowToGasPrice(r: any): GasPrice {
  return {
    id: r.id,
    station: r.gas_stations?.name ?? 'Calgary Average',
    price: r.price_per_litre,
    distanceKm: 0,
    address: r.gas_stations?.address ?? 'Calgary, AB',
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
  deals: Deal[];
  posts: ForumPost[];
  gas: GasPrice[];
}
