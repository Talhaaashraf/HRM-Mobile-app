import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CandidateApplicationsStackParamList } from '../../types';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { listMyApplications } from '../../lib/api';
import { useFocusData } from '../../lib/useFocusData';
import { timeAgo } from '../../lib/format';
import { EmptyState, ErrorText, Loader, StatusBadge, ui } from '../../components/ui';

type Props = NativeStackScreenProps<CandidateApplicationsStackParamList, 'MyApplications'>;

export default function MyApplicationsScreen({ navigation }: Props) {
  const { data, error, loading, refreshing, refresh } = useFocusData(() => listMyApplications());

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <View style={ui.header}>
        <Text style={ui.title}>My applications</Text>
      </View>
      <ErrorText message={error} />

      <FlatList
        data={data ?? []}
        keyExtractor={(a) => a.id}
        contentContainerStyle={ui.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No applications yet"
            message="Jobs you apply for will show up here so you can track their progress."
          />
        }
        renderItem={({ item }) => (
          <View style={ui.card}>
            <View style={styles.top}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.jobTitle}>{item.job?.title ?? 'Job removed'}</Text>
                <Text style={ui.muted}>
                  {item.job?.company_name} · Applied {timeAgo(item.created_at)}
                </Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <TouchableOpacity
              style={styles.msgBtn}
              onPress={() =>
                navigation.navigate('Chat', {
                  applicationId: item.id,
                  title: item.job?.company_name ?? 'Recruiter',
                })
              }
            >
              <Ionicons name="chatbubble-outline" size={16} color={Colors.success} />
              <Text style={styles.msgText}>Message recruiter</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  jobTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  msgBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  msgText: { fontSize: Typography.size.sm, color: Colors.success, fontWeight: Typography.weight.semibold },
});
