import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors, Spacing, Typography, Radius } from '../../constants/tokens';
import { useAuth } from '../../context/AuthContext';
import { roleColors, roleLabel } from '../../lib/format';
import { Button, ErrorText, Field } from '../../components/ui';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { signUp } = useAuth();
  const c = roleColors(role);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignup() {
    setErrorMessage(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    if (role === 'recruiter' && !companyName.trim()) {
      setErrorMessage('Please enter your company name.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error, needsConfirmation } = await signUp({
      email,
      password,
      fullName,
      role,
      companyName: role === 'recruiter' ? companyName : undefined,
    });
    setLoading(false);
    if (error) {
      setErrorMessage(error);
      return;
    }
    // If email confirmation is off in Supabase, signUp already logged the user in.
    if (needsConfirmation) {
      Alert.alert(
        'Check your email',
        "We've sent you a confirmation link. Once confirmed, log in.",
        [{ text: 'Go to login', onPress: () => navigation.navigate('Login', { role }) }],
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.rolePill, { backgroundColor: c.light }]}>
              <Text style={[styles.rolePillText, { color: c.main }]}>{roleLabel(role)}</Text>
            </View>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              {role === 'recruiter'
                ? 'Start posting jobs and hiring today.'
                : 'Find your next job in minutes.'}
            </Text>
          </View>

          <View style={styles.form}>
            <Field label="Full name" placeholder="Jane Smith" value={fullName} onChangeText={setFullName} />
            {role === 'recruiter' && (
              <Field
                label="Company name"
                placeholder="Acme Ltd"
                value={companyName}
                onChangeText={setCompanyName}
              />
            )}
            <Field
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Password"
              placeholder="Min. 6 characters"
              secureTextEntry
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <ErrorText message={errorMessage} />
          <Button title="Create account" color={c.main} loading={loading} onPress={handleSignup} />

          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Login', { role })}>
            <Text style={styles.link}>
              Already have an account?{' '}
              <Text style={[styles.linkAccent, { color: c.main }]}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  back: { position: 'absolute', top: Spacing.base, left: Spacing.xl, padding: Spacing.xs },
  header: { gap: Spacing.xs },
  rolePill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  rolePillText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  subtitle: { fontSize: Typography.size.base, color: Colors.textSecondary },
  form: { gap: Spacing.base },
  link: { textAlign: 'center', fontSize: Typography.size.sm, color: Colors.textSecondary },
  linkAccent: { fontWeight: Typography.weight.semibold },
});
