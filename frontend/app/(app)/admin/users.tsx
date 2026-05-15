import React, { useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminFetchUsers as listUsers,
  adminUpdateUser as updateUser,
  adminDeleteUser as deleteUser,
} from '@/services/admin';
import { AdminUser, AdminUserUpdate } from '@/models/Admin';
import { useAuthStore } from '@/stores/authStore';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Toast } from '@/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/helpers/designTokens';
import { formatDate } from '@/helpers/formatters';

const PAGE_SIZE = 20;

const ROLE_LABELS: Record<string, string> = {
  user: 'User',
  admin: 'Admin',
  ultimate_admin: 'Site Admin',
};

const ROLE_COLORS: Record<string, string> = {
  user: colors.textMuted,
  admin: colors.accent,
  ultimate_admin: colors.danger,
};

const SUB_COLORS: Record<string, string> = {
  active: colors.success,
  grace_period: colors.warning,
  expired: colors.textMuted,
  cancelled: colors.danger,
};

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function formatInvested(amount: string): string {
  const n = parseFloat(amount);
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function AdminUsersScreen() {
  const { user: currentUser } = useAuthStore();
  const isSiteAdmin = currentUser?.role === 'ultimate_admin';
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [draftRole, setDraftRole] = useState('user');
  const [draftActive, setDraftActive] = useState(true);
  const [draftExempt, setDraftExempt] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: ['admin-users'],
      queryFn: ({ pageParam = 1 }) => listUsers(pageParam as number, PAGE_SIZE),
      initialPageParam: 1,
      getNextPageParam: (last, all) =>
        last.users.length === PAGE_SIZE ? all.length + 1 : undefined,
    });

  const users = data?.pages.flatMap((p) => p.users) ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AdminUserUpdate }) =>
      updateUser(id, payload),
    onSuccess: () => {
      setToast({ message: 'User updated.', variant: 'success' });
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => setToast({ message: 'Update failed.', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      setToast({ message: 'User deleted.', variant: 'success' });
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => setToast({ message: 'Delete failed.', variant: 'error' }),
  });

  function openEdit(user: AdminUser) {
    setDraftRole(user.role);
    setDraftActive(user.is_active);
    setDraftExempt(user.subscription_exempt);
    setEditing(user);
  }

  function handleSave() {
    if (!editing) return;
    const payload: AdminUserUpdate = {};
    if (draftRole !== editing.role) payload.role = draftRole;
    if (draftActive !== editing.is_active) payload.is_active = draftActive;
    if (draftExempt !== editing.subscription_exempt) payload.subscription_exempt = draftExempt;
    if (Object.keys(payload).length === 0) {
      setEditing(null);
      return;
    }
    updateMutation.mutate({ id: editing.id, payload });
  }

  function confirmDelete() {
    if (!editing) return;
    Alert.alert('Delete User', `Permanently delete @${editing.username}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(editing.id) },
    ]);
  }

  const roleOptions = isSiteAdmin ? ['user', 'admin', 'ultimate_admin'] : ['user', 'admin'];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.backBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      </View>
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
        renderItem={({ item }: { item: AdminUser }) => {
          const canEdit = isSiteAdmin || item.role !== 'ultimate_admin';
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => canEdit ? openEdit(item) : undefined}
              activeOpacity={canEdit ? 0.7 : 1}
            >
              {/* username + role pill */}
              <View style={styles.rowTop}>
                <Text style={styles.username}>@{item.username}</Text>
                <Pill
                  label={ROLE_LABELS[item.role] ?? item.role}
                  color={ROLE_COLORS[item.role] ?? colors.textMuted}
                />
              </View>

              {/* email */}
              <Text style={styles.email}>{item.email}</Text>

              {/* status pills */}
              <View style={styles.pillRow}>
                <Pill
                  label={item.is_active ? 'Active' : 'Inactive'}
                  color={item.is_active ? colors.success : colors.danger}
                />
                <Pill
                  label={item.subscription_status
                    ? item.subscription_status.replace('_', ' ')
                    : 'No sub'}
                  color={item.subscription_status
                    ? (SUB_COLORS[item.subscription_status] ?? colors.textMuted)
                    : colors.textMuted}
                />
                {item.subscription_exempt && <Pill label="Exempt" color={colors.accent} />}
              </View>

              {/* portfolio count + invested */}
              <View style={styles.statsRow}>
                <Text style={styles.stat}>
                  {item.portfolio_count} portfolio{item.portfolio_count !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.stat}>{formatInvested(item.invested_amount)} invested</Text>
              </View>

              {/* joined date */}
              <Text style={styles.date}>Joined {formatDate(item.created_at)}</Text>

              {!canEdit && <Text style={styles.viewOnly}>View only</Text>}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>No users found.</Text> : null
        }
        contentContainerStyle={styles.list}
      />

      {/* Edit bottom sheet */}
      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setEditing(null)} />
        <View style={styles.sheet}>
          {editing && (
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetTitle}>@{editing.username}</Text>
              <Text style={styles.sheetEmail}>{editing.email}</Text>

              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.segmented}>
                {roleOptions.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.segment, draftRole === r && styles.segmentActive]}
                    onPress={() => setDraftRole(r)}
                  >
                    <Text style={[styles.segmentText, draftRole === r && styles.segmentTextActive]}>
                      {ROLE_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>Active</Text>
                <Switch
                  value={draftActive}
                  onValueChange={setDraftActive}
                  trackColor={{ false: colors.border, true: colors.success }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>Subscription Exempt</Text>
                <Switch
                  value={draftExempt}
                  onValueChange={setDraftExempt}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={updateMutation.isPending}
              >
                <Text style={styles.saveBtnText}>
                  {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </Text>
              </TouchableOpacity>

              {isSiteAdmin && editing.id !== currentUser?.id && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={confirmDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Text style={styles.deleteBtnText}>Delete User</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

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
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  username: { ...typography.headline, color: colors.textPrimary },
  email: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xs },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  stat: { ...typography.caption, color: colors.textMuted },
  dot: { ...typography.caption, color: colors.textMuted },
  date: { ...typography.caption, color: colors.textMuted },
  viewOnly: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.xs },
  pill: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  pillText: { ...typography.caption, fontWeight: '600' },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  backBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backText: { ...typography.body, color: colors.accent },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  sheetTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.xs },
  sheetEmail: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  fieldLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs },
  segmented: { flexDirection: 'row', gap: spacing.xs },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  segmentText: { ...typography.caption, color: colors.textMuted },
  segmentTextActive: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnText: { ...typography.headline, color: colors.primary },
  deleteBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  deleteBtnText: { ...typography.headline, color: colors.danger },
});
