import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { config as gluestackConfig } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import RehydrateAuth from './providers/RehydrateAuth';
import Profile from './screens/admin/profile/Profile';
import DashboardScreen from './screens/admin/dashboard/DashboardScreen';
import LoginScreen from './screens/auth/LoginScreen';
import { RootStackParamList } from './screens/types';
import { store } from './store/store';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
            </Stack.Navigator>
          </NavigationContainer>
          <Toast />
        </SafeAreaProvider>
      </GluestackUIProvider>
    </Provider>
  );
}
