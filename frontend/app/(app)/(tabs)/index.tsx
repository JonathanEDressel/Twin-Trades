import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPendingRebalances,
  confirmRebalance,
  rejectRebalance,
  fetchMyPortfolios,
} from '@/services/portfolio';
import { PendingRebalance } from '@/models/RebalanceEvent';
import { Portfolio } from '@/models/Portfolio';
import { RebalanceConfirmSheet } from '@/components/portfolio/RebalanceConfirmSheet';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Toast } from '@/components/ui/Toast';
import { colors, spacing, typography } from '@/helpers/designTokens';

export default function DashboardScreen() {
  const qc = useQueryClient();
  const [activeRebalance, setActiveRebalance] = useState<PendingRebalance | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);

  const {
    data: rebalances = [],
    isLoading: loadingRebalances,
    refetch: refetchRebalances,
  } = useQuery({ queryKey: ['pending-rebalances'], queryFn: fetchPendingRebalances });

  const {
    data: portfolios = [],
    isLoading: loadingPortfolios,
    refetch: refetchPortfolios,
  } = useQuery({ queryKey: ['my-portfolios'], queryFn: fetchMyPortfolios });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => confirmRebalance(id),
    onSuccess: () => {
      setActiveRebalance(null);
      setToast({ message: 'Rebalance approved. Trades queued.', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['pending-rebalances'] });
    },
    onError: () => setToast({ message: 'Failed to confirm rebalance.', variant: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => rejectRebalance(id),
    onSuccess: () => {
      setActiveRebalance(null);
      qc.invalidateQueries({ queryKey: ['pending-rebalances'] });
    },
    onError: () => setToast({ message: 'Failed to reject rebalance.', variant: 'error' }),
  });

  const isLoading = loadingRebalances || loadingPortfolios;

  return (
    <SafeAreaView style={styles.safe}>
      {isLoading && <LoadingOverlay />}

      <FlatList
        data={portfolios}
        keyExtractor={(p) => String(p.id)}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => { refetchRebalances(); refetchPortfolios(); }}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Dashboard</Text>

            {rebalances.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Pending Rebalances ({rebalances.length})
                </Text>
                {rebalances.map((r) => (
                  <View key={r.id} style={styles.rebalanceRow}>
                    <Text style={styles.rebalanceText}>Portfolio #{r.portfolio_id}</Text>
                    <Text
                      style={styles.reviewLink}
                      onPress={() => setActiveRebalance(r)}
                    >
                      Review
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>
              Your Portfolios
            </Text>
          </View>
        }
        renderItem={({ item }: { item: Portfolio }) => (
          <PortfolioCard portfolio={item} isFollowing />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.empty}>You haven't joined any portfolios yet.</Text>
          ) : null
        }
        contentContainerStyle={styles.list}
      />

      <RebalanceConfirmSheet
        rebalance={activeRebalance}
        visible={activeRebalance !== null}
        onConfirm={(id) => confirmMutation.mutateAsync(id)}
        onReject={(id) => rejectMutation.mutateAsync(id)}
        onDismiss={() => setActiveRebalance(null)}
      />

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  list: { padding: spacing.md },
  header: { marginBottom: spacing.md },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  sectionTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.sm },
  rebalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  rebalanceText: { ...typography.body, color: colors.textPrimary },
  reviewLink: { ...typography.body, color: colors.accent },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
