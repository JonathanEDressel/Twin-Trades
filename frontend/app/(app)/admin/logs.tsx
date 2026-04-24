import React from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { adminFetchLogs as listLogs } from '@/services/admin';
import { ErrorLog } from '@/models/Admin';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { colors, radius, spacing, typography } from '@/helpers/designTokens';

const PAGE_SIZE = 20;

export default function AdminLogsScreen() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: ['admin-logs'],
      queryFn: ({ pageParam = 1 }) => listLogs(pageParam as number, PAGE_SIZE),
      initialPageParam: 1,
      getNextPageParam: (last, all) =>
        last.logs.length === PAGE_SIZE ? all.length + 1 : undefined,
    });

  const logs = data?.pages.flatMap((p) => p.logs) ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      {isLoading && <LoadingOverlay />}

      <FlatList
        data={logs}
        keyExtractor={(l) => String(l.id)}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.accent} />
        }
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={<Text style={styles.title}>Error Logs</Text>}
        renderItem={({ item }: { item: ErrorLog }) => (
          <View style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.level}>{item.level.toUpperCase()}</Text>
              <Text style={styles.date}>{item.timestamp}</Text>
            </View>
            <Text style={styles.message}>{item.message}</Text>
            {item.detail ? (
              <Text style={styles.detail} numberOfLines={3}>
                {item.detail}
              </Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>No error logs.</Text> : null
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  list: { padding: spacing.md },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  level: { ...typography.caption, color: colors.danger, fontWeight: '700' },
  date: { ...typography.caption, color: colors.textMuted },
  message: { ...typography.body, color: colors.textPrimary },
  detail: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
