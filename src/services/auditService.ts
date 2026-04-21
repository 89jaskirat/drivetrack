/**
 * auditService — logs all logins, CRUD operations, and session info to Supabase.
 *
 * Offline-friendly: queues locally and syncs when connected.
 * Retention: 1 year (enforced server-side via scheduled cleanup).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from '../lib/supabase';
import type { AuditAction, AuditLogEntry } from '../types';

const QUEUE_KEY = 'drivetrack-audit-queue';
const FLUSH_INTERVAL = 15_000; // 15 seconds

let _userId: string | null = null;
let _sessionId: string = Crypto.randomUUID();
let _queue: AuditLogEntry[] = [];
let _flushTimer: ReturnType<typeof setInterval> | null = null;
let _sessionStartedAt: string = new Date().toISOString();

// ── Public API ──────────────────────────────────────────────────────────────

export function initAuditService(userId: string | null) {
  _userId = userId;
  _sessionId = Crypto.randomUUID();
  _sessionStartedAt = new Date().toISOString();

  // Load pending logs from previous session
  AsyncStorage.getItem(QUEUE_KEY)
    .then((raw) => {
      if (raw) {
        const saved = JSON.parse(raw) as AuditLogEntry[];
        _queue = [...saved, ..._queue];
      }
    })
    .catch(() => {});

  if (_flushTimer) clearInterval(_flushTimer);
  _flushTimer = setInterval(flush, FLUSH_INTERVAL);
}

export function stopAuditService() {
  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
  flush();
}

export function setAuditUserId(userId: string | null) {
  _userId = userId;
}

/**
 * Log an audit event. Fire-and-forget.
 */
export function audit(
  action: AuditAction,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>,
) {
  const entry: AuditLogEntry = {
    id: Crypto.randomUUID(),
    userId: _userId ?? 'anonymous',
    action,
    resource,
    resourceId,
    details,
    timestamp: new Date().toISOString(),
    sessionId: _sessionId,
  };
  _queue.push(entry);
}

/**
 * Log a login event with session metadata.
 */
export function auditLogin(userId: string) {
  _userId = userId;
  audit('login', 'auth', userId, {
    session_started: _sessionStartedAt,
  });
}

/**
 * Log a logout event with session duration.
 */
export function auditLogout() {
  const sessionDurationMs = Date.now() - new Date(_sessionStartedAt).getTime();
  audit('logout', 'auth', _userId ?? undefined, {
    session_duration_ms: sessionDurationMs,
  });
  // Flush immediately on logout
  flush();
}

// ── Internals ───────────────────────────────────────────────────────────────

async function flush() {
  if (_queue.length === 0 || !_userId) return;

  const batch = _queue.splice(0, 50);
  const rows = batch.map((e) => ({
    id: e.id,
    user_id: e.userId,
    action: e.action,
    resource: e.resource,
    resource_id: e.resourceId ?? null,
    details: e.details ?? {},
    session_id: e.sessionId,
    created_at: e.timestamp,
  }));

  try {
    const { error } = await supabase.from('audit_logs').insert(rows);
    if (error) {
      _queue.unshift(...batch);
      console.warn('[Audit] flush failed:', error.message);
    }
  } catch {
    _queue.unshift(...batch);
  }

  AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(_queue)).catch(() => {});
}
