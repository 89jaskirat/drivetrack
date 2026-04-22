/**
 * Streak service — check and update the driver's daily logging streak.
 *
 * Rules:
 *  - Logging any entry (mileage, fuel, expense, earnings) counts as active for the day.
 *  - Logging multiple times on the same day only counts once.
 *  - Missing a day uses a grace day (max 3/month). When grace days are exhausted, streak resets to 1.
 *  - Grace day counter resets on the 1st of each new month (tracked via graceDaysMonth YYYYMM).
 *  - longest_streak is updated whenever current_streak surpasses it.
 */

import { supabase } from '../lib/supabase';
import type { DriverStreak } from '../types';

const GRACE_DAYS_PER_MONTH = 3;

/** Returns today's date in YYYY-MM-DD (local time, not UTC) */
function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns YYYYMM integer for the current month */
function currentYYYYMM(): number {
  const d = new Date();
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

/** Difference in calendar days between two YYYY-MM-DD strings */
function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

/**
 * Call after any successful log action (mileage, fuel, expense, earnings).
 * Returns the updated DriverStreak, or the unchanged streak if today was already counted.
 */
export async function checkAndUpdateStreak(
  userId: string,
  current: DriverStreak | null,
): Promise<DriverStreak> {
  const today = todayStr();
  const yyyymm = currentYYYYMM();

  // Build a working copy, defaulting if no prior row
  let s: DriverStreak = current ?? {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    graceDaysUsed: 0,
    graceDaysMonth: yyyymm,
  };

  // Already logged today — no change needed
  if (s.lastActiveDate === today) return s;

  // Reset grace days counter on new month
  let graceDaysUsed = s.graceDaysUsed;
  let graceDaysMonth = s.graceDaysMonth;
  if (graceDaysMonth !== yyyymm) {
    graceDaysUsed = 0;
    graceDaysMonth = yyyymm;
  }

  let currentStreak = s.currentStreak;

  if (!s.lastActiveDate) {
    // First ever log
    currentStreak = 1;
  } else {
    const gap = daysBetween(s.lastActiveDate, today);

    if (gap === 1) {
      // Consecutive day — extend streak
      currentStreak += 1;
    } else if (gap > 1) {
      // Missed days: each missed day costs one grace day
      const missedDays = gap - 1;
      const availableGrace = GRACE_DAYS_PER_MONTH - graceDaysUsed;

      if (missedDays <= availableGrace) {
        // Grace days cover the gap — streak survives
        graceDaysUsed += missedDays;
        currentStreak += 1;
      } else {
        // Not enough grace days — streak resets
        currentStreak = 1;
        graceDaysUsed = Math.min(graceDaysUsed + missedDays, GRACE_DAYS_PER_MONTH);
      }
    }
  }

  const longestStreak = Math.max(s.longestStreak, currentStreak);

  const updated: DriverStreak = {
    currentStreak,
    longestStreak,
    lastActiveDate: today,
    graceDaysUsed,
    graceDaysMonth,
  };

  // Upsert to Supabase (fire-and-forget — doesn't block the log action)
  supabase
    .from('driver_streaks')
    .upsert(
      {
        user_id: userId,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: today,
        grace_days_used: graceDaysUsed,
        grace_days_month: graceDaysMonth,
      },
      { onConflict: 'user_id' },
    )
    .then(({ error }) => {
      if (error) console.warn('[Streak] upsert failed:', error.message);
    });

  return updated;
}
