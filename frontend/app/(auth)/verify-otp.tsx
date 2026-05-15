import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { requestOtp, verifyOtp } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { colors, spacing, typography, radius } from '@/helpers/designTokens';
import { ApiError } from '@/services/api/errors';

export default function VerifyOtpScreen() {
  const { purpose } = useLocalSearchParams<{ purpose: string }>();
  const user = useAuthStore((s) => s.user);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(
    null
  );

  useEffect(() => {
    sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendCode() {
    try {
      await requestOtp({ purpose: purpose ?? 'login_2fa' });
    } catch {
      setToast({ message: 'Failed to send verification code.', variant: 'error' });
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await requestOtp({ purpose: purpose ?? 'login_2fa' });
      setToast({ message: 'A new code has been sent.', variant: 'success' });
    } catch (err) {
      const message = err instanceof ApiError ? err.userMessage : 'Failed to resend code.';
      setToast({ message, variant: 'error' });
    } finally {
      setResending(false);
    }
  }

  async function handleVerify() {
    if (!otp.trim()) {
      setToast({ message: 'Please enter the verification code.', variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({ otp: otp.trim(), purpose: purpose ?? 'login_2fa' });
      setToast({ message: 'Verified successfully.', variant: 'success' });
      setTimeout(() => router.replace('/(app)/(tabs)/'), 1000);
    } catch (err) {
      const message = err instanceof ApiError ? err.userMessage : 'Verification failed.';
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
        <Text style={styles.title}>Verify your identity</Text>
        <Text style={styles.subtitle}>
          A 6-digit code was sent to {user?.email ?? 'your email'}. Enter it below.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="6-digit code"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          onSubmitEditing={handleVerify}
        />

        <PrimaryButton
          title="Verify"
          loading={loading}
          onPress={handleVerify}
          style={styles.btn}
        />

        <PrimaryButton
          title={resending ? 'Sending…' : 'Resend code'}
          loading={resending}
          onPress={handleResend}
          style={styles.resendBtn}
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
    letterSpacing: 6,
    textAlign: 'center',
  },
  btn: { marginTop: spacing.sm },
  resendBtn: { marginTop: spacing.md, opacity: 0.7 },
});
