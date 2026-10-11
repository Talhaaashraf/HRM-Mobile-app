import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApplicationStatus, RecruiterJobsStackParamList } from '../../types';
import { Colors, Spacing, Typography, Radius } from '../../constants/tokens';
import { getApplication, getResumeUrl, setApplicationStatus } from '../../lib/api';
import { useFocusData } from '../../lib/useFocusData';
import { APPLICATION_STATUSES, initial, statusColors, statusLabel, timeAgo } from '../../lib/format';
import { Button, ErrorText, Loader, StatusBadge, ui } from '../../components/ui';

type Props = NativeStackScreenProps<RecruiterJobsStackParamList, 'ApplicantDetail'>;

export default function ApplicantDetailScreen({ navigation, route }: Props) {
  const { applicationId } = route.params;
  const { data: app, error, loading, reload } = useFocusData(() => getApplication(applicationId));
  const [updating, setUpdating] = useState<ApplicationStatus | null>(null);
  const [openingCv, setOpeningCv] = useState(false);

  if (loading) return <Loader />;
  if (!app) return <ErrorText message={error ?? 'Application not found.'} />;

  const c = app.candidate;

  async function changeStatus(status: ApplicationStatus) {
    setUpdating(status);
    try {
      await setApplicationStatus(applicationId, status);
      await reload();
    } catch (e: any) {
      Alert.alert('Could not update status', e.message);
    } finally {
      setUpdating(null);
    }
  }

  async function openCv() {
    if (!app?.resume_url) return;
    setOpeningCv(true);
    try {
      await Linking.openURL(await getResumeUrl(app.resume_url));
    } catch (e: any) {
      Alert.alert('Could not open CV', e.message);
    } finally {
      setOpeningCv(false);
    }
  }

  return (
    <ScrollView style={ui.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial(c?.full_name)}</Text>
        </View>
        <Text style={ui.title}>{c?.full_name || 'Candidate'}</Text>
        {c?.job_title && <Text style={ui.body}>{c.job_title}</Text>}
        <StatusBadge status={app.status} />
      </View>

      <View style={ui.card}>
        <InfoRow icon="briefcase-outline" text={`Applied for ${app.job?.title ?? 'this job'}`} />
        <InfoRow icon="time-outline" text={`Applied ${timeAgo(app.created_at)}`} />
        {c?.email && (
          <InfoRow icon="mail-outline" text={c.email} onPress={() => Linking.openURL(`mailto:${c.email}`)} />
        )}
        {c?.phone && (
          <InfoRow icon="call-outline" text={c.phone} onPress={() => Linking.openURL(`tel:${c.phone}`)} />
        )}
      </View>

      {app.cover_note ? (
        <View style={ui.card}>
          <Text style={ui.sectionTitle}>Cover note</Text>
          <Text style={ui.body}>{app.cover_note}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title={app.resume_url ? 'View CV' : 'No CV uploaded'}
          icon="document-text-outline"
          variant="secondary"
          disabled={!app.resume_url}
          loading={openingCv}
          onPress={openCv}
          style={{ flex: 1 }}
        />
        <Button
          title="Message"
          icon="chatbubble-outline"
          onPress={() =>
            navigation.navigate('Chat', { applicationId, title: c?.full_name || 'Candidate' })
          }
          style={{ flex: 1 }}
        />
      </View>

      <Text style={ui.sectionTitle}>Update status</Text>
      <View style={styles.statusGrid}>
        {APPLICATION_STATUSES.map((s) => {
          const active = app.status === s;
          const col = statusColors(s);
          return (
            <TouchableOpacity
              key={s}
              disabled={active || updating !== null}
              style={[styles.statusBtn, { borderColor: col.fg }, active && { backgroundColor: col.bg }]}
              onPress={() => changeStatus(s)}
            >
              <Text style={[styles.statusText, { color: col.fg }]}>
                {updating === s ? 'Saving…' : statusLabel(s)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, text, onPress }: { icon: string; text: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.infoRow} disabled={!onPress} onPress={onPress}>
      <Ionicons name={icon as any} size={18} color={Colors.textMuted} />
      <Text style={[styles.infoText, onPress && { color: Colors.primary }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },
  header: { alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.size.xl, color: Colors.primary, fontWeight: Typography.weight.bold },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 2 },
  infoText: { fontSize: Typography.size.base, color: Colors.textPrimary, flex: 1 },
  actions: { flexDirection: 'row', gap: Spacing.md },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusBtn: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  statusText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
});
