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
import { login } from '@/services/auth';
import { fetchMe } from '@/services/user';
import { useAuthStore } from '@/stores/authStore';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { colors, spacing, typography, radius } from '@/helpers/designTokens';
import { validateEmail } from '@/helpers/validators';
import { ApiError } from '@/services/api/errors';

export default function LoginScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const setForceChangePassword = useAuthStore((s) => s.setForceChangePassword);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(
    null
  );

  async function handleLogin() {
    if (!validateEmail(email)) {
      setToast({ message: 'Please enter a valid email address.', variant: 'error' });
      return;
    }
    if (!password) {
      setToast({ message: 'Password is required.', variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      const user = await fetchMe();
      setUser(user);
      router.replace('/(app)/(tabs)/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'FORBIDDEN') {
        setForceChangePassword(true);
        router.replace('/change-password');
      } else {
        const message = err instanceof ApiError ? err.userMessage : 'Login failed.';
        setToast({ message, variant: 'error' });
      }
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
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to TwinTrades</Text>

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
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.forgotLink}
        >
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>

        <PrimaryButton title="Sign In" loading={loading} onPress={handleLogin} style={styles.btn} />

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
          <Text style={styles.mutedText}>
            Don't have an account? <Text style={styles.link}>Register</Text>
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
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.md },
  link: { color: colors.accent },
  btn: { marginTop: spacing.sm },
  registerLink: { marginTop: spacing.lg, alignItems: 'center' },
  mutedText: { ...typography.body, color: colors.textMuted },
});
