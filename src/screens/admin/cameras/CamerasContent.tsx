import { Box, HStack, Spinner, Text, VStack } from '@gluestack-ui/themed';
import { useEffect } from 'react';
import { fetchMonitorCameras } from '../../../features/cameras/camerasSlice';
import type { MonitorCameraDto } from '../../../features/cameras/cameras.types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';

export type CamerasContentProps = {
  /** Fetch + render only while Cameras tab is visible. */
  isActive: boolean;
  /** Changes whenever user taps a dashboard tab to force refresh. */
  reloadKey: number;
  /** Changes when main scroll reaches end to load next page. */
  loadMoreKey: number;
};

const EMPTY_LABEL = 'No analytics';
const SKELETON_COUNT = 5;

const labelStyles: Record<
  string,
  {
    bg: string;
    color: string;
  }
> = {
  VEST: { bg: 'rgba(6, 78, 59, 0.65)', color: '#34d399' },
  HELMET: { bg: 'rgba(30, 64, 175, 0.6)', color: '#60a5fa' },
  MASK: { bg: 'rgba(8, 145, 178, 0.55)', color: '#22d3ee' },
  ZONE: { bg: 'rgba(124, 45, 18, 0.55)', color: '#fb923c' },
  HAIRNET: { bg: 'rgba(88, 28, 135, 0.55)', color: '#c084fc' },
  SHOE: { bg: 'rgba(113, 63, 18, 0.65)', color: '#facc15' },
  GLOVES: { bg: 'rgba(127, 29, 29, 0.65)', color: '#fb7185' },
  FIRE: { bg: 'rgba(127, 29, 29, 0.55)', color: '#f87171' },
  'OIL SPILL': { bg: 'rgba(113, 63, 18, 0.6)', color: '#eab308' },
  'No analytics': { bg: 'rgba(15, 23, 42, 0.7)', color: '#cbd5e1' },
};

function cameraSubtitle(cam: MonitorCameraDto): string {
  const parts = [cam.siteName, cam.zoneName].filter(Boolean);
  return parts.join(' - ') || cam.ip || '-';
}

function cameraIsOnline(cam: MonitorCameraDto): boolean {
  if (typeof cam.cameraOnline === 'boolean') return cam.cameraOnline;
  return (cam.status ?? '').toUpperCase() === 'LIVE';
}

function cameraStatusLabel(cam: MonitorCameraDto): 'Online' | 'Disabled' {
  return cameraIsOnline(cam) ? 'Online' : 'Disabled';
}

function cameraModeLabel(cam: MonitorCameraDto): string {
  const mode = cam.optimizationType?.trim();
  return mode ? mode.split('_').join(' ') : 'Standard';
}

function cameraLabels(cam: MonitorCameraDto): string[] {
  if (Array.isArray(cam.modelConfigs) && cam.modelConfigs.length > 0) {
    return cam.modelConfigs
      .map((item) => {
        if (typeof item === 'string') return item.toUpperCase();
        if (item && typeof item === 'object') {
          const modelName = (item as { modelName?: unknown }).modelName;
          if (typeof modelName === 'string' && modelName.trim()) return modelName.trim().toUpperCase();
        }
        return null;
      })
      .filter((v): v is string => Boolean(v));
  }
  return [EMPTY_LABEL];
}

function statusColors(status: 'Online' | 'Disabled') {
  if (status === 'Online') {
    return { bg: 'rgba(6, 78, 59, 0.7)', color: '#22c55e' };
  }
  return { bg: 'rgba(127, 29, 29, 0.45)', color: '#ef4444' };
}

function CameraCardSkeleton({ idx }: Readonly<{ idx: number }>) {
  return (
    <Box
      key={`camera-skeleton-${idx}`}
      px="$4"
      py="$4"
      borderRadius="$2xl"
      borderWidth={1}
      borderColor="rgba(56, 189, 248, 0.12)"
      bg="#040d22"
    >
      <HStack justifyContent="space-between" alignItems="center">
        <Box w={120} h={16} borderRadius="$full" bg="rgba(148, 163, 184, 0.22)" />
        <Box w={72} h={24} borderRadius="$full" bg="rgba(148, 163, 184, 0.2)" />
      </HStack>

      <Box w={180} h={14} borderRadius="$full" bg="rgba(71, 85, 105, 0.35)" mt="$2" />

      <HStack mt="$3" flexWrap="wrap">
        {Array.from({ length: 3 }).map((_, labelIndex) => (
          <Box
            key={`camera-skeleton-chip-${idx}-${labelIndex}`}
            w={56}
            h={24}
            borderRadius="$md"
            bg="rgba(15, 23, 42, 0.85)"
            mr="$2"
            mb="$2"
          />
        ))}
      </HStack>

      <HStack justifyContent="space-between" alignItems="center" mt="$1">
        <Box w={150} h={24} borderRadius="$full" bg="rgba(30, 41, 59, 0.75)" />
        <HStack alignItems="center" space="sm">
          <Box w={46} h={24} borderRadius="$full" bg="rgba(30, 41, 59, 0.75)" />
          <Box w={28} h={16} borderRadius="$full" bg="rgba(100, 116, 139, 0.35)" />
        </HStack>
      </HStack>
    </Box>
  );
}

export default function CamerasContent({ isActive, reloadKey, loadMoreKey }: Readonly<CamerasContentProps>) {
  const dispatch = useAppDispatch();
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

  return (
    <VStack mt="$2" mb="$4" space="md">
      <Text color="$white" fontSize={28} fontWeight="$bold" mb="$2">
        Cameras
      </Text>
      {error ? (
        <Text color="#ef4444" fontSize={13} mb="$2">
          {error}
        </Text>
      ) : null}

      {loading && items.length === 0
        ? Array.from({ length: SKELETON_COUNT }).map((_, idx) => <CameraCardSkeleton key={idx} idx={idx} />)
        : null}

      {!loading && items.length === 0 ? (
        <Text color="#64748b" py="$8" textAlign="center">
          No cameras found.
        </Text>
      ) : null}

      {items.map((camera) => {
        const statusLabel = cameraStatusLabel(camera);
        const status = statusColors(statusLabel);
        const enabled = Boolean(camera.active);
        const labels = cameraLabels(camera);
        const cardOpacity = enabled ? 1 : 0.55;

        return (
          <Box
            key={camera.id}
            px="$4"
            py="$4"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="rgba(56, 189, 248, 0.22)"
            bg="#040d22"
            opacity={cardOpacity}
          >
            <HStack justifyContent="space-between" alignItems="center">
              <Text color="#e2e8f0" fontSize={16} fontWeight="$bold">
                {camera.name}
              </Text>
              <Box px="$3" py="$1" borderRadius="$full" bg={status.bg}>
                <Text color={status.color} fontSize={12} fontWeight="$bold">
                  {statusLabel}
                </Text>
              </Box>
            </HStack>

            <Text color="#7b93b5" fontSize={14} mt="$1">
              {cameraSubtitle(camera)}
            </Text>

            <HStack mt="$2" flexWrap="wrap">
              {labels.map((label) => {
                const style = labelStyles[label] ?? { bg: 'rgba(15, 23, 42, 0.7)', color: '#cbd5e1' };
                return (
                  <Box key={`${camera.id}-${label}`} px="$2" py="$1" borderRadius="$md" bg={style.bg} mr="$2" mb="$2">
                    <Text color={style.color} fontSize={12} fontWeight="$bold">
                      {label}
                    </Text>
                  </Box>
                );
              })}
            </HStack>

            <HStack justifyContent="space-between" alignItems="center">
              <Box px="$3" py="$1" borderRadius="$full" bg={enabled ? 'rgba(6, 78, 59, 0.6)' : 'rgba(67, 56, 202, 0.35)'}>
                <Text color={enabled ? '#22c55e' : '#a5b4fc'} fontSize={12} fontWeight="$bold">
                  {cameraModeLabel(camera)}
                </Text>
              </Box>

              <HStack alignItems="center" space="sm">
                <HStack
                  w={46}
                  h={24}
                  px="$1"
                  borderRadius="$full"
                  alignItems="center"
                  justifyContent={enabled ? 'flex-end' : 'flex-start'}
                  bg={enabled ? '#0ea5e9' : '#10203d'}
                >
                  <Box w={18} h={18} borderRadius="$full" bg={enabled ? '#64748b' : '#0b1220'} />
                </HStack>
                <Text color={enabled ? '#22c55e' : '#ef4444'} fontSize={16} fontWeight="$bold">
                  {enabled ? 'On' : 'Off'}
                </Text>
              </HStack>
            </HStack>
          </Box>
        );
      })}

      {isLoadingMore ? (
        <HStack py="$4" justifyContent="center" alignItems="center" space="sm">
          <Spinner size="small" color="#38bdf8" />
          <Text color="#94a3b8" fontSize={12}>
            Loading more...
          </Text>
        </HStack>
      ) : null}
    </VStack>
  );
}
