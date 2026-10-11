import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JobType, RecruiterJobsStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, Radius } from '../../constants/tokens';
import { createJob, deleteJob, getJob, updateJob } from '../../lib/api';
import { jobTypeLabel } from '../../lib/format';
import { Button, ErrorText, Field, Loader } from '../../components/ui';
import { confirm } from '../../lib/dialog';

type Props = NativeStackScreenProps<RecruiterJobsStackParamList, 'JobForm'>;

export default function JobFormScreen({ navigation, route }: Props) {
  const jobId = route.params?.jobId;
  const { profile } = useAuth();
  const [loading, setLoading] = useState(!!jobId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState(profile?.company_name ?? '');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<JobType>('technical');
  const [salaryRange, setSalaryRange] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: jobId ? 'Edit job' : 'Post a job' });
    if (!jobId) return;
    getJob(jobId)
      .then((job) => {
        setTitle(job.title);
        setCompanyName(job.company_name);
        setLocation(job.location);
        setType(job.type);
        setSalaryRange(job.salary_range ?? '');
        setDescription(job.description);
        setRequirements(job.requirements.join('\n'));
        setIsActive(job.is_active);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [jobId, navigation]);

  async function handleSave() {
    setError(null);
    if (!title.trim() || !companyName.trim() || !location.trim() || !description.trim()) {
      setError('Title, company, location and description are required.');
      return;
    }
    const input = {
      title: title.trim(),
      company_name: companyName.trim(),
      location: location.trim(),
      type,
      salary_range: salaryRange.trim() || null,
      description: description.trim(),
      requirements: requirements
        .split('\n')
        .map((r) => r.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean),
      is_active: isActive,
    };
    setSaving(true);
    try {
      if (jobId) await updateJob(jobId, input);
      else await createJob(profile!.id, input);
      navigation.goBack();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    confirm({
      title: 'Delete job',
      message: 'This also deletes all applications for this job. Continue?',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteJob(jobId!);
          navigation.popToTop();
        } catch (e: any) {
          setError(e.message);
        }
      },
    });
  }

  if (loading) return <Loader />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Job title *" placeholder="e.g. Senior React Native developer" value={title} onChangeText={setTitle} />
        <Field label="Company *" placeholder="Company name" value={companyName} onChangeText={setCompanyName} />
        <Field label="Location *" placeholder="e.g. Remote, Lahore" value={location} onChangeText={setLocation} />

        <View style={{ gap: Spacing.xs }}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.segment}>
            {(['technical', 'non_technical'] as JobType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.segmentItem, type === t && styles.segmentItemActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.segmentText, type === t && styles.segmentTextActive]}>
                  {jobTypeLabel(t)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Field label="Salary range" placeholder="e.g. 150k – 200k PKR / month" value={salaryRange} onChangeText={setSalaryRange} />
        <Field
          label="Description *"
          placeholder="What will this person do?"
          multiline
          value={description}
          onChangeText={setDescription}
        />
        <Field
          label="Requirements (one per line)"
          placeholder={'3+ years experience\nTypeScript\nGood communication'}
          multiline
          value={requirements}
          onChangeText={setRequirements}
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Accepting applications</Text>
            <Text style={styles.hint}>Closed jobs are hidden from job finders.</Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: Colors.primary }} />
        </View>

        <ErrorText message={error} />
        <Button title={jobId ? 'Save changes' : 'Publish job'} loading={saving} onPress={handleSave} />
        {jobId && <Button title="Delete job" variant="danger" icon="trash-outline" onPress={handleDelete} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.base, paddingBottom: Spacing['4xl'] },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
  },
  hint: { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: 4,
  },
  segmentItem: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm, alignItems: 'center' },
  segmentItemActive: { backgroundColor: Colors.background },
  segmentText: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  segmentTextActive: { color: Colors.primary, fontWeight: Typography.weight.semibold },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
