import { CommonActions } from '@react-navigation/native';
import { clearAlerts } from '../../../features/alerts/alertsSlice';
import { logout } from '../../../features/auth/authSlice';
import { clearCameras } from '../../../features/cameras/camerasSlice';
import { clearSites } from '../../../features/sites/sitesSlice';
import { useAppDispatch } from '../../../store/hooks';
import { Text, VStack } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppTabId } from '../../../components/layout/AppFooter';
import AppShell from '../../../components/layout/AppShell';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function Profile({ navigation, route }: Readonly<Props>) {
  const dispatch = useAppDispatch();
  const email = route.params.email;

  const onTabChange = (tab: AppTabId) => {
    if (tab === 'More') {
      return;
    }
    navigation.navigate('Dashboard', { email, initialTab: tab });
  };

  return (
    <AppShell
      activeTab="More"
      onTabChange={onTabChange}
      headerProps={{
        profileMenuHighlightProfile: true,
        onMenuProfile: () => {},
        onMenuLogout: () => {
          dispatch(clearAlerts());
          dispatch(clearCameras());
          dispatch(clearSites());
          dispatch(logout());
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        },
      }}
    >
      <VStack pt="$4" space="md">
        <Text color="#fff" fontSize={24} fontWeight="$bold">
          Profile
        </Text>
        <Text color="#94a3b8">Signed in as {email}</Text>
      </VStack>
    </AppShell>
  );
}
