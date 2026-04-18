import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ── Secure storage adapter for Supabase JWT ──────────────────────────────────
// Supabase needs a key-value store for session persistence.
// expo-secure-store uses the OS secure enclave (Keychain / Keystore).
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// ── Config ───────────────────────────────────────────────────────────────────
// Fill these in app.json → extra after creating your Supabase project.
const SUPABASE_URL: string =
  Constants.expoConfig?.extra?.supabaseUrl ?? '';

const SUPABASE_ANON_KEY: string =
  Constants.expoConfig?.extra?.supabaseAnonKey ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase] supabaseUrl or supabaseAnonKey not set in app.json extra. ' +
    'Auth and sync will not work until configured.'
  );
}

// ── Supabase client singleton ────────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
