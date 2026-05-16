import React, { useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, typography, radius, shadow } from '@/helpers/designTokens';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatReturn(val: string | null): { label: string; color: string } {
  if (val === null) return { label: '—', color: colors.textMuted };
  const num = parseFloat(val);
  const sign = num >= 0 ? '+' : '';
  return {
    label: `${sign}${num.toFixed(2)}%`,
    color: num >= 0 ? colors.success : colors.danger,
  };
}

function DashboardPortfolioCard({
  portfolio,
  onPress,
}: {
  portfolio: Portfolio;
  onPress: () => void;
}) {
  const ret = formatReturn(portfolio.total_return_pct);
  const initials = portfolio.name.charAt(0).toUpperCase();

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.85}>
      {portfolio.icon_url ? (
        <Image source={{ uri: portfolio.icon_url }} style={cardStyles.icon} />
      ) : (
        <View style={cardStyles.iconFallback}>
          <Text style={cardStyles.iconText}>{initials}</Text>
        </View>
      )}
      <View style={cardStyles.info}>
        <Text style={cardStyles.name} numberOfLines={1}>{portfolio.name}</Text>
        <Text style={cardStyles.sub}>{portfolio.holdings.length} holdings</Text>
      </View>
      <Text style={[cardStyles.return, { color: ret.color }]}>{ret.label}</Text>
    </TouchableOpacity>
  );
}

function ExploreBar() {
  return (
    <TouchableOpacity
      style={exploreStyles.bar}
      onPress={() => router.push('/(app)/(tabs)/marketplace')}
      activeOpacity={0.8}
    >
      <Ionicons name="search-outline" size={18} color={colors.textMuted} />
      <Text style={exploreStyles.text}>Explore portfolios</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
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
  const firstName = (user?.display_name ?? user?.username ?? '').split(' ')[0];

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
            <Text style={styles.greeting}>{getGreeting()}{firstName ? `, ${firstName}` : ''}</Text>

            {rebalances.length > 0 && (
              <View style={styles.rebalanceBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
                <View style={{ flex: 1, marginLeft: spacing.xs }}>
                  {rebalances.map((r) => (
                    <TouchableOpacity key={r.id} onPress={() => setActiveRebalance(r)}>
                      <Text style={styles.rebalanceText}>
                        Portfolio #{r.portfolio_id} needs review{' '}
                        <Text style={styles.reviewLink}>→ Review</Text>
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.sectionLabel}>Your Portfolios</Text>
          </View>
        }
        renderItem={({ item }: { item: Portfolio }) => (
          <DashboardPortfolioCard
            portfolio={item}
            onPress={() => router.push(`/portfolio/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No portfolios yet</Text>
              <Text style={styles.emptyText}>Follow a portfolio to get started with automated investing.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footerWrap}>
            <ExploreBar />
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <RebalanceConfirmSheet
        rebalance={activeRebalance}
        visible={activeRebalance !== null}
        onConfirm={async (id) => { await confirmMutation.mutateAsync(id); }}
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
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.md },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  rebalanceBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E7',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  rebalanceText: { ...typography.caption, color: colors.textPrimary, paddingVertical: 2 },
  reviewLink: { color: colors.accent, fontWeight: '600' },
  sectionLabel: {
    ...typography.headline,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  footerWrap: { marginTop: spacing.lg },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  icon: { width: 44, height: 44, borderRadius: 22 },
  iconFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18, fontWeight: '700', color: colors.accent },
  info: { flex: 1, marginLeft: spacing.sm },
  name: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  sub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  return: { fontSize: 15, fontWeight: '700' },
});

const exploreStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadow.card,
  },
  text: { ...typography.body, color: colors.textMuted },
});


