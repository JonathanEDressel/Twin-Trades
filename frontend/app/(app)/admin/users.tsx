import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
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

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
  lifetime: 'Lifetime',
};

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color, backgroundColor: color + '1A' }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function TableHeader({
  sortBy,
  sortOrder,
  onSort,
}: {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (col: string) => void;
}) {
  function SortIcon({ col }: { col: string }) {
    const active = sortBy === col;
    return (
      <Text style={[styles.sortIcon, active && styles.sortIconActive]}>
        {active ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ' ⇅'}
      </Text>
    );
  }
  return (
    <View style={styles.tableHeader}>
      <TouchableOpacity style={{ flex: 2.5, flexDirection: 'row', alignItems: 'center' }} onPress={() => onSort('username')}>
        <Text style={styles.headerCell}>User</Text><SortIcon col="username" />
      </TouchableOpacity>
      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => onSort('role')}>
        <Text style={styles.headerCell}>Role</Text><SortIcon col="role" />
      </TouchableOpacity>
      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => onSort('subscription_plan')}>
        <Text style={styles.headerCell}>Plan</Text><SortIcon col="subscription_plan" />
      </TouchableOpacity>
      <TouchableOpacity style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center' }} onPress={() => onSort('subscription_status')}>
        <Text style={styles.headerCell}>Status</Text><SortIcon col="subscription_status" />
      </TouchableOpacity>
      <TouchableOpacity style={{ flex: 0.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} onPress={() => onSort('is_active')}>
        <Text style={[styles.headerCell, { textAlign: 'center' }]}>On</Text><SortIcon col="is_active" />
      </TouchableOpacity>
    </View>
  );
}

export default function AdminUsersScreen() {
  const { user: currentUser } = useAuthStore();
  const isSiteAdmin = currentUser?.role === 'ultimate_admin';
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'success' } | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  // edit drafts
  const [draftRole, setDraftRole] = useState('user');
  const [draftActive, setDraftActive] = useState(true);
  const [draftExempt, setDraftExempt] = useState(false);
  const [draftUsername, setDraftUsername] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftDisplayName, setDraftDisplayName] = useState('');
  const [draftPassword, setDraftPassword] = useState('');

  // search with 500 ms debounce
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  function handleSort(col: string) {
    if (col === sortBy) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  }

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(searchInput.trim()), 500);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchInput]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: ['admin-users', search, sortBy, sortOrder],
      queryFn: ({ pageParam = 1 }) => listUsers(pageParam as number, PAGE_SIZE, search || undefined, sortBy, sortOrder),
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
    setDraftUsername(user.username);
    setDraftEmail(user.email);
    setDraftDisplayName(user.display_name ?? '');
    setDraftPassword('');
    setEditing(user);
  }

  function handleSave() {
    if (!editing) return;
    const payload: AdminUserUpdate = {};
    if (draftRole !== editing.role) payload.role = draftRole;
    if (draftActive !== editing.is_active) payload.is_active = draftActive;
    if (draftExempt !== editing.subscription_exempt) payload.subscription_exempt = draftExempt;
    if (draftUsername.trim() !== editing.username) payload.username = draftUsername.trim();
    if (draftEmail.trim().toLowerCase() !== editing.email.toLowerCase()) payload.email = draftEmail.trim();
    const trimmedDisplayName = draftDisplayName.trim();
    if (trimmedDisplayName !== (editing.display_name ?? '')) payload.display_name = trimmedDisplayName || undefined;
    if (draftPassword.length > 0) payload.password = draftPassword;
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
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.title}>Users</Text>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username or email…"
                placeholderTextColor={colors.textMuted}
                value={searchInput}
                onChangeText={setSearchInput}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>
            <TableHeader sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
          </View>
        }
        renderItem={({ item }: { item: AdminUser }) => {
          const canEdit = isSiteAdmin || item.role !== 'ultimate_admin';
          const subStatus = item.subscription_status;
          const subPlan = item.subscription_plan;
          return (
            <TouchableOpacity
              style={styles.tableRow}
              onPress={() => canEdit ? openEdit(item) : undefined}
              activeOpacity={canEdit ? 0.7 : 1}
            >
              {/* User column */}
              <View style={{ flex: 2.5 }}>
                <Text style={styles.username} numberOfLines={1}>@{item.username}</Text>
                <Text style={styles.emailCell} numberOfLines={1}>{item.email}</Text>
                {item.subscription_exempt && (
                  <Text style={styles.exemptBadge}>Exempt</Text>
                )}
              </View>

              {/* Role column */}
              <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
                <Pill
                  label={ROLE_LABELS[item.role] ?? item.role}
                  color={ROLE_COLORS[item.role] ?? colors.textMuted}
                />
              </View>

              {/* Plan column */}
              <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
                <Text style={styles.planText}>
                  {subPlan ? (PLAN_LABELS[subPlan] ?? subPlan) : '—'}
                </Text>
              </View>

              {/* Status column */}
              <View style={{ flex: 1.2, alignItems: 'flex-start', justifyContent: 'center' }}>
                {subStatus ? (
                  <Pill
                    label={subStatus.replace('_', ' ')}
                    color={SUB_COLORS[subStatus] ?? colors.textMuted}
                  />
                ) : (
                  <Text style={styles.noSubText}>—</Text>
                )}
              </View>

              {/* Active indicator */}
              <View style={{ flex: 0.5, alignItems: 'center', justifyContent: 'center' }}>
                <View style={[styles.activeDot, { backgroundColor: item.is_active ? colors.success : colors.danger }]} />
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.empty}>
              {search ? `No users found for "${search}".` : 'No users found.'}
            </Text>
          ) : null
        }
        contentContainerStyle={styles.list}
      />

      {/* Edit bottom sheet */}
      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setEditing(null)} />
        <View style={styles.sheet}>
          {editing && (
            <ScrollView bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>Edit User</Text>

              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                style={styles.textInput}
                value={draftUsername}
                onChangeText={setDraftUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={draftEmail}
                onChangeText={setDraftEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Display Name</Text>
              <TextInput
                style={styles.textInput}
                value={draftDisplayName}
                onChangeText={setDraftDisplayName}
                placeholder="(none)"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                value={draftPassword}
                onChangeText={setDraftPassword}
                secureTextEntry
                placeholder="Leave blank to keep unchanged"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />

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
  list: { paddingBottom: spacing.xl },
  listHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },

  // Search
  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  searchInput: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },

  // Table header — marginHorizontal breaks out of listHeader padding so columns
  // align with row cells (both end up with spacing.md from the screen edge)
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginHorizontal: -spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Table rows
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.card,
  },
  username: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  emailCell: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  exemptBadge: { ...typography.caption, color: colors.accent, fontWeight: '600', marginTop: 2 },
  planText: { ...typography.caption, color: colors.textPrimary },
  noSubText: { ...typography.caption, color: colors.textMuted },
  activeDot: { width: 10, height: 10, borderRadius: 5 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },

  // Shared
  pill: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.md },
  backBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backText: { ...typography.body, color: colors.accent },

  // Sort icons
  sortIcon: { fontSize: 10, color: colors.textMuted },
  sortIconActive: { color: colors.accent },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  sheetTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.md },
  fieldLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs },
  textInput: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
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
