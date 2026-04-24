import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { forgotPassword } from '@/services/auth';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { colors, spacing, typography, radius } from '@/helpers/designTokens';
import { validateEmail } from '@/helpers/validators';
import { ApiError } from '@/services/api/errors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(
    null
  );

  async function handleSubmit() {
    if (!validateEmail(email)) {
      setToast({ message: 'Please enter a valid email address.', variant: 'error' });
      return;
    }
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      const message = err instanceof ApiError ? err.userMessage : 'Request failed.';
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
        {sent ? (
          <>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.body}>
              If an account exists for {email}, you'll receive a password reset link shortly.
            </Text>
            <PrimaryButton
              title="Enter Reset Code"
              onPress={() => router.push('/(auth)/reset-password')}
              style={styles.btn}
            />
          </>
        ) : (
          <>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a reset link.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <PrimaryButton
              title="Send Reset Link"
              loading={loading}
              onPress={handleSubmit}
              style={styles.btn}
            />
          </>
        )}
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
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xl },
  body: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
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
});
