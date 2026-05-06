import { useState } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Heading, Text, VStack } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { login } from '../../features/auth/authSlice';
import { useAppDispatch } from '../../store/hooks';
import { toastError, toastSuccess } from '../../utils/toast';
import { RootStackParamList } from '../types';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const DEFAULT_EMAIL = 'admin@visionguard360.ai';
const DEFAULT_PASSWORD = 'Asdf@123';

export default function LoginScreen({ navigation }: Readonly<LoginScreenProps>) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

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
    <LinearGradient colors={['#030b1e', '#04152f', '#060c26']} style={styles.screen}>
      <View style={styles.panel}>
        <VStack space="2xl" style={styles.contentStack}>
          <View style={styles.logoWrap}>
            <LinearGradient colors={['#03b7ff', '#0c7cf8']} style={styles.logoRing}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#ffffff" />
            </LinearGradient>
          </View>

          <VStack space="sm" style={styles.titleWrap}>
            <Heading style={styles.title}>
              VisionGuard<Text style={styles.titleAccent}>360</Text>
            </Heading>
            <Text style={styles.subtitle}>Secure access to real-time intelligent surveillance</Text>
          </VStack>

          <VStack space="md">
            <View style={styles.inputRow}>
              <Feather name="mail" size={18} color="#7f95b5" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Username or Email"
                placeholderTextColor="#7489aa"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.inputRow}>
              <Feather name="lock" size={18} color="#7f95b5" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#7489aa"
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <Pressable onPress={() => setShowPassword((value) => !value)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8fa8cb"
                />
              </Pressable>
            </View>
          </VStack>

          <Pressable
            onPress={onLogin}
            style={[styles.loginButton, busy && styles.loginButtonDisabled]}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#041426" />
            ) : (
              <Text style={styles.loginText}>Login</Text>
            )}
          </Pressable>
        </VStack>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  panel: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(46, 86, 138, 0.35)',
    backgroundColor: 'rgba(8, 16, 40, 0.84)',
    paddingHorizontal: 22,
    paddingVertical: 30,
  },
  contentStack: {
    width: '100%',
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14b0ff',
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  titleWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: '#06abff',
  },
  subtitle: {
    textAlign: 'center',
    color: '#8295b3',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 330,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(87, 112, 151, 0.35)',
    backgroundColor: 'rgba(17, 30, 61, 0.52)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  input: {
    flex: 1,
    color: '#c8d7ef',
    fontSize: 16,
  },
  loginButton: {
    marginTop: 10,
    backgroundColor: '#04adff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.85,
  },
  loginText: {
    color: '#041426',
    fontSize: 18,
    fontWeight: '700',
  },
});
