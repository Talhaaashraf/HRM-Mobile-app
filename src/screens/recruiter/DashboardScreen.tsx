import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, Radius } from '../../constants/tokens';
import { listMyApplications, listMyJobs } from '../../lib/api';
import { useFocusData } from '../../lib/useFocusData';
import { timeAgo } from '../../lib/format';
import { Button, ErrorText, Loader, StatusBadge, ui } from '../../components/ui';

export default function DashboardScreen({ navigation }: any) {
  const { profile } = useAuth();
  const { data, error, loading, refreshing, refresh } = useFocusData(async () => {
    const [jobs, recent] = await Promise.all([listMyJobs(profile!.id), listMyApplications(5)]);
    return { jobs, recent };
  });

  if (loading) return <Loader />;

  const jobs = data?.jobs ?? [];
  const recent = data?.recent ?? [];
  const activeJobs = jobs.filter((j) => j.is_active).length;
  const totalApplicants = jobs.reduce((n, j) => n + (j.applications[0]?.count ?? 0), 0);
  const newApplicants = recent.filter((a) => a.status === 'applied').length;

  // Screens in the Jobs tab live in a nested stack.
  const openJobs = (screen: string, params?: object) =>
    navigation.navigate('RecruiterJobs', { screen, params, initial: false });

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View>
          <Text style={ui.muted}>Welcome back,</Text>
          <Text style={ui.title}>{profile?.full_name || 'Recruiter'}</Text>
          {profile?.company_name && <Text style={ui.muted}>{profile.company_name}</Text>}
        </View>

        <ErrorText message={error} />

        <View style={styles.stats}>
          <Stat label="Active jobs" value={activeJobs} icon="briefcase-outline" />
          <Stat label="Applicants" value={totalApplicants} icon="people-outline" />
          <Stat label="New" value={newApplicants} icon="sparkles-outline" />
        </View>

        <Button title="Post a new job" icon="add-circle-outline" onPress={() => openJobs('JobForm', {})} />

        <View style={styles.sectionHeader}>
          <Text style={ui.sectionTitle}>Recent applicants</Text>
        </View>

        {recent.length === 0 ? (
          <Text style={ui.muted}>No applications yet. Post a job to start receiving applicants.</Text>
        ) : (
          recent.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={styles.row}
              activeOpacity={0.8}
              onPress={() => openJobs('ApplicantDetail', { applicationId: a.id })}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rowTitle}>{a.candidate?.full_name || 'Candidate'}</Text>
                <Text style={ui.muted} numberOfLines={1}>
                  {a.job?.title} · {timeAgo(a.created_at)}
                </Text>
              </View>
              <StatusBadge status={a.status} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon as any} size={20} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={ui.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, gap: Spacing.lg },
  stats: { flexDirection: 'row', gap: Spacing.md },
  stat: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 2,
  },
  statValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  sectionHeader: { marginTop: Spacing.sm },
  row: {
    ...ui.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rowTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
});
