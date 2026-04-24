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
import { resetPassword } from '@/services/auth';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { colors, spacing, typography, radius } from '@/helpers/designTokens';
import { validatePassword } from '@/helpers/validators';
import { ApiError } from '@/services/api/errors';

export default function ResetPasswordScreen() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(
    null
  );

  async function handleReset() {
    if (!token.trim()) {
      setToast({ message: 'Please enter the reset code from your email.', variant: 'error' });
      return;
    }
    const pw = validatePassword(newPassword);
    if (!pw.isValid) {
      setToast({ message: pw.errors.join(', '), variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token: token.trim(), new_password: newPassword });
      setToast({ message: 'Password reset successfully. Please sign in.', variant: 'success' });
      setTimeout(() => router.replace('/(auth)/login'), 1500);
    } catch (err) {
      const message = err instanceof ApiError ? err.userMessage : 'Reset failed.';
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
        <Text style={styles.title}>Set new password</Text>
        <Text style={styles.subtitle}>Enter the code from your email and a new password.</Text>

        <TextInput
          style={styles.input}
          placeholder="Reset code"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          value={token}
          onChangeText={setToken}
        />
        <TextInput
          style={styles.input}
          placeholder="New password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <PrimaryButton
          title="Reset Password"
          loading={loading}
          onPress={handleReset}
          style={styles.btn}
        />
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
