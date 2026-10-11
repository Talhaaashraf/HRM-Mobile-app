import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MessagesStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, Radius } from '../../constants/tokens';
import { listConversations } from '../../lib/api';
import { useFocusData } from '../../lib/useFocusData';
import { initial, roleColors, timeAgo } from '../../lib/format';
import { EmptyState, ErrorText, Loader, ui } from '../../components/ui';

type Props = NativeStackScreenProps<MessagesStackParamList, 'Conversations'>;

export default function ConversationsScreen({ navigation }: Props) {
  const { profile, role } = useAuth();
  const c = roleColors(role ?? 'candidate');
  const { data, error, loading, refreshing, refresh } = useFocusData(listConversations);

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <View style={ui.header}>
        <Text style={ui.title}>Messages</Text>
      </View>
      <ErrorText message={error} />

      <FlatList
        data={data ?? []}
        keyExtractor={(cv) => cv.application.id}
        contentContainerStyle={ui.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations yet"
            message={
              role === 'recruiter'
                ? 'Open an applicant and tap "Message" to start a chat.'
                : 'Go to My applications and tap "Message recruiter" to start a chat.'
            }
          />
        }
        renderItem={({ item: { application: a, lastMessage } }) => {
          // Recruiters see the candidate's name; job finders see the company.
          const name =
            role === 'recruiter'
              ? a.candidate?.full_name || 'Candidate'
              : a.job?.company_name || 'Recruiter';
          return (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Chat', { applicationId: a.id, title: name })}
            >
              <View style={[styles.avatar, { backgroundColor: c.light }]}>
                <Text style={[styles.avatarText, { color: c.main }]}>{initial(name)}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={1}>{name}</Text>
                  <Text style={ui.muted}>{timeAgo(lastMessage.created_at)}</Text>
                </View>
                <Text style={styles.job} numberOfLines={1}>{a.job?.title}</Text>
                <Text style={ui.muted} numberOfLines={1}>
                  {lastMessage.sender_id === profile?.id ? 'You: ' : ''}
                  {lastMessage.content}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.md, alignItems: 'center' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  avatar: { width: 46, height: 46, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold },
  name: { flex: 1, fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  job: { fontSize: Typography.size.xs, color: Colors.textSecondary },
});
