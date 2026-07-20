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
import { useRouter } from 'expo-router';
import { AppText, Button, IconButton, Screen } from '@/components';
import { radius, spacing, typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/context/AuthContext';

export default function SignUp() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signUpWithEmail } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const canSubmit = name.trim().length >= 2 && emailValid && password.length >= 6;

  const onSubmit = async () => {
    if (!canSubmit) {
      setError('Add your name, a valid email, and a 6+ character password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.topBar}>
          <IconButton
            icon="chevron-back"
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: spacing.xs }}>
            <AppText variant="title">Join the community</AppText>
            <AppText variant="body" color="textMuted">
              Share the spots you love and help travelers eat like locals.
            </AppText>
          </View>

          <View style={styles.form}>
            <Field
              icon="person-outline"
              placeholder="Display name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
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
              placeholder="Password (min 6 characters)"
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
              label="Create account"
              onPress={onSubmit}
              loading={loading}
              disabled={loading}
            />
          </View>

          <AppText variant="caption" color="textFaint" center style={{ paddingHorizontal: spacing.lg }}>
            By continuing you agree to our Terms of Service and acknowledge our
            Privacy Policy.
          </AppText>
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
  topBar: { paddingTop: spacing.sm },
  content: { paddingVertical: spacing.xl, gap: spacing.xl, flexGrow: 1, justifyContent: 'center' },
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
});
