import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { clearAlerts } from '../../../features/alerts/alertsSlice';
import { logout } from '../../../features/auth/authSlice';
import { clearCameras } from '../../../features/cameras/camerasSlice';
import { clearSites } from '../../../features/sites/sitesSlice';
import { useAppDispatch } from '../../../store/hooks';
import { Box, Text } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
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
  const [tabReloadKey, setTabReloadKey] = useState(0);
  const [liveLoadMoreKey, setLiveLoadMoreKey] = useState(0);
  const [alertsLoadMoreKey, setAlertsLoadMoreKey] = useState(0);
  const [camerasLoadMoreKey, setCamerasLoadMoreKey] = useState(0);
  const lastEndReachedMsRef = useRef(0);
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
      <DashboardHomeContent isActive={activeTab === 'Home'} reloadKey={tabReloadKey} />
    ) : activeTab === 'Live' ? (
      <LiveCameraContent
        isActive={activeTab === 'Live'}
        reloadKey={tabReloadKey}
        loadMoreKey={liveLoadMoreKey}
      />
    ) : activeTab === 'Alerts' ? (
      <AlertsContent
        isActive={activeTab === 'Alerts'}
        reloadKey={tabReloadKey}
        loadMoreKey={alertsLoadMoreKey}
      />
    ) : activeTab === 'Cameras' ? (
      <CamerasContent
        isActive={activeTab === 'Cameras'}
        reloadKey={tabReloadKey}
        loadMoreKey={camerasLoadMoreKey}
      />
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
        setTabReloadKey((v) => v + 1);
        setActiveTab(tab);
      }}
      headerProps={{
        onMenuProfile: () => navigation.navigate('Profile', { email }),
        onMenuLogout: () => {
          dispatch(clearAlerts());
          dispatch(clearCameras());
          dispatch(clearSites());
          dispatch(logout());
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        },
      }}
      onMainEndReached={() => {
        const now = Date.now();
        if (now - lastEndReachedMsRef.current < 700) return;
        lastEndReachedMsRef.current = now;

        if (activeTab === 'Live') {
          setLiveLoadMoreKey((v) => v + 1);
        } else if (activeTab === 'Alerts') {
          setAlertsLoadMoreKey((v) => v + 1);
        } else if (activeTab === 'Cameras') {
          setCamerasLoadMoreKey((v) => v + 1);
        }
      }}
    >
      {body}
    </AppShell>
  );
}
