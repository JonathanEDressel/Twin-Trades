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
import { adminFetchUsers as listUsers, adminUpdateUser as updateUser, adminDeleteUser as deleteUser } from '@/services/admin';
import { AdminUserUpdate } from '@/models/Admin';
import { User } from '@/models/User';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Toast } from '@/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/helpers/designTokens';

const PAGE_SIZE = 20;

export default function AdminUsersScreen() {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: ['admin-users'],
      queryFn: ({ pageParam = 1 }) => listUsers(pageParam as number, PAGE_SIZE),
      initialPageParam: 1,
      getNextPageParam: (last, all) =>
        last.users.length === PAGE_SIZE ? all.length + 1 : undefined,
    });

  const users = data?.pages.flatMap((p) => p.users) ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      setToast({ message: 'User deleted.', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => setToast({ message: 'Failed to delete user.', variant: 'error' }),
  });

  function handleDelete(user: User) {
    Alert.alert('Delete User', `Delete @${user.username}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(user.id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {isLoading && <LoadingOverlay />}

      <FlatList
        data={users}
        keyExtractor={(u) => String(u.id)}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.accent} />
        }
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={<Text style={styles.title}>Users</Text>}
        renderItem={({ item }: { item: User }) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.username}>@{item.username}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.role}>{item.role}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)}>
              <Text style={styles.deleteBtn}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>No users found.</Text> : null
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
  username: { ...typography.headline, color: colors.textPrimary },
  email: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  role: { ...typography.caption, color: colors.accent, marginTop: 2 },
  deleteBtn: { ...typography.body, color: colors.danger },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
