import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApplicationStatus, RecruiterJobsStackParamList } from '../../types';
import { Colors, Spacing, Typography, Radius } from '../../constants/tokens';
import { listApplicationsForJob } from '../../lib/api';
import { useFocusData } from '../../lib/useFocusData';
import { APPLICATION_STATUSES, initial, statusLabel, timeAgo } from '../../lib/format';
import { EmptyState, ErrorText, Loader, StatusBadge, ui } from '../../components/ui';

type Props = NativeStackScreenProps<RecruiterJobsStackParamList, 'Applicants'>;

export default function ApplicantsScreen({ navigation, route }: Props) {
  const { jobId, jobTitle } = route.params;
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const { data, error, loading, refreshing, refresh } = useFocusData(() => listApplicationsForJob(jobId));

  useEffect(() => {
    navigation.setOptions({ title: jobTitle });
  }, [navigation, jobTitle]);

  if (loading) return <Loader />;

  const all = data ?? [];
  const filtered = filter === 'all' ? all : all.filter((a) => a.status === filter);

  return (
    <View style={ui.screen}>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['all', ...APPLICATION_STATUSES] as const).map((s) => {
            const count = s === 'all' ? all.length : all.filter((a) => a.status === s).length;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.chip, filter === s && styles.chipActive]}
                onPress={() => setFilter(s)}
              >
                <Text style={[styles.chipText, filter === s && styles.chipTextActive]}>
                  {s === 'all' ? 'All' : statusLabel(s)} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <ErrorText message={error} />

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        contentContainerStyle={ui.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={all.length === 0 ? 'No applicants yet' : 'No applicants with this status'}
            message={all.length === 0 ? 'Applications will appear here as job finders apply.' : undefined}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[ui.card, styles.row]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ApplicantDetail', { applicationId: item.id })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial(item.candidate?.full_name)}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name}>{item.candidate?.full_name || 'Candidate'}</Text>
              <Text style={ui.muted} numberOfLines={1}>
                {item.candidate?.job_title || item.candidate?.email} · {timeAgo(item.created_at)}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: Typography.weight.semibold },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.primary, fontWeight: Typography.weight.bold },
  name: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
});
