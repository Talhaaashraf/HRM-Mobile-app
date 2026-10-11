import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RecruiterJobsStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, Radius } from '../../constants/tokens';
import { listMyJobs } from '../../lib/api';
import { useFocusData } from '../../lib/useFocusData';
import { jobTypeLabel, timeAgo } from '../../lib/format';
import { Badge, Button, EmptyState, ErrorText, Loader, ui } from '../../components/ui';

type Props = NativeStackScreenProps<RecruiterJobsStackParamList, 'MyJobs'>;

export default function MyJobsScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const { data, error, loading, refreshing, refresh } = useFocusData(() => listMyJobs(profile!.id));

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <View style={ui.header}>
        <Text style={ui.title}>My jobs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('JobForm', {})}>
          <Ionicons name="add" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>
      <ErrorText message={error} />

      <FlatList
        data={data ?? []}
        keyExtractor={(j) => j.id}
        contentContainerStyle={ui.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title="No jobs posted yet"
            message="Post your first job and job finders will be able to apply."
            action={<Button title="Post a job" onPress={() => navigation.navigate('JobForm', {})} />}
          />
        }
        renderItem={({ item }) => {
          const count = item.applications[0]?.count ?? 0;
          return (
            <TouchableOpacity
              style={ui.card}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Applicants', { jobId: item.id, jobTitle: item.title })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                {item.is_active ? (
                  <Badge text="Open" color={Colors.success} background={Colors.successLight} />
                ) : (
                  <Badge text="Closed" color={Colors.textMuted} background={Colors.surfaceAlt} />
                )}
              </View>
              <Text style={ui.muted}>
                {item.location} · {jobTypeLabel(item.type)} · {timeAgo(item.created_at)}
              </Text>
              <View style={styles.cardBottom}>
                <View style={ui.metaRow}>
                  <Ionicons name="people-outline" size={16} color={Colors.primary} />
                  <Text style={styles.count}>
                    {count} applicant{count === 1 ? '' : 's'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('JobForm', { jobId: item.id })}>
                  <Text style={styles.edit}>Edit</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  jobTitle: {
    flex: 1,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  count: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: Typography.weight.semibold },
  edit: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
});
