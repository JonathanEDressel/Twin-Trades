import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMarketplace, joinPortfolio, fetchMyPortfolios } from '@/services/portfolio';
import { fetchSubscriptionStatus } from '@/services/subscription';
import { Portfolio } from '@/models/Portfolio';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Toast } from '@/components/ui/Toast';
import { colors, spacing, typography } from '@/helpers/designTokens';

const PAGE_SIZE = 20;

export default function MarketplaceScreen() {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: fetchSubscriptionStatus,
  });

  const { data: myPortfolios = [] } = useQuery({
    queryKey: ['my-portfolios'],
    queryFn: fetchMyPortfolios,
  });

  const myPortfolioIds = new Set(myPortfolios.map((p) => p.id));

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['marketplace'],
    queryFn: ({ pageParam = 1 }) => fetchMarketplace(pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.portfolios.length === PAGE_SIZE ? all.length + 1 : undefined,
  });

  const portfolios = data?.pages.flatMap((p) => p.portfolios) ?? [];

  const joinMutation = useMutation({
    mutationFn: (portfolioId: number) => joinPortfolio({ portfolio_id: portfolioId }),
    onSuccess: () => {
      setToast({ message: 'Joined portfolio!', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['my-portfolios'] });
    },
    onError: () =>
      setToast({ message: 'Failed to join portfolio.', variant: 'error' }),
  });

  function handleJoin(portfolio: Portfolio) {
    if (!subscription || subscription.status !== 'active') {
      setToast({ message: 'An active subscription is required to join portfolios.', variant: 'error' });
      return;
    }
    joinMutation.mutate(portfolio.id);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {isLoading && <LoadingOverlay />}

      <FlatList
        data={portfolios}
        keyExtractor={(p) => String(p.id)}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.accent} />
        }
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <Text style={styles.title}>Marketplace</Text>
        }
        renderItem={({ item }: { item: Portfolio }) => (
          <PortfolioCard
            portfolio={item}
            isFollowing={myPortfolioIds.has(item.id)}
            onPress={() => {
              if (myPortfolioIds.has(item.id)) {
                // Navigate to detail (push)
              } else {
                handleJoin(item);
              }
            }}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.empty}>No portfolios available.</Text>
          ) : null
        }
        contentContainerStyle={styles.list}
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
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
