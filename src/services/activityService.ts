/**
 * activityService — tracks user activity (screen views, taps) and syncs to Supabase.
 *
 * Collects events locally, flushes to Supabase in batches.
 * Tracks per-screen open time automatically.
 * Always active (no opt-in required).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from '../lib/supabase';
import type { ActivityEvent } from '../types';

const QUEUE_KEY = 'drivetrack-activity-queue';
const FLUSH_INTERVAL = 30_000; // 30 seconds
const MAX_BATCH = 50;

let _userId: string | null = null;
let _sessionId: string = Crypto.randomUUID();
let _queue: ActivityEvent[] = [];
let _flushTimer: ReturnType<typeof setInterval> | null = null;
let _screenEnteredAt: number | null = null;
let _currentScreen: string | null = null;

// ── Public API ──────────────────────────────────────────────────────────────

export function initActivityTracking(userId: string | null) {
  _userId = userId;
  _sessionId = Crypto.randomUUID();
  // Load any pending events from previous session
  AsyncStorage.getItem(QUEUE_KEY)
    .then((raw) => {
      if (raw) {
        const saved = JSON.parse(raw) as ActivityEvent[];
        _queue = [...saved, ..._queue];
      }
    })
    .catch(() => {});

  // Start periodic flush
  if (_flushTimer) clearInterval(_flushTimer);
  _flushTimer = setInterval(flush, FLUSH_INTERVAL);
}

export function stopActivityTracking() {
  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
  // Final flush + persist remainder
  flush();
}

export function setActivityUserId(userId: string | null) {
  _userId = userId;
}

/**
 * Call when a screen comes into focus.
 */
export function trackScreenView(screenName: string) {
  // End time for previous screen
  if (_currentScreen && _screenEnteredAt) {
    const durationMs = Date.now() - _screenEnteredAt;
    enqueue({
      screenName: _currentScreen,
      action: 'screen_close',
      metadata: { duration_ms: durationMs },
    });
  }

  _currentScreen = screenName;
  _screenEnteredAt = Date.now();

  enqueue({
    screenName,
    action: 'screen_view',
  });
}

/**
 * Call on any user tap / action.
 */
export function trackTap(screenName: string, action: string, metadata?: Record<string, string | number>) {
  enqueue({ screenName, action, metadata });
}

// ── Internals ───────────────────────────────────────────────────────────────

function enqueue(partial: Omit<ActivityEvent, 'id' | 'timestamp' | 'sessionId'>) {
  const event: ActivityEvent = {
    id: Crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    sessionId: _sessionId,
    ...partial,
  };
  _queue.push(event);
}

async function flush() {
  if (_queue.length === 0 || !_userId) return;

  const batch = _queue.splice(0, MAX_BATCH);
  const rows = batch.map((e) => ({
    id: e.id,
    user_id: _userId,
    session_id: e.sessionId,
    screen_name: e.screenName,
    action: e.action,
    metadata: e.metadata ?? {},
    created_at: e.timestamp,
  }));

  try {
    const { error } = await supabase.from('activity_events').insert(rows);
    if (error) {
      // Put events back for retry
      _queue.unshift(...batch);
      console.warn('[Activity] flush failed:', error.message);
    }
  } catch {
    _queue.unshift(...batch);
  }

  // Persist remaining queue for crash recovery
  AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(_queue)).catch(() => {});
}
