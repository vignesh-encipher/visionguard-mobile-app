import { Box, HStack, Spinner, Text, VStack } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { fetchMonitorCameras } from '../../../features/cameras/camerasSlice';
import type { MonitorCameraDto } from '../../../features/cameras/cameras.types';
import { RootStackParamList } from '../../types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import CameraStreamCard from './CameraStreamCard';
import CameraStreamSkeleton from './CameraStreamSkeleton';
import { cameraIsLive, cameraSubtitle, pickStreamUrl } from './cameraStreamUtils';

const SKELETON_COUNT = 5;

export type LiveCameraContentProps = {
  /** Fetch + render streams only while the Live tab is visible. */
  isActive: boolean;
  /** Changes whenever user taps a dashboard tab to force refresh. */
  reloadKey: number;
  /** Changes when main scroll reaches end to load next page. */
  loadMoreKey: number;
};

export default function LiveCameraContent({ isActive, reloadKey, loadMoreKey }: Readonly<LiveCameraContentProps>) {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const selectedSiteId = useAppSelector((s) => s.sites.selectedSiteId);
  const { items, status, error, pageNumber, hasNext, isLoadingMore } = useAppSelector((s) => s.cameras);

  useEffect(() => {
    if (!isActive) return;
    void dispatch(
      fetchMonitorCameras({
        page: 0,
        size: 15,
        searchString: '',
        active: true,
        siteId: selectedSiteId,
        append: false,
      }),
    );
  }, [dispatch, isActive, selectedSiteId, reloadKey]);

  useEffect(() => {
    if (!isActive || !hasNext || status === 'loading' || isLoadingMore) return;
    void dispatch(
      fetchMonitorCameras({
        page: pageNumber + 1,
        size: 15,
        searchString: '',
        active: true,
        siteId: selectedSiteId,
        append: true,
      }),
    );
  }, [dispatch, isActive, selectedSiteId, loadMoreKey, hasNext, pageNumber, status, isLoadingMore]);

  const loading = status === 'loading';
  const showSkeletonList = loading && items.length === 0;

  const openCameraDetails = (cam: MonitorCameraDto) => {
    navigation.navigate('CameraDetails', { camera: cam });
  };

  return (
    <VStack pt="$2" space="sm">
      <Text color="$white" fontSize={28} fontWeight="$bold" mb="$2">
        Live cameras
      </Text>
      {error ? (
        <Text color="#ef4444" fontSize={13} mb="$2">
          {error}
        </Text>
      ) : null}
      <Box>
        {showSkeletonList
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <CameraStreamSkeleton key={`sk-${i}`} />)
          : null}

        {!showSkeletonList
          ? items.map((cam) => (
              <CameraStreamCard
                key={cam.id}
                title={cam.name}
                subtitle={cameraSubtitle(cam)}
                isLive={cameraIsLive(cam)}
                streamUrl={pickStreamUrl(cam)}
                isStreamActive={isActive}
                onPress={() => openCameraDetails(cam)}
              />
            ))
          : null}

        {!loading && items.length === 0 ? (
          <Text color="#64748b" py="$8" textAlign="center">
            No cameras found.
          </Text>
        ) : null}

        {isLoadingMore ? (
          <HStack py="$4" justifyContent="center" alignItems="center" space="sm">
            <Spinner size="small" color="#38bdf8" />
            <Text color="#94a3b8" fontSize={12}>
              Loading more...
            </Text>
          </HStack>
        ) : null}
      </Box>
    </VStack>
  );
}
