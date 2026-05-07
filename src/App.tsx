import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { config as gluestackConfig } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { Provider } from 'react-redux';
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AlertDetailsScreen from './screens/admin/alerts/AlertDetailsScreen';
import RehydrateAuth from './providers/RehydrateAuth';
import Profile from './screens/admin/profile/Profile';
import DashboardScreen from './screens/admin/dashboard/DashboardScreen';
import LoginScreen from './screens/auth/LoginScreen';
import { RootStackParamList } from './screens/types';
import { store } from './store/store';

const Stack = createNativeStackNavigator<RootStackParamList>();

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#22c55e',
        borderLeftWidth: 4,
        backgroundColor: '#0d1526',
        borderWidth: 1,
        borderColor: '#1e293b',
      }}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={{ color: '#e2e8f0', fontSize: 15, fontWeight: '700' }}
      text2Style={{ color: '#94a3b8', fontSize: 13 }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#ef4444',
        borderLeftWidth: 4,
        backgroundColor: '#0d1526',
        borderWidth: 1,
        borderColor: '#1e293b',
      }}
      contentContainerStyle={{ paddingHorizontal: 14 }}
      text1Style={{ color: '#e2e8f0', fontSize: 15, fontWeight: '700' }}
      text2Style={{ color: '#94a3b8', fontSize: 13 }}
    />
  ),
};

export default function App() {
  return (
    <Provider store={store}>
      <GluestackUIProvider config={gluestackConfig}>
        <SafeAreaProvider>
          <RehydrateAuth />
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Profile" component={Profile} />
              <Stack.Screen name="AlertDetails" component={AlertDetailsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
          <Toast config={toastConfig} />
        </SafeAreaProvider>
      </GluestackUIProvider>
    </Provider>
  );
}
