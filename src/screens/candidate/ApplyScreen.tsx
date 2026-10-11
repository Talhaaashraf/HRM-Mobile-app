import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CandidateJobsStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, Radius } from '../../constants/tokens';
import { applyToJob, uploadResume } from '../../lib/api';
import { Button, ErrorText, Field, ui } from '../../components/ui';
import { confirm, notify } from '../../lib/dialog';

type Props = NativeStackScreenProps<CandidateJobsStackParamList, 'Apply'>;

const MAX_CV_BYTES = 5 * 1024 * 1024;

export default function ApplyScreen({ navigation, route }: Props) {
  const { jobId, jobTitle } = route.params;
  const { profile } = useAuth();
  const [coverNote, setCoverNote] = useState('');
  const [resume, setResume] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePickResume() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    if (file.size && file.size > MAX_CV_BYTES) {
      notify('File too large', 'Please choose a CV under 5 MB.');
      return;
    }
    setResume(file);
  }

  async function handleSubmit() {
    setError(null);
    if (!resume) {
      setError('Please upload your CV before submitting.');
      return;
    }
    setLoading(true);
    try {
      const resumePath = await uploadResume(profile!.id, resume);
      await applyToJob({
        jobId,
        candidateId: profile!.id,
        coverNote: coverNote.trim() || null,
        resumePath,
      });
      confirm({
        title: 'Application submitted!',
        message: 'The recruiter will review your application. View your applications now?',
        confirmText: 'View my applications',
        cancelText: 'Keep browsing',
        onConfirm: () => {
          navigation.popToTop();
          navigation.getParent()?.navigate('Applications');
        },
        onCancel: () => navigation.popToTop(),
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={{ gap: Spacing.xs }}>
          <Text style={ui.muted}>Applying for</Text>
          <Text style={ui.sectionTitle}>{jobTitle}</Text>
        </View>

        <View style={{ gap: Spacing.xs }}>
          <Text style={styles.label}>CV / Resume *</Text>
          <TouchableOpacity style={styles.uploadBox} activeOpacity={0.8} onPress={handlePickResume}>
            <Ionicons
              name={resume ? 'document-text' : 'cloud-upload-outline'}
              size={28}
              color={resume ? Colors.success : Colors.textMuted}
            />
            <Text style={[styles.uploadText, resume && { color: Colors.textPrimary }]} numberOfLines={1}>
              {resume ? resume.name : 'Tap to upload (PDF or Word, max 5 MB)'}
            </Text>
            {resume && <Text style={ui.muted}>Tap to change</Text>}
          </TouchableOpacity>
        </View>

        <Field
          label="Cover note (optional)"
          placeholder="Tell the recruiter why you're a great fit…"
          multiline
          value={coverNote}
          onChangeText={setCoverNote}
        />

        <ErrorText message={error} />
        <Button title="Submit application" color={Colors.success} loading={loading} onPress={handleSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, gap: Spacing.xl },
  label: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textPrimary },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  uploadText: { fontSize: Typography.size.sm, color: Colors.textMuted, textAlign: 'center' },
});
