import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deleteMe } from '@/services/user';
import { useAuthStore } from '@/stores/authStore';
import { authenticateWithBiometrics } from '@/services/biometrics';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { colors, spacing, typography, radius, shadow } from '@/helpers/designTokens';

function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={headerStyles.row}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={headerStyles.title}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

export default function AccountScreen() {
  const { clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await authenticateWithBiometrics('Confirm account deletion');
            if (!ok) return;
            setLoading(true);
            try {
              await deleteMe();
              clearAuth();
              router.replace('/(auth)/login');
            } catch {
              setToast({ message: 'Failed to delete account.', variant: 'error' });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {loading && <LoadingOverlay />}
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Account" />

        <View style={styles.card}>
          <Ionicons name="warning-outline" size={24} color={colors.danger} style={styles.warningIcon} />
          <Text style={styles.warningTitle}>Danger Zone</Text>
          <Text style={styles.warningText}>
            Deleting your account is permanent. All your data, portfolios, and trade history will be removed and cannot be recovered.
          </Text>
        </View>

        <PrimaryButton
          title="Delete Account"
          variant="danger"
          onPress={handleDeleteAccount}
          style={styles.btn}
        />
      </ScrollView>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} visible onHide={() => setToast(null)} />
      )}
    </SafeAreaView>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: { ...typography.headline, color: colors.textPrimary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.danger + '0D',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger + '33',
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  warningIcon: { marginBottom: spacing.xs },
  warningTitle: { ...typography.headline, color: colors.danger },
  warningText: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  btn: { marginTop: spacing.lg },
});
