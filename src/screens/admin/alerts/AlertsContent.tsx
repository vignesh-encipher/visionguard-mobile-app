import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Pressable, Spinner, Text, VStack } from '@gluestack-ui/themed';
import { useEffect } from 'react';
import { AlertThumbnail } from '../../../features/alerts/AlertThumbnail';
import { fetchAlerts } from '../../../features/alerts/alertsSlice';
import type { AlertDto } from '../../../features/alerts/alerts.types';
import type { RootStackParamList } from '../../types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';

type AlertStatus = 'New' | 'Picked' | 'Resolved';

export type AlertsContentProps = {
  /** Fetch + render only while Alerts tab is visible. */
  isActive: boolean;
  /** Changes whenever user taps a dashboard tab to force refresh. */
  reloadKey: number;
  /** Changes when main scroll reaches end to load next page. */
  loadMoreKey: number;
};

const SKELETON_COUNT = 5;

function statusColors(status: AlertStatus) {
  if (status === 'Resolved') {
    return { bg: 'rgba(6, 78, 59, 0.7)', color: '#22c55e' };
  }
  if (status === 'Picked') {
    return { bg: 'rgba(124, 45, 18, 0.68)', color: '#fb923c' };
  }
  return { bg: 'rgba(3, 105, 161, 0.58)', color: '#38bdf8' };
}

function titleFromModelType(alert: AlertDto): string {
  const modelType = alert.modelType?.trim();
  if (!modelType) return 'Alert';
  return modelType
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function locationFromAlert(alert: AlertDto): string {
  return [alert.siteName, alert.zoneName, alert.cameraName].filter(Boolean).join(' · ') || '-';
}

function statusFromWorkflow(alert: AlertDto): AlertStatus {
  const wf = (alert.currentTimeLine?.workFlowStatus ?? '').toUpperCase();
  if (wf === 'RESOLVED') return 'Resolved';
  if (wf === 'PICKED' || wf === 'IN_PROGRESS') return 'Picked';
  return 'New';
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function AlertCardSkeleton({ idx }: Readonly<{ idx: number }>) {
  return (
    <Box
      key={`alert-skeleton-${idx}`}
      px="$4"
      py="$4"
      borderRadius="$2xl"
      borderWidth={1}
      borderColor="rgba(56, 189, 248, 0.12)"
      bg="#040d22"
    >
      <HStack space="md" alignItems="flex-start">
        <Box w={72} h={72} borderRadius={10} bg="rgba(30, 41, 59, 0.75)" />
        <VStack flex={1} space="sm">
          <Box w="70%" h={16} borderRadius="$full" bg="rgba(148, 163, 184, 0.22)" />
          <Box w="90%" h={14} borderRadius="$full" bg="rgba(71, 85, 105, 0.35)" />
          <HStack mt="$1" justifyContent="space-between" alignItems="center">
            <Box w="55%" h={14} borderRadius="$full" bg="rgba(100, 116, 139, 0.3)" />
            <Box w={64} h={24} borderRadius="$full" bg="rgba(30, 41, 59, 0.75)" />
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
}

export default function AlertsContent({ isActive, reloadKey, loadMoreKey }: Readonly<AlertsContentProps>) {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const userId = useAppSelector((s) => s.auth.user?.id ?? null);
  const { items, status, error, pageNumber, hasNext, isLoadingMore } = useAppSelector((s) => s.alerts);

  useEffect(() => {
    if (!isActive) return;
    void dispatch(
      fetchAlerts({
        page: 0,
        size: 15,
        searchString: '',
        userId,
        append: false,
      }),
    );
  }, [dispatch, isActive, userId, reloadKey]);

  useEffect(() => {
    if (!isActive || !hasNext || status === 'loading' || isLoadingMore) return;
    void dispatch(
      fetchAlerts({
        page: pageNumber + 1,
        size: 15,
        searchString: '',
        userId,
        append: true,
      }),
    );
  }, [dispatch, isActive, userId, loadMoreKey, hasNext, pageNumber, status, isLoadingMore]);

  const loading = status === 'loading';

  return (
    <VStack mt="$2" mb="$4" space="md">
      <Text color="$white" fontSize={28} fontWeight="$bold" mb="$2">
        Alerts
      </Text>
      {error ? (
        <Text color="#ef4444" fontSize={13} mb="$2">
          {error}
        </Text>
      ) : null}

      {loading && items.length === 0
        ? Array.from({ length: SKELETON_COUNT }).map((_, idx) => <AlertCardSkeleton key={idx} idx={idx} />)
        : null}

      {!loading && items.length === 0 ? (
        <Text color="#64748b" py="$8" textAlign="center">
          No alerts found.
        </Text>
      ) : null}

      {items.map((item) => {
        const statusValue = statusFromWorkflow(item);
        const statusColor = statusColors(statusValue);

        return (
          <Pressable
            key={item.id}
            onPress={() =>
              navigation.navigate('AlertDetails', { alertId: item.id, returnTo: 'alerts' })
            }
          >
            <Box
              px="$4"
              py="$4"
              borderRadius="$2xl"
              borderWidth={1}
              borderColor="rgba(56, 189, 248, 0.22)"
              bg="#040d22"
            >
              <HStack space="md" alignItems="flex-start">
                <AlertThumbnail alert={item} />
                <VStack flex={1} space="sm">
                  <Text color="#e2e8f0" fontSize={16} fontWeight="$bold">
                    {titleFromModelType(item)}
                  </Text>
                  <Text color="#7b93b5" fontSize={14}>
                    {locationFromAlert(item)}
                  </Text>
                  <HStack justifyContent="space-between" alignItems="center" mt="$1">
                    <HStack flex={1} pr="$2" alignItems="center" space="xs">
                      <Ionicons name="time-outline" size={16} color="#7b93b5" />
                      <Text color="#d1d9e8" fontSize={12} fontWeight="$medium" numberOfLines={1}>
                        {formatDate(item.receivedAt)}
                      </Text>
                    </HStack>
                    <Box px="$3" py="$1" borderRadius="$full" bg={statusColor.bg} flexShrink={0}>
                      <Text color={statusColor.color} fontSize={12} fontWeight="$bold">
                        {statusValue}
                      </Text>
                    </Box>
                  </HStack>
                </VStack>
              </HStack>
            </Box>
          </Pressable>
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
