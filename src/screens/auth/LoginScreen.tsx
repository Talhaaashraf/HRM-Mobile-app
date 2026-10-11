import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { signIn } = useAuth();
  const c = roleColors(role);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin() {
    setErrorMessage(null);
    if (!email || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const error = await signIn(email, password, role);
    setLoading(false);
    // On success AuthContext updates the session → AppNavigator switches to the main tabs.
    if (error) setErrorMessage(error);
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
              <Ionicons
                name={role === 'recruiter' ? 'briefcase' : 'search'}
                size={14}
                color={c.main}
              />
              <Text style={[styles.rolePillText, { color: c.main }]}>
                {roleLabel(role)} login
              </Text>
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your {roleLabel(role)} account</Text>
          </View>

          <View style={styles.form}>
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
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[styles.forgotLink, { color: c.main }]}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <ErrorText message={errorMessage} />
          <Button title="Log in" color={c.main} loading={loading} onPress={handleLogin} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Signup', { role })}
          >
            <Text style={styles.link}>
              Don't have an account?{' '}
              <Text style={[styles.linkAccent, { color: c.main }]}>Sign up</Text>
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
    paddingBottom: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  back: { position: 'absolute', top: Spacing.base, left: Spacing.xl, padding: Spacing.xs },
  header: { gap: Spacing.xs },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
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
  forgotLink: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    textAlign: 'right',
  },
  link: { textAlign: 'center', fontSize: Typography.size.sm, color: Colors.textSecondary },
  linkAccent: { fontWeight: Typography.weight.semibold },
});
