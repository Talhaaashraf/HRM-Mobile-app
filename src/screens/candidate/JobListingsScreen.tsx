import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CandidateJobsStackParamList, JobType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, Radius } from '../../constants/tokens';
import { listMyApplications, listOpenJobs } from '../../lib/api';
import { useFocusData } from '../../lib/useFocusData';
import { jobTypeLabel, timeAgo } from '../../lib/format';
import { Badge, EmptyState, ErrorText, Loader, ui } from '../../components/ui';

type Filter = 'all' | JobType;
type Props = NativeStackScreenProps<CandidateJobsStackParamList, 'JobListings'>;

export default function JobListingsScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const { data, error, loading, refreshing, refresh } = useFocusData(async () => {
    const [jobs, apps] = await Promise.all([listOpenJobs(), listMyApplications()]);
    return { jobs, applied: new Set(apps.map((a) => a.job_id)) };
  });

  if (loading) return <Loader />;

  const q = query.trim().toLowerCase();
  const filtered = (data?.jobs ?? []).filter((j) => {
    const matchesFilter = filter === 'all' || j.type === filter;
    const matchesQuery =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.company_name.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={ui.muted}>Hi {profile?.full_name?.split(' ')[0] || 'there'} 👋</Text>
        <Text style={ui.title}>Find your next job</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search title, company or location…"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'technical', 'non_technical'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : jobTypeLabel(f)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ErrorText message={error} />

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={ui.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No jobs found"
            message={q || filter !== 'all' ? 'Try a different search or filter.' : 'Check back soon — new jobs are posted often.'}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={ui.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
          >
            <View style={styles.cardTop}>
              <Text style={styles.jobTitle}>{item.title}</Text>
              {data?.applied.has(item.id) ? (
                <Badge text="Applied" color={Colors.success} background={Colors.successLight} />
              ) : (
                <Badge
                  text={jobTypeLabel(item.type)}
                  color={item.type === 'technical' ? Colors.primary : Colors.warning}
                  background={item.type === 'technical' ? Colors.primaryLight : Colors.warningLight}
                />
              )}
            </View>
            <View style={ui.metaRow}>
              <Ionicons name="business-outline" size={14} color={Colors.textMuted} />
              <Text style={ui.muted}>{item.company_name}</Text>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} style={{ marginLeft: Spacing.sm }} />
              <Text style={ui.muted}>{item.location}</Text>
            </View>
            <View style={styles.cardBottom}>
              {item.salary_range ? <Text style={styles.salary}>{item.salary_range}</Text> : <View />}
              <Text style={ui.muted}>{timeAgo(item.created_at)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.base },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border, paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.md, fontSize: Typography.size.base, color: Colors.textPrimary },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, marginBottom: Spacing.base },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.successLight, borderColor: Colors.success },
  filterChipText: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  filterChipTextActive: { color: Colors.success, fontWeight: Typography.weight.semibold },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  jobTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  salary: { fontSize: Typography.size.sm, color: Colors.success, fontWeight: Typography.weight.semibold },
});
