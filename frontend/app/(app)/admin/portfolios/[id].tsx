import React, { useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminFetchPortfolio,
  adminUpdatePortfolio,
  adminUpdateHoldings,
  adminTogglePortfolio,
  adminDeletePortfolio,
} from '@/services/admin';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Toast } from '@/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/helpers/designTokens';
import { formatCurrency, formatPercent, formatDate, formatRelativeDate } from '@/helpers/formatters';

const RETURN_KEYS = [
  { key: 'return_1w' as const, label: '1W' },
  { key: 'return_1m' as const, label: '1M' },
  { key: 'return_3m' as const, label: '3M' },
  { key: 'return_6m' as const, label: '6M' },
  { key: 'return_1y' as const, label: '1Y' },
  { key: 'return_3y' as const, label: '3Y' },
];

const CHANGE_COLORS: Record<string, string> = {
  added: colors.success,
  removed: colors.danger,
  changed: colors.warning,
};

function ReturnCell({ label, value }: { label: string; value: string | null }) {
  const num = value != null ? parseFloat(value) : null;
  return (
    <View style={returnStyles.cell}>
      <Text style={returnStyles.label}>{label}</Text>
      {num != null ? (
        <Text style={[returnStyles.value, { color: num >= 0 ? colors.success : colors.danger }]}>
          {formatPercent(value!)}
        </Text>
      ) : (
        <Text style={returnStyles.noData}>—</Text>
      )}
    </View>
  );
}

const returnStyles = StyleSheet.create({
  cell: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  value: { fontSize: 13, fontWeight: '700' as const },
  noData: { fontSize: 13, color: colors.textMuted },
});

export default function AdminPortfolioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const portfolioId = parseInt(id, 10);
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);

  // Edit metadata modal
  const [showEditMeta, setShowEditMeta] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftIconUrl, setDraftIconUrl] = useState('');

  // Edit holdings modal
  const [showEditHoldings, setShowEditHoldings] = useState(false);
  const [draftHoldings, setDraftHoldings] = useState<{ ticker: string; target_pct: string }[]>([]);

  const { data: portfolio, isLoading, refetch } = useQuery({
    queryKey: ['admin-portfolio', portfolioId],
    queryFn: () => adminFetchPortfolio(portfolioId),
  });

  const updateMeta = useMutation({
    mutationFn: () =>
      adminUpdatePortfolio(portfolioId, {
        name: draftName.trim() || undefined,
        description: draftDescription.trim() || undefined,
        icon_url: draftIconUrl.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-portfolio', portfolioId] });
      qc.invalidateQueries({ queryKey: ['admin-portfolios'] });
      setShowEditMeta(false);
      setToast({ message: 'Portfolio updated', variant: 'success' });
    },
    onError: () => setToast({ message: 'Failed to update portfolio', variant: 'error' }),
  });

  const toggleMutation = useMutation({
    mutationFn: () => adminTogglePortfolio(portfolioId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-portfolio', portfolioId] });
      qc.invalidateQueries({ queryKey: ['admin-portfolios'] });
    },
    onError: () => setToast({ message: 'Failed to toggle portfolio', variant: 'error' }),
  });

  const updateHoldingsMutation = useMutation({
    mutationFn: () => adminUpdateHoldings(portfolioId, { holdings: draftHoldings }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-portfolio', portfolioId] });
      qc.invalidateQueries({ queryKey: ['admin-portfolios'] });
      setShowEditHoldings(false);
      setToast({ message: 'Holdings updated', variant: 'success' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? 'Failed to update holdings';
      setToast({ message: String(msg), variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminDeletePortfolio(portfolioId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-portfolios'] });
      router.back();
    },
    onError: () => setToast({ message: 'Failed to delete portfolio', variant: 'error' }),
  });

  function openEditMeta() {
    if (!portfolio) return;
    setDraftName(portfolio.name);
    setDraftDescription(portfolio.description ?? '');
    setDraftIconUrl(portfolio.icon_url ?? '');
    setShowEditMeta(true);
  }

  function openEditHoldings() {
    if (!portfolio) return;
    setDraftHoldings(
      portfolio.holdings.length > 0
        ? portfolio.holdings.map((h) => ({ ticker: h.ticker, target_pct: String(h.target_pct) }))
        : [{ ticker: '', target_pct: '' }],
    );
    setShowEditHoldings(true);
  }

  function holdingTotal() {
    return draftHoldings.reduce((sum, h) => {
      const v = parseFloat(h.target_pct);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
  }

  function saveHoldings() {
    const valid = draftHoldings.every(
      (h) => h.ticker.trim().length > 0 && parseFloat(h.target_pct) > 0,
    );
    if (!valid) {
      setToast({ message: 'Every holding needs a ticker and a positive allocation', variant: 'error' });
      return;
    }
    const total = holdingTotal();
    if (Math.abs(total - 100) > 0.01) {
      setToast({
        message: `Allocations must sum to 100% (currently ${total.toFixed(2)}%)`,
        variant: 'error',
      });
      return;
    }
    updateHoldingsMutation.mutate();
  }

  function confirmDelete() {
    if (!portfolio) return;
    Alert.alert(
      'Delete Portfolio',
      `Permanently delete "${portfolio.name}"? This will remove all ${portfolio.user_count} user(s) and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    );
  }

  const isBusy =
    isLoading ||
    updateMeta.isPending ||
    toggleMutation.isPending ||
    updateHoldingsMutation.isPending ||
    deleteMutation.isPending;

  if (!portfolio && !isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Portfolio</Text>
          <View style={{ width: 48 }} />
        </View>
        <Text style={styles.errorText}>Portfolio not found.</Text>
      </SafeAreaView>
    );
  }

  const totalPct = holdingTotal();

  return (
    <SafeAreaView style={styles.safe}>
      {isBusy && <LoadingOverlay />}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} visible onHide={() => setToast(null)} />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {portfolio?.name ?? '…'}
        </Text>
        <TouchableOpacity onPress={openEditMeta} disabled={!portfolio} style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
        }
      >
        {portfolio ? (
          <>
            {/* Status & description */}
            <View style={styles.section}>
              <View style={styles.row}>
                <Text style={styles.sectionTitle}>Status</Text>
                <TouchableOpacity
                  style={[
                    styles.statusBadge,
                    {
                      borderColor: portfolio.is_active ? colors.success : colors.textMuted,
                      backgroundColor:
                        (portfolio.is_active ? colors.success : colors.textMuted) + '22',
                    },
                  ]}
                  onPress={() => toggleMutation.mutate()}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: portfolio.is_active ? colors.success : colors.textMuted },
                    ]}
                  >
                    {portfolio.is_active ? '● Active' : '○ Inactive'}
                  </Text>
                  <Text style={styles.statusToggleHint}> — tap to toggle</Text>
                </TouchableOpacity>
              </View>
              {portfolio.description ? (
                <Text style={styles.descriptionText}>{portfolio.description}</Text>
              ) : (
                <Text style={styles.noDataText}>No description set.</Text>
              )}
            </View>

            {/* Overview stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Users Following</Text>
                  <Text style={styles.statValue}>{portfolio.user_count}</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Total Invested</Text>
                  <Text style={styles.statValue}>{formatCurrency(portfolio.total_invested)}</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Created</Text>
                  <Text style={styles.statValue}>{formatDate(portfolio.created_at)}</Text>
                </View>
              </View>
            </View>

            {/* Returns */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Returns</Text>
              <View style={styles.returnsGrid}>
                {RETURN_KEYS.map(({ key, label }) => (
                  <ReturnCell key={key} label={label} value={(portfolio as any)[key]} />
                ))}
              </View>
            </View>

            {/* Holdings */}
            <View style={styles.section}>
              <View style={styles.row}>
                <Text style={styles.sectionTitle}>
                  Holdings ({portfolio.holdings.length})
                </Text>
                <TouchableOpacity onPress={openEditHoldings} style={styles.sectionAction}>
                  <Text style={styles.sectionActionText}>Edit Holdings</Text>
                </TouchableOpacity>
              </View>
              {portfolio.holdings.length === 0 ? (
                <Text style={styles.noDataText}>
                  No holdings set. Tap Edit Holdings to add tickers.
                </Text>
              ) : (
                portfolio.holdings.map((h) => (
                  <View key={h.id} style={styles.holdingRow}>
                    <Text style={styles.holdingTicker}>{h.ticker}</Text>
                    <View style={styles.holdingBar}>
                      <View
                        style={[
                          styles.holdingBarFill,
                          { width: `${Math.min(parseFloat(String(h.target_pct)), 100)}%` as any },
                        ]}
                      />
                    </View>
                    <Text style={styles.holdingPct}>{h.target_pct}%</Text>
                  </View>
                ))
              )}
            </View>

            {/* Holding History */}
            {portfolio.holding_history.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Holding History</Text>
                {portfolio.holding_history.map((h) => (
                  <View key={h.id} style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <View
                        style={[
                          styles.changeTypePill,
                          {
                            backgroundColor: CHANGE_COLORS[h.change_type] + '22',
                            borderColor: CHANGE_COLORS[h.change_type],
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.changeTypeText,
                            { color: CHANGE_COLORS[h.change_type] },
                          ]}
                        >
                          {h.change_type}
                        </Text>
                      </View>
                      <Text style={styles.historyTicker}>{h.ticker}</Text>
                    </View>
                    <View style={styles.historyRight}>
                      {h.change_type === 'changed' && h.old_target_pct != null ? (
                        <Text style={styles.historyPct}>
                          {h.old_target_pct}% → {h.target_pct}%
                        </Text>
                      ) : (
                        <Text style={styles.historyPct}>{h.target_pct}%</Text>
                      )}
                      <Text style={styles.historyDate}>{formatRelativeDate(h.changed_at)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Danger Zone */}
            <View style={[styles.section, styles.dangerSection]}>
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>Danger Zone</Text>
              <Text style={styles.dangerHint}>
                Deleting this portfolio removes all users from it and cannot be undone.
              </Text>
              <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
                <Text style={styles.deleteBtnText}>Delete Portfolio</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Edit Metadata Modal */}
      <Modal visible={showEditMeta} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Edit Portfolio</Text>

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Portfolio name"
                placeholderTextColor={colors.textMuted}
                maxLength={200}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={draftDescription}
                onChangeText={setDraftDescription}
                placeholder="Optional description"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Icon URL</Text>
              <TextInput
                style={styles.input}
                value={draftIconUrl}
                onChangeText={setDraftIconUrl}
                placeholder="https://…"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="url"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowEditMeta(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, { opacity: draftName.trim() ? 1 : 0.45 }]}
                  onPress={() => { if (draftName.trim()) updateMeta.mutate(); }}
                  disabled={!draftName.trim() || updateMeta.isPending}
                >
                  <Text style={styles.confirmText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Holdings Modal */}
      <Modal visible={showEditHoldings} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.row}>
              <Text style={styles.modalTitle}>Edit Holdings</Text>
              <Text
                style={[
                  styles.totalPctLabel,
                  {
                    color:
                      Math.abs(totalPct - 100) < 0.01 ? colors.success : colors.danger,
                  },
                ]}
              >
                {totalPct.toFixed(2)}% / 100%
              </Text>
            </View>
            <Text style={styles.holdingsHint}>
              All allocations must sum to exactly 100%.
            </Text>

            <ScrollView
              style={styles.holdingsScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {draftHoldings.map((h, idx) => (
                <View key={idx} style={styles.holdingEditRow}>
                  <TextInput
                    style={styles.tickerInput}
                    value={h.ticker}
                    onChangeText={(v) =>
                      setDraftHoldings((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, ticker: v.toUpperCase() } : x)),
                      )
                    }
                    placeholder="AAPL"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    maxLength={10}
                  />
                  <TextInput
                    style={styles.pctInput}
                    value={h.target_pct}
                    onChangeText={(v) =>
                      setDraftHoldings((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, target_pct: v } : x)),
                      )
                    }
                    placeholder="25.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    maxLength={6}
                  />
                  <Text style={styles.pctSymbol}>%</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setDraftHoldings((prev) => prev.filter((_, i) => i !== idx))
                    }
                    hitSlop={8}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addHoldingBtn}
                onPress={() =>
                  setDraftHoldings((prev) => [...prev, { ticker: '', target_pct: '' }])
                }
              >
                <Text style={styles.addHoldingText}>+ Add Holding</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEditHoldings(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={saveHoldings}
                disabled={updateHoldingsMutation.isPending}
              >
                <Text style={styles.confirmText}>Save Holdings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: { ...typography.body, color: colors.accent },
  headerTitle: { ...typography.headline, color: colors.textPrimary, flex: 1, textAlign: 'center' as const },
  editBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  editBtnText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' as const },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  errorText: { ...typography.body, color: colors.textMuted, textAlign: 'center' as const, marginTop: spacing.xl },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  statusBadgeText: { ...typography.caption, fontWeight: '700' as const },
  statusToggleHint: { ...typography.caption, color: colors.textMuted },
  descriptionText: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  noDataText: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic' as const },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCell: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  statLabel: { ...typography.caption, color: colors.textMuted },
  statValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' as const, marginTop: 2 },
  returnsGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: spacing.xs },
  sectionAction: {
    backgroundColor: colors.accent + '22',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  sectionActionText: { ...typography.caption, color: colors.accent, fontWeight: '600' as const },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holdingTicker: { ...typography.body, color: colors.textPrimary, fontWeight: '700' as const, width: 60 },
  holdingBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  holdingBarFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  holdingPct: { ...typography.body, color: colors.textMuted, width: 52, textAlign: 'right' as const },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  changeTypePill: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  changeTypeText: { ...typography.caption, fontWeight: '600' as const },
  historyTicker: { ...typography.body, color: colors.textPrimary, fontWeight: '600' as const },
  historyRight: { alignItems: 'flex-end' as const },
  historyPct: { ...typography.caption, color: colors.textPrimary },
  historyDate: { ...typography.caption, color: colors.textMuted },
  dangerSection: { borderColor: colors.danger + '44' },
  dangerHint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  deleteBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center' as const,
  },
  deleteBtnText: { ...typography.body, color: colors.danger, fontWeight: '600' as const },
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' as const },
  modalScroll: { justifyContent: 'flex-end' as const, flexGrow: 1 },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '88%',
  },
  modalTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.sm },
  totalPctLabel: { ...typography.body, fontWeight: '700' as const },
  holdingsHint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  holdingsScroll: { maxHeight: 320 },
  holdingEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tickerInput: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    padding: spacing.sm,
    ...typography.body,
    fontWeight: '700' as const,
  },
  pctInput: {
    flex: 1.5,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    padding: spacing.sm,
    ...typography.body,
    textAlign: 'right' as const,
  },
  pctSymbol: { ...typography.body, color: colors.textMuted },
  removeBtn: { padding: spacing.xs },
  removeText: { ...typography.body, color: colors.danger },
  addHoldingBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    borderStyle: 'dashed' as const,
    padding: spacing.sm,
    alignItems: 'center' as const,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  addHoldingText: { ...typography.body, color: colors.accent },
  label: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    padding: spacing.sm,
    ...typography.body,
    marginBottom: spacing.sm,
  },
  multiline: { height: 80, textAlignVertical: 'top' as const },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center' as const,
  },
  cancelText: { ...typography.body, color: colors.textMuted },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center' as const,
  },
  confirmText: { ...typography.body, color: '#fff', fontWeight: '600' as const },
});
