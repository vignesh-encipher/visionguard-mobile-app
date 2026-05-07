import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Pressable, Spinner, Text, VStack } from '@gluestack-ui/themed';
import { useEffect } from 'react';
import { fetchAlerts } from '../../../features/alerts/alertsSlice';
import type { AlertDto } from '../../../features/alerts/alerts.types';
import type { RootStackParamList } from '../../types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';

type AlertSeverity = 'High' | 'Critical' | 'Medium';
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

function severityColors(severity: AlertSeverity) {
  if (severity === 'Critical') {
    return { bg: 'rgba(127, 29, 29, 0.7)', color: '#f87171' };
  }
  if (severity === 'High') {
    return { bg: 'rgba(124, 45, 18, 0.68)', color: '#fb923c' };
  }
  return { bg: 'rgba(3, 105, 161, 0.58)', color: '#38bdf8' };
}

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

function severityFromPriority(alert: AlertDto): AlertSeverity {
  const priority = (alert.priority ?? '').toUpperCase();
  if (priority === 'CRITICAL') return 'Critical';
  if (priority === 'HIGH') return 'High';
  return 'Medium';
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
      <Box w={140} h={16} borderRadius="$full" bg="rgba(148, 163, 184, 0.22)" />
      <Box w={220} h={14} borderRadius="$full" bg="rgba(71, 85, 105, 0.35)" mt="$2" />
      <HStack mt="$2" justifyContent="space-between">
        <Box w={120} h={14} borderRadius="$full" bg="rgba(100, 116, 139, 0.3)" />
        <Box w={120} h={14} borderRadius="$full" bg="rgba(100, 116, 139, 0.3)" />
      </HStack>
      <HStack mt="$3" justifyContent="space-between" alignItems="center">
        <Box w={120} h={16} borderRadius="$full" bg="rgba(100, 116, 139, 0.3)" />
        <HStack space="sm">
          <Box w={64} h={24} borderRadius="$full" bg="rgba(30, 41, 59, 0.75)" />
          <Box w={64} h={24} borderRadius="$full" bg="rgba(30, 41, 59, 0.75)" />
        </HStack>
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
        const severityValue = severityFromPriority(item);
        const statusValue = statusFromWorkflow(item);
        const severity = severityColors(severityValue);
        const statusColor = statusColors(statusValue);

        return (
          <Pressable key={item.id} onPress={() => navigation.navigate('AlertDetails', { alertId: item.id })}>
            <Box
              px="$4"
              py="$4"
              borderRadius="$2xl"
              borderWidth={1}
              borderColor="rgba(56, 189, 248, 0.22)"
              bg="#040d22"
            >
              <VStack flex={1} pr="$2">
                <Text color="#e2e8f0" fontSize={16} fontWeight="$bold">
                  {titleFromModelType(item)}
                </Text>
                <Text color="#7b93b5" fontSize={14} mt="$2">
                  {locationFromAlert(item)}
                </Text>
              </VStack>

              <HStack mt="$2" justifyContent="space-between">
                <VStack flex={1} pr="$3">
                  <Text color="#7b93b5" fontSize={12}>
                    Violator:{' '}
                    <Text color="#e2e8f0" fontSize={12} fontWeight="$bold">
                      {item.personName ?? item.personId ?? 'Unknown'}
                    </Text>
                  </Text>
                </VStack>
                <VStack flex={1}>
                  <Text color="#7b93b5" fontSize={12}>
                    Chosen:{' '}
                    <Text color="#e2e8f0" fontSize={12} fontWeight="$bold">
                      {item.currentTimeLine?.userName ?? 'SYSTEM'}
                    </Text>
                  </Text>
                </VStack>
              </HStack>

              <HStack mt="$2" justifyContent="space-between" alignItems="center">
                <HStack flex={1} pr="$2" alignItems="center" space="xs">
                  <Ionicons name="time-outline" size={18} color="#7b93b5" />
                  <Text color="#d1d9e8" fontSize={12} fontWeight="$medium">
                    {formatDate(item.receivedAt)}
                  </Text>
                </HStack>
                <HStack space="sm">
                  <Box px="$3" py="$1" borderRadius="$full" bg={severity.bg}>
                    <Text color={severity.color} fontSize={12} fontWeight="$bold">
                      {severityValue}
                    </Text>
                  </Box>
                  <Box px="$3" py="$1" borderRadius="$full" bg={statusColor.bg}>
                    <Text color={statusColor.color} fontSize={12} fontWeight="$bold">
                      {statusValue}
                    </Text>
                  </Box>
                </HStack>
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
