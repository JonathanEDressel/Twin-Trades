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
import { adminFetchChangelog as listChangelog } from '@/services/admin';
import { ChangeLogEntry } from '@/models/Admin';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { colors, radius, spacing, typography } from '@/helpers/designTokens';
import { formatDate } from '@/helpers/formatters';

const PAGE_SIZE = 20;

export default function AdminChangelogScreen() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: ['admin-changelog'],
      queryFn: ({ pageParam = 1 }) => listChangelog(pageParam as number, PAGE_SIZE),
      initialPageParam: 1,
      getNextPageParam: (last, all) =>
        last.entries.length === PAGE_SIZE ? all.length + 1 : undefined,
    });

  const entries = data?.pages.flatMap((p) => p.entries) ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      {isLoading && <LoadingOverlay />}

      <FlatList
        data={entries}
        keyExtractor={(e) => String(e.id)}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.accent} />
        }
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={<Text style={styles.title}>Changelog</Text>}
        renderItem={({ item }: { item: ChangeLogEntry }) => (
          <View style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.action}>{item.action.toUpperCase()}</Text>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
            <Text style={styles.entity}>{item.entity_type} #{item.entity_id}</Text>
            {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>No changelog entries.</Text> : null
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
  rowHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: spacing.xs },
  action: { ...typography.headline, color: colors.accent },
  entity: { ...typography.body, color: colors.textPrimary },
  detail: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  date: { ...typography.caption, color: colors.textMuted },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
