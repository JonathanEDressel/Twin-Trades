import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
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
import { fetchSubscriptionStatus, cancelSubscription } from '@/services/subscription';
import { purchaseProduct, restorePurchases } from '@/services/iap';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { colors, spacing, typography, radius, shadow } from '@/helpers/designTokens';
import { SubscriptionStatus } from '@/models/Subscription';

const MONTHLY_PRODUCT_ID = 'com.twintrades.app.monthly';
const ANNUAL_PRODUCT_ID = 'com.twintrades.app.annual';

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

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const isGood = status === 'active';
  const isGrace = status === 'grace_period';
  const color = isGood ? colors.success : isGrace ? colors.warning : colors.danger;
  const label = status === 'grace_period' ? 'Grace Period' : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '44' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function PlanCard({
  label,
  price,
  sub,
  highlight,
  onPress,
  disabled,
}: {
  label: string;
  price: string;
  sub: string;
  highlight?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.planCard, highlight && styles.planCardHighlight]}
    >
      <View style={styles.planCardLeft}>
        <Text style={styles.planCardLabel}>{label}</Text>
        <Text style={styles.planCardSub}>{sub}</Text>
      </View>
      <View style={styles.planCardRight}>
        <Text style={styles.planCardPrice}>{price}</Text>
        <Text style={styles.planCardCta}>{disabled ? 'Current' : 'Subscribe'}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SubscriptionScreen() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);
  const [appleModal, setAppleModal] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: fetchSubscriptionStatus,
  });

  async function handlePurchase(productId: string) {
    if (Platform.OS !== 'ios') {
      setToast({ message: 'Subscriptions are only available on iOS.', variant: 'error' });
      return;
    }
    setLoading(true);
    try {
      const result = await purchaseProduct(productId);
      if (result) {
        setToast({ message: 'Subscription activated!', variant: 'success' });
        qc.invalidateQueries({ queryKey: ['subscription-status'] });
      }
    } catch {
      setToast({ message: 'Purchase failed. Please try again.', variant: 'error' });
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

  function handleCancelPress() {
    const accessUntil = subscription?.expires_at ? formatDate(subscription.expires_at) : null;
    Alert.alert(
      'Cancel Subscription',
      accessUntil
        ? `You'll keep full access until ${accessUntil}. Cancel anyway?`
        : 'Are you sure you want to cancel your subscription?',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: confirmCancel,
        },
      ],
    );
  }

  async function confirmCancel() {
    setLoading(true);
    try {
      await cancelSubscription();
      qc.invalidateQueries({ queryKey: ['subscription-status'] });
      setAppleModal(true);
    } catch {
      setToast({ message: 'Could not cancel subscription. Please try again.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const isActive = subscription?.status === 'active' || subscription?.status === 'grace_period';
  const isCancelled = subscription?.status === 'cancelled';
  const isExpired = subscription?.status === 'expired';
  const isLifetime = subscription?.plan === 'lifetime';
  const showSubscribeCards = !subscription || isCancelled || isExpired;

  return (
    <SafeAreaView style={styles.safe}>
      {loading && <LoadingOverlay />}

      {/* Apple Cancellation Guidance Modal */}
      <Modal visible={appleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="checkmark-circle" size={40} color={colors.success} style={{ alignSelf: 'center', marginBottom: spacing.sm }} />
            <Text style={styles.modalTitle}>Subscription Cancelled</Text>
            <Text style={styles.modalBody}>
              Your access continues until{' '}
              <Text style={{ fontWeight: '700' }}>{formatDate(subscription?.expires_at ?? null)}</Text>.
            </Text>
            <Text style={[styles.modalBody, { marginTop: spacing.sm }]}>
              To stop future billing, you must also cancel in your Apple Subscription settings.
            </Text>
            <PrimaryButton
              title="Open Apple Subscriptions"
              onPress={() => Linking.openURL('itms-apps://apps.apple.com/account/subscriptions')}
              style={{ marginTop: spacing.md }}
            />
            <PrimaryButton
              title="Done"
              variant="ghost"
              onPress={() => setAppleModal(false)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Subscription" />

        {/* Current Plan Card */}
        {subscription && (
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.planName}>
                  {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
                </Text>
                {isLifetime ? (
                  <Text style={styles.cardMeta}>Never expires</Text>
                ) : isCancelled ? (
                  <Text style={[styles.cardMeta, { color: colors.danger }]}>
                    Access until {formatDate(subscription.expires_at)}
                  </Text>
                ) : subscription.expires_at ? (
                  <Text style={styles.cardMeta}>
                    {subscription.status === 'grace_period' ? 'Billing issue — renews ' : 'Renews '}
                    {formatDate(subscription.expires_at)}
                  </Text>
                ) : null}
              </View>
              <StatusBadge status={subscription.status} />
            </View>

            {subscription.status === 'grace_period' && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning-outline" size={16} color={colors.warning} />
                <Text style={styles.warningText}>
                  There was an issue with your payment. Update your billing info to keep access.
                </Text>
              </View>
            )}

            {subscription.status === 'grace_period' && (
              <PrimaryButton
                title="Update Payment Method"
                onPress={() => Linking.openURL('itms-apps://apps.apple.com/account/subscriptions')}
                style={{ marginTop: spacing.md }}
              />
            )}

            {isActive && !isLifetime && (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelPress}>
                <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* No subscription message */}
        {!subscription && (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: spacing.lg }]}>
            <Ionicons name="star-outline" size={32} color={colors.textMuted} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.planName}>No Active Subscription</Text>
            <Text style={[styles.cardMeta, { textAlign: 'center', marginTop: 4 }]}>
              Subscribe to access portfolios and automatic rebalancing.
            </Text>
          </View>
        )}

        {/* Subscribe / Re-subscribe plan cards */}
        {showSubscribeCards && Platform.OS === 'ios' && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.sectionLabel}>{isCancelled ? 'Re-subscribe' : 'Choose a Plan'}</Text>
            <PlanCard
              label="Monthly"
              price="$15 / mo"
              sub="Billed monthly"
              onPress={() => handlePurchase(MONTHLY_PRODUCT_ID)}
            />
            <PlanCard
              label="Annual"
              price="$150 / yr"
              sub="Save ~17% · Billed annually"
              highlight
              onPress={() => handlePurchase(ANNUAL_PRODUCT_ID)}
            />
            <PrimaryButton
              title="Restore Purchases"
              variant="ghost"
              onPress={handleRestore}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}

        {/* Billing History */}
        <TouchableOpacity
          style={[styles.billingHistoryRow, { marginTop: spacing.md }]}
          onPress={() => router.push('/(app)/settings/billing-history')}
        >
          <Ionicons name="receipt-outline" size={20} color={colors.accent} style={{ marginRight: spacing.sm }} />
          <Text style={styles.billingHistoryText}>Billing History</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
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
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  planName: { ...typography.headline, color: colors.textPrimary },
  cardMeta: { ...typography.caption, color: colors.textMuted, marginTop: 4 },

  badge: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginLeft: spacing.sm,
  },
  badgeText: { ...typography.caption, fontWeight: '600' },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning + '15',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  warningText: { ...typography.caption, color: colors.warning, flex: 1 },

  cancelBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelBtnText: { ...typography.body, color: colors.danger, fontWeight: '600' },

  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
    marginBottom: spacing.sm,
  },

  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  planCardHighlight: {
    borderColor: colors.accent,
  },
  planCardLeft: { flex: 1 },
  planCardLabel: { ...typography.headline, color: colors.textPrimary },
  planCardSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  planCardRight: { alignItems: 'flex-end' },
  planCardPrice: { ...typography.headline, color: colors.textPrimary },
  planCardCta: { ...typography.caption, color: colors.accent, marginTop: 2, fontWeight: '600' },

  billingHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  billingHistoryText: { ...typography.body, color: colors.textPrimary },

  // Apple Guidance Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  modalTitle: { ...typography.headline, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  modalBody: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});

