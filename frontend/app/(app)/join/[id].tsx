import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { fetchPortfolioDetail, joinPortfolio } from '@/services/portfolio';
import { fetchSubscriptionStatus } from '@/services/subscription';
import { fetchBrokerageConnections, fetchAvailableBrokerages, initiateOAuth } from '@/services/brokerage';
import { fetchProducts, purchaseProduct, restorePurchases } from '@/services/iap';
import { setPendingJoin } from '@/services/joinContext';
import { useAuthStore } from '@/stores/authStore';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { colors, radius, shadow, spacing, typography } from '@/helpers/designTokens';
import { BrokerageConnection } from '@/models/Brokerage';
import { PortfolioHolding } from '@/models/Portfolio';

type Step = 'subscription' | 'brokerage' | 'invest' | 'loading' | 'success' | 'failure';

const BROKERAGE_LABELS: Record<string, string> = {
  alpaca: 'Alpaca',
  schwab: 'Charles Schwab',
  webull: 'Webull',
};

const MIN_INVESTMENT = 100;

export default function JoinFlowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const portfolioId = Number(id);
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>('subscription');
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [failureMessage, setFailureMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);
  const [connectingSlug, setConnectingSlug] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const hasAutoStepped = useRef(false);

  const { data: portfolio, isLoading: loadingPortfolio } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => fetchPortfolioDetail(portfolioId),
    enabled: !!portfolioId,
  });

  const { data: subscription, isLoading: loadingSub } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: fetchSubscriptionStatus,
  });

  const { data: brokerages = [], refetch: refetchBrokerages } = useQuery({
    queryKey: ['brokerage-connections'],
    queryFn: fetchBrokerageConnections,
  });

  const { data: availableSlugs = [] } = useQuery({
    queryKey: ['brokerage-available'],
    queryFn: fetchAvailableBrokerages,
  });

  const { data: iapProducts = [] } = useQuery({
    queryKey: ['iap-products'],
    queryFn: fetchProducts,
    enabled: Platform.OS === 'ios',
  });

  // Auto-advance past subscription step if already subscribed or exempt.
  useEffect(() => {
    if (loadingSub || hasAutoStepped.current) return;
    const isSubscribed =
      user?.subscription_exempt ||
      subscription?.status === 'active' ||
      subscription?.status === 'grace_period';
    if (isSubscribed) {
      hasAutoStepped.current = true;
      setStep('brokerage');
    }
  }, [subscription, loadingSub, user]);

  // After returning from OAuth, the brokerage connections list will refresh.
  // If a new connection appeared, auto-select it.
  useEffect(() => {
    if (step !== 'brokerage' || brokerages.length === 0) return;
    if (selectedConnectionId == null) {
      setSelectedConnectionId(brokerages[0].id);
    }
  }, [brokerages, step]);

  const joinMutation = useMutation({
    mutationFn: () => {
      const amount = parseFloat(investAmount);
      return joinPortfolio({
        portfolio_id: portfolioId,
        brokerage_connection_id: selectedConnectionId ?? undefined,
        investment_amount: selectedConnectionId ? amount : undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-portfolios'] });
      qc.invalidateQueries({ queryKey: ['marketplace'] });
      setStep('success');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ?? 'Something went wrong placing your trades. Please try again.';
      setFailureMessage(msg);
      setStep('failure');
    },
  });

  // ── Subscription step ──────────────────────────────────────────────────────

  async function handlePurchase(productId: string) {
    setPurchasing(true);
    try {
      const result = await purchaseProduct(productId);
      if (result) {
        qc.invalidateQueries({ queryKey: ['subscription-status'] });
        setStep('brokerage');
      }
    } catch {
      setToast({ message: 'Purchase failed. Please try again.', variant: 'error' });
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setPurchasing(true);
    try {
      await restorePurchases();
      qc.invalidateQueries({ queryKey: ['subscription-status'] });
      setToast({ message: 'Purchases restored.', variant: 'success' });
      // Small delay so the subscription query can refetch before we check.
      setTimeout(() => setStep('brokerage'), 800);
    } catch {
      setToast({ message: 'Could not restore purchases.', variant: 'error' });
    } finally {
      setPurchasing(false);
    }
  }

  // ── Brokerage step ─────────────────────────────────────────────────────────

  async function handleConnectBrokerage(slug: string) {
    setConnectingSlug(slug);
    try {
      const { auth_url } = await initiateOAuth(slug);
      setPendingJoin(portfolioId);
      await Linking.openURL(auth_url);
    } catch {
      setToast({ message: 'Failed to initiate brokerage connection.', variant: 'error' });
    } finally {
      setConnectingSlug(null);
    }
  }

  // ── Invest step ────────────────────────────────────────────────────────────

  const parsedAmount = parseFloat(investAmount) || 0;
  const amountValid = parsedAmount >= MIN_INVESTMENT;

  function getAllocation(holding: PortfolioHolding): string {
    const pct = parseFloat(holding.target_pct);
    const dollars = (parsedAmount * pct) / 100;
    return dollars.toFixed(2);
  }

  // ── Loading step ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (step === 'loading') {
      joinMutation.mutate();
    }
  }, [step]);

  // ── Render helpers ─────────────────────────────────────────────────────────

  if (loadingPortfolio || !portfolio) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  // ── STEP: subscription ─────────────────────────────────────────────────────

  if (step === 'subscription') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.stepTitle}>Subscribe to Continue</Text>
          <Text style={styles.stepSubtitle}>
            An active subscription is required to clone a portfolio's holdings.
          </Text>

          {Platform.OS !== 'ios' ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>
                Subscriptions are available on iOS only via the App Store.
              </Text>
            </View>
          ) : iapProducts.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>Loading available plans…</Text>
              <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.sm }} />
            </View>
          ) : (
            iapProducts.map((product: any) => (
              <TouchableOpacity
                key={product.productId}
                style={styles.planCard}
                onPress={() => handlePurchase(product.productId)}
                disabled={purchasing}
              >
                <View>
                  <Text style={styles.planName}>{product.title}</Text>
                  <Text style={styles.planPrice}>{product.localizedPrice ?? product.price}</Text>
                </View>
                <Text style={styles.planArrow}>→</Text>
              </TouchableOpacity>
            ))
          )}

          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={purchasing}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>
          )}

          {purchasing && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.md }} />}
        </ScrollView>

        {toast && (
          <Toast message={toast.message} variant={toast.variant} visible onHide={() => setToast(null)} />
        )}
      </SafeAreaView>
    );
  }

  // ── STEP: brokerage ────────────────────────────────────────────────────────

  if (step === 'brokerage') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.stepTitle}>Connect a Brokerage</Text>
          <Text style={styles.stepSubtitle}>
            Select an existing connection or link a new brokerage account. A $
            {MIN_INVESTMENT} minimum investment applies per portfolio.
          </Text>

          {brokerages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Your Connections</Text>
              {brokerages.map((conn: BrokerageConnection) => {
                const isSelected = selectedConnectionId === conn.id;
                return (
                  <TouchableOpacity
                    key={conn.id}
                    style={[styles.connRow, isSelected && styles.connRowSelected]}
                    onPress={() => setSelectedConnectionId(conn.id)}
                  >
                    <View>
                      <Text style={styles.connSlug}>
                        {BROKERAGE_LABELS[conn.brokerage_slug] ?? conn.brokerage_slug}
                      </Text>
                      {conn.account_id && (
                        <Text style={styles.connAccount}>Account: {conn.account_id}</Text>
                      )}
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Connect New Brokerage</Text>
            {availableSlugs
              .filter((slug) => !brokerages.some((c: BrokerageConnection) => c.brokerage_slug === slug))
              .map((slug) => (
                <PrimaryButton
                  key={slug}
                  title={
                    connectingSlug === slug
                      ? `Connecting to ${BROKERAGE_LABELS[slug] ?? slug}…`
                      : `Connect ${BROKERAGE_LABELS[slug] ?? slug}`
                  }
                  variant="ghost"
                  loading={connectingSlug === slug}
                  onPress={() => handleConnectBrokerage(slug)}
                  style={styles.brokerageBtn}
                />
              ))}
          </View>

          <PrimaryButton
            title="Continue"
            disabled={selectedConnectionId === null}
            onPress={() => setStep('invest')}
            style={styles.actionBtn}
          />
        </ScrollView>

        {toast && (
          <Toast message={toast.message} variant={toast.variant} visible onHide={() => setToast(null)} />
        )}
      </SafeAreaView>
    );
  }

  // ── STEP: invest ───────────────────────────────────────────────────────────

  if (step === 'invest') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity onPress={() => setStep('brokerage')} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.stepTitle}>Investment Amount</Text>
            <Text style={styles.stepSubtitle}>
              Minimum ${MIN_INVESTMENT}. Funds are split across holdings based on their target
              allocations.
            </Text>

            <View style={styles.inputRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="decimal-pad"
                placeholder="100.00"
                placeholderTextColor={colors.textMuted}
                value={investAmount}
                onChangeText={setInvestAmount}
                returnKeyType="done"
              />
            </View>
            {investAmount !== '' && !amountValid && (
              <Text style={styles.validationError}>
                Minimum investment is ${MIN_INVESTMENT}.
              </Text>
            )}

            {/* Allocation table */}
            {portfolio.holdings.length > 0 && (
              <View style={styles.allocationTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableCellTicker, styles.tableHeaderText]}>
                    Ticker
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellPct, styles.tableHeaderText]}>
                    Allocation
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellAmt, styles.tableHeaderText]}>
                    Est. Amount
                  </Text>
                </View>
                {portfolio.holdings.map((h: PortfolioHolding) => (
                  <View key={h.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.tableCellTicker, styles.tickerText]}>
                      {h.ticker}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellPct, styles.pctText]}>
                      {parseFloat(h.target_pct).toFixed(1)}%
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellAmt, styles.amtText]}>
                      ${getAllocation(h)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <PrimaryButton
              title="Confirm Trades"
              disabled={!amountValid}
              onPress={() => setStep('loading')}
              style={styles.actionBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>

        {toast && (
          <Toast message={toast.message} variant={toast.variant} visible onHide={() => setToast(null)} />
        )}
      </SafeAreaView>
    );
  }

  // ── STEP: loading ──────────────────────────────────────────────────────────

  if (step === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centeredFull}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Placing your trades…</Text>
          <Text style={styles.loadingSubtext}>This may take a moment.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── STEP: success ──────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={[styles.container, styles.centeredContent]}>
          {/* Portfolio icon / avatar */}
          <View style={[styles.portfolioAvatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.portfolioAvatarLetter}>
              {portfolio.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.successTitle}>{portfolio.name}</Text>
          <Text style={styles.successSubtitle}>
            Your trades have been queued and will execute shortly.
          </Text>

          {/* Holdings summary */}
          <View style={styles.holdingsSummary}>
            {portfolio.holdings.map((h: PortfolioHolding) => (
              <View key={h.id} style={styles.holdingRow}>
                <Text style={styles.holdingTicker}>{h.ticker}</Text>
                <Text style={styles.holdingPct}>{parseFloat(h.target_pct).toFixed(1)}%</Text>
              </View>
            ))}
          </View>

          <PrimaryButton
            title="Continue"
            onPress={() => router.replace('/(app)/(tabs)/marketplace')}
            style={styles.actionBtn}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── STEP: failure ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centeredFull}>
        <Text style={styles.failureIcon}>✕</Text>
        <Text style={styles.failureTitle}>Something went wrong</Text>
        <Text style={styles.failureMessage}>{failureMessage}</Text>

        <PrimaryButton
          title="Try Again"
          onPress={() => setStep('brokerage')}
          style={styles.actionBtn}
        />
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackLink}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} visible onHide={() => setToast(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  centeredContent: { alignItems: 'center' },

  backBtn: { marginBottom: spacing.md },
  backText: { ...typography.body, color: colors.accent },

  stepTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardText: { ...typography.body, color: colors.textMuted },

  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.card,
  },
  planName: { ...typography.headline, color: colors.textPrimary },
  planPrice: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  planArrow: { ...typography.headline, color: colors.accent },

  restoreBtn: { alignItems: 'center', paddingVertical: spacing.md },
  restoreText: { ...typography.body, color: colors.accent },

  section: { marginBottom: spacing.lg },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },

  connRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connRowSelected: { borderColor: colors.accent },
  connSlug: { ...typography.headline, color: colors.textPrimary },
  connAccount: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  checkmark: { ...typography.headline, color: colors.accent },

  brokerageBtn: { marginBottom: spacing.sm },
  actionBtn: { marginTop: spacing.lg },

  // Invest step
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  currencySymbol: { ...typography.headline, color: colors.textPrimary, marginRight: spacing.xs },
  amountInput: {
    flex: 1,
    ...typography.headline,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  validationError: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },

  allocationTable: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: { flex: 1 },
  tableCellTicker: { flex: 2 },
  tableCellPct: { flex: 1.5, textAlign: 'center' },
  tableCellAmt: { flex: 2, textAlign: 'right' },
  tickerText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  pctText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  amtText: { ...typography.body, color: colors.accent, textAlign: 'right' },

  // Loading step
  centeredFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: { ...typography.headline, color: colors.textPrimary },
  loadingSubtext: { ...typography.body, color: colors.textMuted },

  // Success step
  portfolioAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  portfolioAvatarLetter: { fontSize: 36, fontWeight: '700', color: '#fff' },
  successTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  successSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  holdingsSummary: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  holdingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holdingTicker: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  holdingPct: { ...typography.body, color: colors.accent },

  // Failure step
  failureIcon: { fontSize: 48, color: colors.danger, marginBottom: spacing.sm },
  failureTitle: { ...typography.headline, color: colors.textPrimary },
  failureMessage: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginVertical: spacing.sm,
  },
  goBackLink: { marginTop: spacing.md, padding: spacing.sm },
  goBackText: { ...typography.body, color: colors.textMuted },
});
