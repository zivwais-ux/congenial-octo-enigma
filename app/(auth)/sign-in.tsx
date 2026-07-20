import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { AppText, Button, Screen } from '@/components';
import { radius, spacing, typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/context/AuthContext';
import type { AuthProvider } from '@/services';

export default function SignIn() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signInWithEmail, signInWithProvider, continueAsGuest } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<null | 'email' | AuthProvider | 'guest'>(null);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const canSubmit = emailValid && password.length >= 6;

  const go = () => router.replace('/(tabs)');

  const onEmailSignIn = async () => {
    if (!canSubmit) {
      setError('Enter a valid email and a password of at least 6 characters.');
      return;
    }
    setError(null);
    setLoading('email');
    try {
      await signInWithEmail(email.trim(), password);
      go();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
    } finally {
      setLoading(null);
    }
  };

  const onProvider = async (provider: AuthProvider) => {
    setError(null);
    setLoading(provider);
    try {
      await signInWithProvider(provider);
      go();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
    } finally {
      setLoading(null);
    }
  };

  const onGuest = async () => {
    setError(null);
    setLoading('guest');
    try {
      await continueAsGuest();
      go();
    } finally {
      setLoading(null);
    }
  };

  return (
    <Screen edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.logo}>
              <Ionicons name="fast-food" size={34} color="#fff" />
            </View>
            <AppText variant="display" style={styles.heroTitle}>
              Street Eats Asia
            </AppText>
            <AppText variant="bodyStrong" center style={styles.heroTagline}>
              Real recommendations from travelers on the ground. Find the stall
              the guidebooks miss.
            </AppText>
          </LinearGradient>

          <View style={styles.body}>
          <View style={styles.form}>
            <Field
              icon="mail-outline"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error && (
              <AppText variant="caption" color="danger">
                {error}
              </AppText>
            )}

            <Button
              label="Sign in"
              onPress={onEmailSignIn}
              loading={loading === 'email'}
              disabled={!!loading}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <AppText variant="caption" color="textFaint">
              or continue with
            </AppText>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.providers}>
            <Button
              label="Google"
              icon="logo-google"
              variant="secondary"
              onPress={() => onProvider('google')}
              loading={loading === 'google'}
              disabled={!!loading}
              style={{ flex: 1 }}
            />
            <Button
              label="Apple"
              icon="logo-apple"
              variant="secondary"
              onPress={() => onProvider('apple')}
              loading={loading === 'apple'}
              disabled={!!loading}
              style={{ flex: 1 }}
            />
          </View>

          <Pressable onPress={onGuest} disabled={!!loading} style={styles.guest}>
            <AppText variant="label" color="textMuted">
              Just browsing?{' '}
              <AppText variant="label" color="brand">
                Explore as a guest
              </AppText>
            </AppText>
          </Pressable>

          <View style={styles.signup}>
            <AppText variant="body" color="textMuted">
              New here?{' '}
            </AppText>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <AppText variant="bodyStrong" color="brand">
                  Create an account
                </AppText>
              </Pressable>
            </Link>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({
  icon,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.field,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[styles.input, typography.body, { color: colors.text }]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.huge + spacing.xl,
    paddingBottom: spacing.xxxl + spacing.md,
    paddingHorizontal: spacing.xxl,
    borderBottomLeftRadius: radius.xl + 8,
    borderBottomRightRadius: radius.xl + 8,
  },
  heroTitle: { color: '#fff', textAlign: 'center' },
  heroTagline: { color: 'rgba(255,255,255,0.92)', maxWidth: 320 },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  form: { gap: spacing.md },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  input: { flex: 1, paddingVertical: 0 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1 },
  providers: { flexDirection: 'row', gap: spacing.md },
  guest: { alignItems: 'center', paddingVertical: spacing.sm },
  signup: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
