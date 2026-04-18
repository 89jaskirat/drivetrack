import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

// Required for expo-auth-session on Android to dismiss the browser after OAuth
WebBrowser.maybeCompleteAuthSession();

// ── Types ────────────────────────────────────────────────────────────────────
export type AuthResult =
  | { success: true; userId: string; email: string; name: string }
  | { success: false; error: string };

// ── Google OAuth ─────────────────────────────────────────────────────────────
// Uses PKCE flow — no client secret stored on device.
// Requires supabase Google provider configured in Supabase Dashboard.
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'drivetrack' });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return { success: false, error: error?.message ?? 'No OAuth URL returned' };
    }

    // Open the Google login page in the device browser
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type !== 'success') {
      return { success: false, error: 'Google sign-in was cancelled or failed' };
    }

    // Extract tokens from the redirect URL
    const url = new URL(result.url);
    const accessToken = url.searchParams.get('access_token') ?? url.hash.split('access_token=')[1]?.split('&')[0];
    const refreshToken = url.searchParams.get('refresh_token') ?? url.hash.split('refresh_token=')[1]?.split('&')[0];

    if (!accessToken) {
      return { success: false, error: 'No access token in redirect URL' };
    }

    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? '',
    });

    if (sessionError || !session.user) {
      return { success: false, error: sessionError?.message ?? 'Failed to set session' };
    }

    return {
      success: true,
      userId: session.user.id,
      email: session.user.email ?? '',
      name: (session.user.user_metadata?.full_name as string) ?? (session.user.user_metadata?.name as string) ?? '',
    };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error during Google sign-in' };
  }
}

// ── Email / Password — Sign In ───────────────────────────────────────────────
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return { success: false, error: error?.message ?? 'Sign in failed' };
    }
    return {
      success: true,
      userId: data.user.id,
      email: data.user.email ?? '',
      name: (data.user.user_metadata?.name as string) ?? '',
    };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' };
  }
}

// ── Email / Password — Sign Up ───────────────────────────────────────────────
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error || !data.user) {
      return { success: false, error: error?.message ?? 'Sign up failed' };
    }
    return {
      success: true,
      userId: data.user.id,
      email: data.user.email ?? '',
      name,
    };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' };
  }
}

// ── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ── Get current session ──────────────────────────────────────────────────────
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
