import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { register } from '@/services/auth';
import { fetchMe } from '@/services/user';
import { useAuthStore } from '@/stores/authStore';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { colors, spacing, typography, radius } from '@/helpers/designTokens';
import { validateEmail, validatePassword, validateUsername } from '@/helpers/validators';
import { ApiError } from '@/services/api/errors';

export default function RegisterScreen() {
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(
    null
  );

  async function handleRegister() {
    if (!validateEmail(email)) {
      setToast({ message: 'Please enter a valid email address.', variant: 'error' });
      return;
    }
    if (!validateUsername(username)) {
      setToast({
        message: 'Username must be 3–30 characters: letters, numbers, underscores only.',
        variant: 'error',
      });
      return;
    }
    const pw = validatePassword(password);
    if (!pw.isValid) {
      setToast({ message: pw.errors.join(', '), variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        username,
        password,
        display_name: displayName || undefined,
      });
      const user = await fetchMe();
      setUser(user);
      router.replace('/(app)/(tabs)/');
    } catch (err) {
      const message = err instanceof ApiError ? err.userMessage : 'Registration failed.';
      setToast({ message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join TwinTrades today</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Display name (optional)"
          placeholderTextColor={colors.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <PrimaryButton
          title="Create Account"
          loading={loading}
          onPress={handleRegister}
          style={styles.btn}
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={styles.loginLink}
        >
          <Text style={styles.mutedText}>
            Already have an account? <Text style={styles.link}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          visible
          onHide={() => setToast(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xl },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.sm,
    fontSize: 16,
  },
  btn: { marginTop: spacing.sm },
  loginLink: { marginTop: spacing.lg, alignItems: 'center' },
  mutedText: { ...typography.body, color: colors.textMuted },
  link: { color: colors.accent },
});
