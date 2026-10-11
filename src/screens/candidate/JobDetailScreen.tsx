import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CandidateJobsStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { getJob, getMyApplicationForJob } from '../../lib/api';
import { useFocusData } from '../../lib/useFocusData';
import { jobTypeLabel, timeAgo } from '../../lib/format';
import { Button, ErrorText, Loader, StatusBadge, ui } from '../../components/ui';

type Props = NativeStackScreenProps<CandidateJobsStackParamList, 'JobDetail'>;

export default function JobDetailScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const { profile } = useAuth();
  const { data, error, loading } = useFocusData(async () => {
    const [job, application] = await Promise.all([
      getJob(jobId),
      getMyApplicationForJob(jobId, profile!.id),
    ]);
    return { job, application };
  });

  if (loading) return <Loader />;
  if (!data) return <ErrorText message={error ?? 'Job not found.'} />;
  const { job, application } = data;

  return (
    <View style={ui.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ gap: Spacing.xs }}>
          <Text style={ui.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company_name}</Text>
        </View>

        <View style={styles.metaGrid}>
          <Meta icon="location-outline" text={job.location} />
          <Meta icon="pricetag-outline" text={jobTypeLabel(job.type)} />
          {job.salary_range && <Meta icon="cash-outline" text={job.salary_range} />}
          <Meta icon="time-outline" text={`Posted ${timeAgo(job.created_at)}`} />
        </View>

        <View style={{ gap: Spacing.sm }}>
          <Text style={ui.sectionTitle}>About the role</Text>
          <Text style={ui.body}>{job.description}</Text>
        </View>

        {job.requirements.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            <Text style={ui.sectionTitle}>Requirements</Text>
            {job.requirements.map((r, i) => (
              <View key={i} style={styles.reqRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={[ui.body, { flex: 1 }]}>{r}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {application ? (
          <View style={styles.appliedRow}>
            <Text style={ui.body}>Your application:</Text>
            <StatusBadge status={application.status} />
          </View>
        ) : job.is_active ? (
          <Button
            title="Apply now"
            color={Colors.success}
            onPress={() => navigation.navigate('Apply', { jobId, jobTitle: job.title })}
          />
        ) : (
          <Text style={[ui.muted, { textAlign: 'center' }]}>This job is no longer accepting applications.</Text>
        )}
      </View>
    </View>
  );
}

function Meta({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={ui.metaRow}>
      <Ionicons name={icon as any} size={16} color={Colors.textMuted} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing['3xl'] },
  company: { fontSize: Typography.size.md, color: Colors.textSecondary },
  metaGrid: { gap: Spacing.sm },
  metaText: { fontSize: Typography.size.base, color: Colors.textSecondary },
  reqRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  appliedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
});
