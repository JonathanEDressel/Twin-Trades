import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminDeletePortfolio as deletePortfolio,
  adminTogglePortfolio as togglePortfolioVisibility,
} from '@/services/admin';
import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { PaginatedPortfolios } from '@/models/Portfolio';

async function listPortfolios(page: number, pageSize: number): Promise<PaginatedPortfolios> {
  const { data } = await apiClient.get<PaginatedPortfolios>(endpoints.adminPortfolios(), {
    params: { page, page_size: pageSize },
  });
  return data;
}
import { Portfolio } from '@/models/Portfolio';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Toast } from '@/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/helpers/designTokens';

const PAGE_SIZE = 20;

export default function AdminPortfoliosScreen() {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: ['admin-portfolios'],
      queryFn: ({ pageParam = 1 }) => listPortfolios(pageParam as number, PAGE_SIZE),
      initialPageParam: 1,
      getNextPageParam: (last, all) =>
        last.portfolios.length === PAGE_SIZE ? all.length + 1 : undefined,
    });

  const portfolios = data?.pages.flatMap((p) => p.portfolios) ?? [];

  const toggleMutation = useMutation({
    mutationFn: (id: number) => togglePortfolioVisibility(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-portfolios'] }),
    onError: () => setToast({ message: 'Toggle failed.', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePortfolio(id),
    onSuccess: () => {
      setToast({ message: 'Portfolio deleted.', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['admin-portfolios'] });
    },
    onError: () => setToast({ message: 'Delete failed.', variant: 'error' }),
  });

  function confirmDelete(portfolio: Portfolio) {
    Alert.alert('Delete Portfolio', `Delete "${portfolio.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(portfolio.id),
      },
    ]);
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
        ListHeaderComponent={<Text style={styles.title}>Portfolios</Text>}
        renderItem={({ item }: { item: Portfolio }) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.is_public ? 'Public' : 'Private'} ·{' '}
                {item.total_return != null
                  ? `${item.total_return >= 0 ? '+' : ''}${item.total_return.toFixed(2)}%`
                  : '—'}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => toggleMutation.mutate(item.id)}>
                <Text style={styles.toggleBtn}>{item.is_public ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(item)}>
                <Text style={styles.deleteBtn}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>No portfolios found.</Text> : null
        }
        contentContainerStyle={styles.list}
      />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} visible onHide={() => setToast(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  list: { padding: spacing.md },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowLeft: { flex: 1 },
  name: { ...typography.headline, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  actions: { gap: spacing.sm, alignItems: 'flex-end' },
  toggleBtn: { ...typography.body, color: colors.accent },
  deleteBtn: { ...typography.body, color: colors.danger },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
