import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList, UserRole } from '../../types';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../constants/tokens';
import { roleColors } from '../../lib/format';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const PANELS: { role: UserRole; title: string; text: string; icon: string }[] = [
  {
    role: 'recruiter',
    title: "I'm a Recruiter",
    text: 'Post jobs, review applicants and hire talent.',
    icon: 'briefcase',
  },
  {
    role: 'candidate',
    title: "I'm a Job Finder",
    text: 'Browse jobs, apply with your CV and track progress.',
    icon: 'search',
  },
];

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>MJT</Text>
        </View>
        <Text style={styles.brand}>MJT Recruitment</Text>
        <Text style={styles.tagline}>Connecting recruiters with the right people.</Text>
      </View>

      <View style={styles.panels}>
        {PANELS.map((p) => {
          const c = roleColors(p.role);
          return (
            <TouchableOpacity
              key={p.role}
              style={[styles.panel, { borderColor: c.main }]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Login', { role: p.role })}
            >
              <View style={[styles.panelIcon, { backgroundColor: c.light }]}>
                <Ionicons name={p.icon as any} size={26} color={c.main} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.panelTitle}>{p.title}</Text>
                <Text style={styles.panelText}>{p.text}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.main} />
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing['3xl'],
  },
  hero: { alignItems: 'center', gap: Spacing.sm },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoText: {
    color: Colors.textInverse,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  brand: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  tagline: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  panels: { gap: Spacing.base },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    backgroundColor: Colors.background,
    ...Shadow.md,
  },
  panelIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  panelText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
