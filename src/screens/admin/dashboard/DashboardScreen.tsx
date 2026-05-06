import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { logout } from '../../../features/auth/authSlice';
import { clearCameras } from '../../../features/cameras/camerasSlice';
import { clearSites } from '../../../features/sites/sitesSlice';
import { useAppDispatch } from '../../../store/hooks';
import { Box, Text } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import type { AppTabId } from '../../../components/layout/AppFooter';
import AppShell from '../../../components/layout/AppShell';
import { RootStackParamList } from '../../types';
import AlertsContent from '../alerts/AlertsContent';
import CamerasContent from '../cameras/CamerasContent';
import LiveCameraContent from '../livecamera/LiveCameraContent';
import DashboardHomeContent from './DashboardHomeContent';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

function Placeholder({ title }: { title: string }) {
  return (
    <Box py="$10" alignItems="center">
      <Text color="#94a3b8">{title}</Text>
    </Box>
  );
}

export default function DashboardScreen({ navigation, route }: Readonly<Props>) {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<AppTabId>('Home');
  const email = route.params.email;

  useFocusEffect(
    useCallback(() => {
      const next = route.params.initialTab;
      if (next && next !== 'More') {
        setActiveTab(next);
      }
    }, [route.params.initialTab]),
  );

  const body =
    activeTab === 'Home' ? (
      <DashboardHomeContent />
    ) : activeTab === 'Live' ? (
      <LiveCameraContent isActive={activeTab === 'Live'} />
    ) : activeTab === 'Alerts' ? (
      <AlertsContent />
    ) : activeTab === 'Cameras' ? (
      <CamerasContent />
    ) : (
      <Placeholder title="More" />
    );

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={(tab) => {
        if (tab === 'More') {
          navigation.navigate('Profile', { email });
          return;
        }
        setActiveTab(tab);
      }}
      headerProps={{
        onMenuProfile: () => navigation.navigate('Profile', { email }),
        onMenuLogout: () => {
          dispatch(clearCameras());
          dispatch(clearSites());
          dispatch(logout());
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        },
      }}
    >
      {body}
    </AppShell>
  );
}
