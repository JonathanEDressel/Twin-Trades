import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSubscriptionStatus } from '@/services/subscription';
import { fetchProducts, purchaseProduct, restorePurchases } from '@/services/iap';
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

export default function SubscriptionScreen() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: fetchSubscriptionStatus,
  });

  const { data: iapProducts = [] } = useQuery({
    queryKey: ['iap-products'],
    queryFn: fetchProducts,
    enabled: Platform.OS === 'ios',
  });

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

  async function handleRestore() {
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

  const statusColor = subscription?.status === 'active' ? colors.success : colors.warning;

  return (
    <SafeAreaView style={styles.safe}>
      {loading && <LoadingOverlay />}
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Subscription" />

        <View style={styles.card}>
          {subscription ? (
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.plan}>{subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}</Text>
                <Text style={styles.statusText}>
                  Status: <Text style={{ color: statusColor, fontWeight: '600' }}>{subscription.status}</Text>
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: statusColor + '20', borderColor: statusColor + '44' }]}>
                <Text style={[styles.badgeText, { color: statusColor }]}>{subscription.status}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noSub}>No active subscription.</Text>
          )}
        </View>

        {Platform.OS === 'ios' && iapProducts.length > 0 && (
          <View style={styles.productsSection}>
            <Text style={styles.sectionLabel}>Available Plans</Text>
            {iapProducts.map((product) => (
              <PrimaryButton
                key={product.productId}
                title={`Buy ${product.title}`}
                onPress={() => handlePurchase(product.productId)}
                style={styles.btn}
              />
            ))}
            <PrimaryButton
              title="Restore Purchases"
              variant="ghost"
              onPress={handleRestore}
              style={styles.btn}
            />
          </View>
        )}
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
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plan: { ...typography.headline, color: colors.textPrimary },
  statusText: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  badgeText: { ...typography.caption, fontWeight: '600' },
  noSub: { ...typography.body, color: colors.textMuted },
  productsSection: { marginTop: spacing.lg },
  sectionLabel: {
    ...typography.headline,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  btn: { marginTop: spacing.sm },
});
