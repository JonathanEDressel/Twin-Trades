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
import { changePassword } from '@/services/auth';
import { fetchMe } from '@/services/user';
import { useAuthStore } from '@/stores/authStore';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { colors, spacing, typography, radius } from '@/helpers/designTokens';
import { validatePassword } from '@/helpers/validators';
import { ApiError } from '@/services/api/errors';

export default function ChangePasswordScreen() {
  const { setUser, setForceChangePassword } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(
    null
  );

  async function handleChange() {
    if (!currentPassword) {
      setToast({ message: 'Current password is required.', variant: 'error' });
      return;
    }
    const pw = validatePassword(newPassword);
    if (!pw.isValid) {
      setToast({ message: pw.errors.join(', '), variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      const user = await fetchMe();
      setUser(user);
      setForceChangePassword(false);
      router.replace('/(app)/(tabs)/');
    } catch (err) {
      const message = err instanceof ApiError ? err.userMessage : 'Failed to change password.';
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
        <Text style={styles.title}>Change password</Text>
        <Text style={styles.subtitle}>
          Your account requires a password change before continuing.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Current password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
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
          title="Change Password"
          loading={loading}
          onPress={handleChange}
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
