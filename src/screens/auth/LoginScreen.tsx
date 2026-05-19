import { useState } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { login } from '../../features/auth/authSlice';
import { useAppDispatch } from '../../store/hooks';
import { toastError, toastSuccess } from '../../utils/toast';
import { RootStackParamList } from '../types';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const DEFAULT_EMAIL = 'admin@visionguard360.ai';
const DEFAULT_PASSWORD = 'Asdf@123';

const FEATURES = [
  { icon: 'videocam-outline' as const, label: 'Live monitoring' },
  { icon: 'shield-checkmark-outline' as const, label: 'AI safety' },
  { icon: 'notifications-outline' as const, label: 'Smart alerts' },
];

export default function LoginScreen({ navigation }: Readonly<LoginScreenProps>) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const onLogin = async () => {
    const usernameOrEmail = email.trim();
    if (!usernameOrEmail || !password) {
      toastError('Missing credentials', 'Enter username or email and password.');
      return;
    }

    setBusy(true);
    try {
      const data = await dispatch(login({ usernameOrEmail, password })).unwrap();
      toastSuccess('Signed in', 'Welcome to VisionGuard360');
      const navEmail =
        (typeof data.user?.email === 'string' && data.user.email) ||
        (typeof data.user?.username === 'string' && data.user.username) ||
        usernameOrEmail;
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard', params: { email: String(navEmail) } }],
      });
    } catch (e) {
      const message = typeof e === 'string' ? e : 'Login failed';
      toastError('Sign in failed', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#020617', '#0a1628', '#050a14']} style={StyleSheet.absoluteFill} />

      {/* Ambient glow orbs */}
      <View style={[styles.orb, styles.orbCyan]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbViolet]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbTeal]} pointerEvents="none" />

      {/* Top brand strip */}
      <LinearGradient
        colors={['rgba(6, 182, 212, 0.12)', 'transparent']}
        style={[styles.topGlow, { paddingTop: insets.top + 12 }]}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.logoOuter}>
              <LinearGradient colors={['#22d3ee', '#2563eb', '#7c3aed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoGradient}>
                <View style={styles.logoInner}>
                  <Ionicons name="eye" size={36} color="#ffffff" />
                </View>
              </LinearGradient>
              <View style={styles.logoBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#0f172a" />
              </View>
            </View>

            <Text style={styles.brandEyebrow}>VISION GUARD360</Text>
            <Text style={styles.heroSubtitle}>
              Intelligent surveillance for sites, zones, and cameras — in one command center.
            </Text>

            <View style={styles.featureRow}>
              {FEATURES.map((f) => (
                <View key={f.label} style={styles.featureChip}>
                  <Ionicons name={f.icon} size={14} color="#67e8f9" />
                  <Text style={styles.featureText}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Glass card */}
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(56, 189, 248, 0.08)', 'rgba(139, 92, 246, 0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardSheen}
              pointerEvents="none"
            />

            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSubtitle}>Use your organization credentials to continue</Text>

            <Text style={styles.fieldLabel}>Username or email</Text>
            <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
              <View style={styles.inputIconBox}>
                <Feather name="mail" size={18} color={emailFocused ? '#67e8f9' : '#64748b'} />
              </View>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="username"
                style={styles.input}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
              <View style={styles.inputIconBox}>
                <Feather name="lock" size={18} color={passwordFocused ? '#67e8f9' : '#64748b'} />
              </View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••"
                placeholderTextColor="#475569"
                secureTextEntry={!showPassword}
                autoComplete="password"
                style={styles.input}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={10}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <Pressable
              onPress={onLogin}
              disabled={busy}
              style={({ pressed }) => [styles.ctaPressable, pressed && !busy && styles.ctaPressed]}
            >
              <LinearGradient
                colors={busy ? ['#334155', '#1e293b'] : ['#22d3ee', '#3b82f6', '#6366f1']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.ctaGradient}
              >
                {busy ? (
                  <ActivityIndicator color="#e2e8f0" />
                ) : (
                  <View style={styles.ctaInner}>
                    <Text style={styles.ctaText}>Sign in</Text>
                    <Ionicons name="arrow-forward" size={20} color="#0f172a" />
                  </View>
                )}
              </LinearGradient>
            </Pressable>

          </View>

          <Text style={styles.footer}>VisionGuard360 · Enterprise monitoring</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbCyan: {
    width: 280,
    height: 280,
    top: -80,
    right: -100,
    backgroundColor: 'rgba(34, 211, 238, 0.14)',
  },
  orbViolet: {
    width: 220,
    height: 220,
    bottom: 120,
    left: -90,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  orbTeal: {
    width: 160,
    height: 160,
    top: '42%',
    right: -40,
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoOuter: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: 28,
    padding: 2,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  logoInner: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#67e8f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  brandEyebrow: {
    color: '#67e8f9',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  titleMain: {
    fontSize: 36,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -1,
  },
  titleAccent: {
    fontSize: 36,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: -1,
  },
  heroSubtitle: {
    marginTop: 12,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  featureText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 26,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  cardSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 22,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.45)',
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    marginBottom: 18,
    paddingRight: 12,
  },
  inputWrapFocused: {
    borderColor: 'rgba(34, 211, 238, 0.55)',
    backgroundColor: 'rgba(8, 47, 73, 0.35)',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  inputIconBox: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 16,
    paddingVertical: 14,
    paddingRight: 4,
  },
  eyeBtn: {
    padding: 6,
  },
  ctaPressable: {
    marginTop: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  secureText: {
    fontSize: 12,
    color: '#475569',
  },
  footer: {
    textAlign: 'center',
    color: '#334155',
    fontSize: 12,
    marginTop: 24,
    letterSpacing: 0.5,
  },
});
