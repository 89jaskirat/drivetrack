import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/authService';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';

type Mode = 'landing' | 'signIn' | 'signUp';

export function AuthScreen() {
  const { cloudSignIn } = useAppState();
  const [mode, setMode] = useState<Mode>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function clearError() { setError(''); }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function handleGoogle() {
    setLoading(true);
    setError('');
    const result = await signInWithGoogle();
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    await cloudSignIn(result.userId, result.email, result.name);
  }

  // ── Email sign-in ─────────────────────────────────────────────────────────
  async function handleEmailSignIn() {
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setLoading(true);
    setError('');
    const result = await signInWithEmail(email.trim(), password);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    await cloudSignIn(result.userId, result.email, result.name);
  }

  // ── Email sign-up ─────────────────────────────────────────────────────────
  async function handleEmailSignUp() {
    if (!name.trim()) { setError('Enter your name.'); return; }
    if (!email.trim()) { setError('Enter your email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    const result = await signUpWithEmail(email.trim(), password, name.trim());
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    await cloudSignIn(result.userId, result.email, result.name);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo / hero ── */}
          <View style={styles.hero}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>◈</Text>
            </View>
            <Text style={styles.appName}>DriveTrack</Text>
            <Text style={styles.tagline}>Your earnings. Your deductions. Your data.</Text>
          </View>

          {/* ── Landing ── */}
          {mode === 'landing' && (
            <View style={styles.card}>
              <GoogleButton onPress={handleGoogle} loading={loading} />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={styles.outlineBtn}
                onPress={() => { clearError(); setMode('signIn'); }}
              >
                <Text style={styles.outlineBtnText}>Continue with Email</Text>
              </Pressable>

              <Pressable onPress={() => { clearError(); setMode('signUp'); }}>
                <Text style={styles.linkText}>New here? Create an account →</Text>
              </Pressable>

              <Text style={styles.phoneSoon}>📱 Phone sign-in coming soon</Text>

              {!!error && <ErrorBanner message={error} />}
            </View>
          )}

          {/* ── Email Sign In ── */}
          {mode === 'signIn' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sign in</Text>

              <Field label="Email" value={email}
                onChangeText={(v) => { setEmail(v); clearError(); }}
                keyboardType="email-address" autoCapitalize="none" />
              <Field label="Password" value={password}
                onChangeText={(v) => { setPassword(v); clearError(); }}
                secureTextEntry />

              {!!error && <ErrorBanner message={error} />}

              <Pressable
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleEmailSignIn} disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={appTheme.colors.inverseWhite} />
                  : <Text style={styles.primaryBtnText}>Sign in</Text>}
              </Pressable>

              <Pressable onPress={() => { clearError(); setMode('signUp'); }}>
                <Text style={styles.linkText}>No account? Sign up →</Text>
              </Pressable>
              <Pressable onPress={() => { clearError(); setMode('landing'); }}>
                <Text style={styles.backText}>← Back</Text>
              </Pressable>
            </View>
          )}

          {/* ── Email Sign Up ── */}
          {mode === 'signUp' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create account</Text>

              <Field label="Your name" value={name}
                onChangeText={(v) => { setName(v); clearError(); }} />
              <Field label="Email" value={email}
                onChangeText={(v) => { setEmail(v); clearError(); }}
                keyboardType="email-address" autoCapitalize="none" />
              <Field label="Password (min 8 chars)" value={password}
                onChangeText={(v) => { setPassword(v); clearError(); }}
                secureTextEntry />

              {!!error && <ErrorBanner message={error} />}

              <Pressable
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleEmailSignUp} disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={appTheme.colors.inverseWhite} />
                  : <Text style={styles.primaryBtnText}>Create account</Text>}
              </Pressable>

              <Pressable onPress={() => { clearError(); setMode('signIn'); }}>
                <Text style={styles.linkText}>Already have an account? Sign in →</Text>
              </Pressable>
              <Pressable onPress={() => { clearError(); setMode('landing'); }}>
                <Text style={styles.backText}>← Back</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.legal}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GoogleButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.85 }]}
      onPress={onPress}
      disabled={loading}
    >
      {loading
        ? <ActivityIndicator color={appTheme.colors.inverseWhite} />
        : (
          <>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleLabel}>Continue with Google</Text>
          </>
        )}
    </Pressable>
  );
}

function Field({
  label, value, onChangeText, keyboardType, secureTextEntry, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'email-address' | 'default';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={false}
        style={styles.input}
        placeholderTextColor={appTheme.colors.bodyGray}
      />
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: appTheme.surface.screen },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: appTheme.spacing.base,
    paddingBottom: appTheme.spacing.xl,
    gap: appTheme.spacing.lg,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    paddingTop: appTheme.spacing.xl,
    paddingBottom: appTheme.spacing.lg,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: appTheme.surface.hero,
    borderWidth: 1.5,
    borderColor: appTheme.colors.playstationBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: appTheme.spacing.sm,
  },
  logoIcon: { fontSize: 32, color: appTheme.colors.playstationBlue },
  appName: {
    color: appTheme.colors.inverseWhite,
    fontSize: 30,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  tagline: {
    color: appTheme.colors.bodyGray,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.base,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  cardTitle: {
    color: appTheme.colors.inverseWhite,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: appTheme.spacing.sm,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: appTheme.spacing.sm,
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: appTheme.radii.button,
    paddingVertical: 14,
    paddingHorizontal: appTheme.spacing.lg,
  },
  googleIcon: { color: appTheme.colors.inverseWhite, fontSize: 16, fontWeight: '800' },
  googleLabel: { color: appTheme.colors.inverseWhite, fontSize: 15, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: appTheme.spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: appTheme.surface.border },
  dividerText: { color: appTheme.colors.bodyGray, fontSize: 12, fontWeight: '500' },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: appTheme.surface.border,
    borderRadius: appTheme.radii.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineBtnText: { color: appTheme.colors.inverseWhite, fontSize: 15, fontWeight: '600' },
  linkText: {
    color: appTheme.colors.playstationBlue,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  phoneSoon: { color: appTheme.colors.bodyGray, fontSize: 12, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: appTheme.radii.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: appTheme.colors.inverseWhite, fontSize: 15, fontWeight: '600' },
  field: { gap: appTheme.spacing.sm },
  fieldLabel: {
    color: appTheme.colors.secondaryText,
    fontSize: 11,
    fontWeight: '600',
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
    fontSize: 15,
  },
  errorBanner: {
    backgroundColor: '#2d1010',
    borderRadius: appTheme.radii.input,
    borderWidth: 1,
    borderColor: '#cc3333',
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  errorText: { color: '#ff6b6b', fontSize: 13, lineHeight: 18 },
  backText: { color: appTheme.colors.bodyGray, fontSize: 13, textAlign: 'center' },
  legal: {
    color: appTheme.colors.bodyGray,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
