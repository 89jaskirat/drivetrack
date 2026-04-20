import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '[Admin] Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env\n' +
    'Copy .env.example → .env and fill in your Supabase credentials.'
  );
}

/**
 * Service-role client — bypasses RLS entirely.
 * Only used in the admin panel. Never ship this key in the mobile app.
 */
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/** Write an entry to the admin audit log (best-effort, never throws). */
export async function writeAuditLog(
  adminId: string,
  action: string,
  targetTable?: string,
  targetId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      target_table: targetTable ?? null,
      target_id: targetId ?? null,
      details: details ?? null,
    });
  } catch {
    // Audit failures are non-fatal
  }
}
