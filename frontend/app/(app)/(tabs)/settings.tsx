import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMe, updateMe, deleteMe } from '@/services/user';
import { fetchSubscriptionStatus } from '@/services/subscription';
import {
  fetchBrokerageConnections,
  initiateOAuth,
  disconnectBrokerage,
} from '@/services/brokerage';
import { logout } from '@/services/auth';
import {
  fetchProducts,
  purchaseProduct,
  restorePurchases,
  disconnectIAP,
} from '@/services/iap';
import { canUseBiometrics, authenticateWithBiometrics } from '@/services/biometrics';
import { useAuthStore } from '@/stores/authStore';
import { clearTokens } from '@/services/keychain';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { colors, spacing, typography, radius } from '@/helpers/designTokens';
import { BrokerageConnection } from '@/models/Brokerage';
import * as Linking from 'expo-linking';

export default function SettingsScreen() {
  const qc = useQueryClient();
  const { user, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: fetchSubscriptionStatus,
  });

  const { data: brokerages = [], refetch: refetchBrokerages } = useQuery({
    queryKey: ['brokerage-connections'],
    queryFn: fetchBrokerageConnections,
  });

  const { data: iapProducts = [] } = useQuery({
    queryKey: ['iap-products'],
    queryFn: fetchProducts,
    enabled: Platform.OS === 'ios',
  });

  async function handleLogout() {
    setLoading(true);
    try {
      await logout();
    } finally {
      await disconnectIAP();
      clearAuth();
      setLoading(false);
      router.replace('/(auth)/login');
    }
  }

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

  async function handleConnectBrokerage(slug: string) {
    setLoading(true);
    try {
      const { auth_url } = await initiateOAuth(slug);
      await Linking.openURL(auth_url);
    } catch {
      setToast({ message: 'Failed to initiate connection.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnectBrokerage(connection: BrokerageConnection) {
    Alert.alert('Disconnect', `Disconnect from ${connection.brokerage_slug}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          try {
            await disconnectBrokerage(connection.id);
            refetchBrokerages();
          } catch {
            setToast({ message: 'Failed to disconnect brokerage.', variant: 'error' });
          }
        },
      },
    ]);
  }

  async function handlePurchase(productId: string) {
    setLoading(true);
    try {
      const result = await purchaseProduct(productId);
      if (result) {
        setToast({ message: 'Subscription active!', variant: 'success' });
        qc.invalidateQueries({ queryKey: ['subscription-status'] });
      }
    } catch {
      setToast({ message: 'Purchase failed. Try again.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleRestorePurchases() {
    setLoading(true);
    try {
      await restorePurchases();
      setToast({ message: 'Purchases restored.', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['subscription-status'] });
    } catch {
      setToast({ message: 'Could not restore purchases.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {loading && <LoadingOverlay />}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile */}
        <Section title="Profile">
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>@{user?.username}</Text>
          <PrimaryButton
            title="Change Password"
            variant="ghost"
            onPress={() => router.push('/change-password')}
            style={styles.btn}
          />
        </Section>

        {/* Subscription */}
        <Section title="Subscription">
          {subscription ? (
            <>
              <Text style={styles.value}>
                Plan: {subscription.plan} — {subscription.status}
              </Text>
            </>
          ) : (
            <Text style={styles.value}>No active subscription.</Text>
          )}

          {Platform.OS === 'ios' &&
            iapProducts.map((product) => (
              <PrimaryButton
                key={product.productId}
                title={`Buy ${product.title}`}
                onPress={() => handlePurchase(product.productId)}
                style={styles.btn}
              />
            ))}

          {Platform.OS === 'ios' && (
            <PrimaryButton
              title="Restore Purchases"
              variant="ghost"
              onPress={handleRestorePurchases}
              style={styles.btn}
            />
          )}
        </Section>

        {/* Brokerages */}
        <Section title="Brokerage Connections">
          {brokerages.length === 0 ? (
            <Text style={styles.value}>No brokerages connected.</Text>
          ) : (
            brokerages.map((b) => (
              <View key={b.id} style={styles.brokerageRow}>
                <Text style={styles.value}>{b.brokerage_slug}</Text>
                <Text
                  style={styles.disconnect}
                  onPress={() => handleDisconnectBrokerage(b)}
                >
                  Disconnect
                </Text>
              </View>
            ))
          )}
          {['alpaca', 'schwab', 'webull']
            .filter((slug) => !brokerages.find((b) => b.brokerage_slug === slug))
            .map((slug) => (
              <PrimaryButton
                key={slug}
                title={`Connect ${slug.charAt(0).toUpperCase() + slug.slice(1)}`}
                variant="ghost"
                onPress={() => handleConnectBrokerage(slug)}
                style={styles.btn}
              />
            ))}
        </Section>

        {/* Admin */}
        {(user?.role === 'admin' || user?.role === 'ultimate_admin') && (
          <Section title="Admin">
            <PrimaryButton
              title="Admin Dashboard"
              variant="ghost"
              onPress={() => router.push('/(app)/admin')}
              style={styles.btn}
            />
          </Section>
        )}

        {/* Danger zone */}
        <Section title="Account">
          <PrimaryButton
            title="Sign Out"
            variant="ghost"
            onPress={handleLogout}
            style={styles.btn}
          />
          <PrimaryButton
            title="Delete Account"
            variant="danger"
            onPress={handleDeleteAccount}
            style={styles.btn}
          />
        </Section>
      </ScrollView>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          visible
          onHide={() => setToast(null)}
        />
      )}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.heading}>{title}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.sm },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { padding: spacing.md },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  value: { ...typography.body, color: colors.textPrimary, marginTop: 2 },
  btn: { marginTop: spacing.sm },
  brokerageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  disconnect: { ...typography.body, color: colors.danger },
});
