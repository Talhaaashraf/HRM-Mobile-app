import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, Radius } from '../../constants/tokens';
import { changePassword, updateProfile } from '../../lib/api';
import { initial, roleColors, roleLabel } from '../../lib/format';
import { Button, ErrorText, Field } from '../../components/ui';
import { confirm, notify } from '../../lib/dialog';

function ProfileRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon as any} size={20} color={Colors.textMuted} style={styles.rowIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const role = profile?.role ?? 'candidate';
  const c = roleColors(role);
  const [mode, setMode] = useState<'view' | 'edit' | 'password'>('view');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  function startEdit() {
    setFullName(profile?.full_name ?? '');
    setCompanyName(profile?.company_name ?? '');
    setJobTitle(profile?.job_title ?? '');
    setPhone(profile?.phone ?? '');
    setError(null);
    setMode('edit');
  }

  async function saveProfile() {
    if (!fullName.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile(profile!.id, {
        full_name: fullName.trim(),
        company_name: role === 'recruiter' ? companyName.trim() || null : null,
        job_title: jobTitle.trim() || null,
        phone: phone.trim() || null,
      });
      await refreshProfile();
      setMode('view');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(password);
      setPassword('');
      setMode('view');
      notify('Password updated');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    confirm({
      title: 'Log out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log out',
      destructive: true,
      onConfirm: signOut,
    });
  }

  const fullNameShown = profile?.full_name || 'Unknown';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarBox, { backgroundColor: c.light }]}>
              <Text style={[styles.avatarText, { color: c.main }]}>{initial(fullNameShown)}</Text>
            </View>
            <Text style={styles.name}>{fullNameShown}</Text>
            <View style={[styles.roleBadge, { backgroundColor: c.light }]}>
              <Text style={[styles.roleBadgeText, { color: c.main }]}>{roleLabel(role)}</Text>
            </View>
          </View>

          {mode === 'edit' && (
            <View style={styles.form}>
              <Field label="Full name" value={fullName} onChangeText={setFullName} />
              {role === 'recruiter' && (
                <Field label="Company name" value={companyName} onChangeText={setCompanyName} />
              )}
              <Field
                label={role === 'recruiter' ? 'Your position' : 'Headline'}
                placeholder={role === 'recruiter' ? 'e.g. HR Manager' : 'e.g. Frontend developer'}
                value={jobTitle}
                onChangeText={setJobTitle}
              />
              <Field label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              <ErrorText message={error} />
              <Button title="Save" color={c.main} loading={saving} onPress={saveProfile} />
              <Button title="Cancel" variant="secondary" color={c.main} onPress={() => setMode('view')} />
            </View>
          )}

          {mode === 'password' && (
            <View style={styles.form}>
              <Field
                label="New password"
                placeholder="Min. 6 characters"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <ErrorText message={error} />
              <Button title="Update password" color={c.main} loading={saving} onPress={savePassword} />
              <Button title="Cancel" variant="secondary" color={c.main} onPress={() => setMode('view')} />
            </View>
          )}

          {mode === 'view' && (
            <>
              <View style={styles.card}>
                <ProfileRow icon="mail-outline" label="Email" value={profile?.email ?? '—'} />
                {role === 'recruiter' && (
                  <>
                    <View style={styles.divider} />
                    <ProfileRow icon="business-outline" label="Company" value={profile?.company_name || '—'} />
                  </>
                )}
                <View style={styles.divider} />
                <ProfileRow
                  icon="id-card-outline"
                  label={role === 'recruiter' ? 'Position' : 'Headline'}
                  value={profile?.job_title || '—'}
                />
                <View style={styles.divider} />
                <ProfileRow icon="call-outline" label="Phone" value={profile?.phone || '—'} />
              </View>

              <View style={styles.card}>
                <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={startEdit}>
                  <Ionicons name="create-outline" size={20} color={Colors.textPrimary} />
                  <Text style={styles.actionText}>Edit profile</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.actionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setError(null);
                    setMode('password');
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textPrimary} />
                  <Text style={styles.actionText}>Change password</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                <Text style={styles.logoutText}>Log out</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.xl,
  },
  form: { gap: Spacing.base },
  avatarSection: { alignItems: 'center', gap: Spacing.sm },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
  },
  name: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  roleBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  roleBadgeText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  rowIcon: { width: 24 },
  rowLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: Spacing.base,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  actionText: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
  },
  logoutText: {
    color: Colors.error,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
});
