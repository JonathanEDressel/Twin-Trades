import React, { useState } from 'react';
import {
  Alert,
  FlatList,
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
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminFetchPortfolios,
  adminCreatePortfolio,
  adminTogglePortfolio,
  adminDeletePortfolio,
} from '@/services/admin';
import { AdminPortfolio } from '@/models/Portfolio';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Toast } from '@/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/helpers/designTokens';
import { formatCurrency, formatPercent } from '@/helpers/formatters';

const PAGE_SIZE = 20;

export default function AdminPortfoliosScreen() {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftIconUrl, setDraftIconUrl] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: ['admin-portfolios'],
      queryFn: ({ pageParam = 1 }) => adminFetchPortfolios(pageParam as number, PAGE_SIZE),
      initialPageParam: 1,
      getNextPageParam: (last, all) =>
        last.portfolios.length === PAGE_SIZE ? all.length + 1 : undefined,
    });

  const portfolios = data?.pages.flatMap((p) => p.portfolios) ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      adminCreatePortfolio({
        name: draftName.trim(),
        description: draftDescription.trim() || undefined,
        icon_url: draftIconUrl.trim() || undefined,
      }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['admin-portfolios'] });
      setShowCreate(false);
      resetDraft();
      router.push(`/(app)/admin/portfolios/${created.id}` as any);
    },
    onError: () => setToast({ message: 'Failed to create portfolio', variant: 'error' }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminTogglePortfolio(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-portfolios'] }),
    onError: () => setToast({ message: 'Failed to update portfolio', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminDeletePortfolio(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-portfolios'] });
      setToast({ message: 'Portfolio deleted', variant: 'success' });
    },
    onError: () => setToast({ message: 'Failed to delete portfolio', variant: 'error' }),
  });

  function resetDraft() {
    setDraftName('');
    setDraftDescription('');
    setDraftIconUrl('');
  }

  function confirmDelete(p: AdminPortfolio) {
    Alert.alert(
      'Delete Portfolio',
      `Delete "${p.name}"? This will remove all ${p.user_count} user(s) and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(p.id) },
      ],
    );
  }

  function renderItem({ item: p }: { item: AdminPortfolio }) {
    const topHoldings = p.holdings
      .slice(0, 4)
      .map((h) => `${h.ticker} ${h.target_pct}%`)
      .join(' · ');
    const moreCount = p.holdings.length > 4 ? p.holdings.length - 4 : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/admin/portfolios/${p.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.portfolioName} numberOfLines={1}>
              {p.name}
            </Text>
            <View
              style={[
                styles.badge,
                {
                  borderColor: p.is_active ? colors.success : colors.textMuted,
                  backgroundColor: (p.is_active ? colors.success : colors.textMuted) + '22',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: p.is_active ? colors.success : colors.textMuted },
                ]}
              >
                {p.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {p.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {p.description}
            </Text>
          ) : null}

          {topHoldings ? (
            <Text style={styles.holdingsSummary} numberOfLines={1}>
              {topHoldings}
              {moreCount > 0 ? ` +${moreCount} more` : ''}
            </Text>
          ) : (
            <Text style={styles.noHoldings}>No holdings set</Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Users</Text>
            <Text style={styles.statValue}>{p.user_count}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Invested</Text>
            <Text style={styles.statValue}>{formatCurrency(p.total_invested)}</Text>
          </View>
          {p.return_1m != null ? (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>1M Return</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: parseFloat(p.return_1m) >= 0 ? colors.success : colors.danger },
                ]}
              >
                {formatPercent(p.return_1m)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => toggleMutation.mutate(p.id)}
          >
            <Text
              style={[
                styles.actionText,
                { color: p.is_active ? colors.warning : colors.success },
              ]}
            >
              {p.is_active ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete(p)}>
            <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  const isBusy =
    isLoading ||
    createMutation.isPending ||
    toggleMutation.isPending ||
    deleteMutation.isPending;

  return (
    <SafeAreaView style={styles.safe}>
      {isBusy && <LoadingOverlay />}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} visible onHide={() => setToast(null)} />
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Portfolios</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.newBtn}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={portfolios}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.accent} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>No portfolios yet. Tap + New to create one.</Text>
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <Text style={styles.loadingMore}>Loading more…</Text>
          ) : null
        }
      />

      {/* Create Portfolio Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>New Portfolio</Text>

              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="e.g. Tech Growth"
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
                  onPress={() => {
                    setShowCreate(false);
                    resetDraft();
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, { opacity: draftName.trim() ? 1 : 0.45 }]}
                  onPress={() => {
                    if (draftName.trim()) createMutation.mutate();
                  }}
                  disabled={!draftName.trim() || createMutation.isPending}
                >
                  <Text style={styles.confirmText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  title: { ...typography.headline, color: colors.textPrimary },
  newBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  newBtnText: { ...typography.caption, color: '#fff', fontWeight: '600' as const },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTop: { marginBottom: spacing.sm },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  portfolioName: { ...typography.headline, color: colors.textPrimary, flex: 1 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  badgeText: { ...typography.caption, fontWeight: '600' as const },
  description: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  holdingsSummary: { ...typography.caption, color: colors.accent },
  noHoldings: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic' as const },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  stat: { flex: 1 },
  statLabel: { ...typography.caption, color: colors.textMuted },
  statValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' as const },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  actionBtn: { flex: 1, alignItems: 'center' as const, padding: spacing.xs },
  actionText: { ...typography.caption, fontWeight: '600' as const },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center' as const,
    marginTop: spacing.xl,
  },
  loadingMore: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center' as const,
    padding: spacing.md,
  },
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' as const },
  modalScroll: { justifyContent: 'flex-end' as const, flexGrow: 1 },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.md },
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
