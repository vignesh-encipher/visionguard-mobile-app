import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Pressable, ScrollView, Text, VStack } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { fetchAlertById } from '../../../features/alerts/alertsSlice';
import { RootStackParamList } from '../../types';
import type { AlertTimelineItem } from '../../../features/alerts/alerts.types';
import AppHeader, { APP_HORIZONTAL_PADDING } from '../../../components/layout/AppHeader';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'AlertDetails'>;

const BG = '#050a14';
const CARD = '#081a36';
const CARD_BORDER = 'rgba(56, 189, 248, 0.25)';
const MUTED = '#8aa0bd';
const ACCENT = '#3b82f6';

function asLabel(value?: string | null): string {
  return value && value.trim().length > 0 ? value : '-';
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function titleFromModel(modelType?: string | null): string {
  return asLabel(modelType);
}

function statusFromWorkflow(workflow?: string | null): 'NEW' | 'PICKED' | 'RESOLVED' {
  const status = (workflow ?? '').toUpperCase();
  if (status === 'RESOLVED') return 'RESOLVED';
  if (status === 'PICKED' || status === 'IN_PROGRESS') return 'PICKED';
  return 'NEW';
}

function statusColors(status: 'NEW' | 'PICKED' | 'RESOLVED') {
  if (status === 'RESOLVED') return { bg: 'rgba(34, 197, 94, 0.16)', border: '#22c55e', text: '#22c55e' };
  if (status === 'PICKED') return { bg: 'rgba(234, 179, 8, 0.14)', border: '#eab308', text: '#eab308' };
  return { bg: 'rgba(59, 130, 246, 0.14)', border: '#3b82f6', text: '#3b82f6' };
}

function TimelineRow({ item, isLast }: Readonly<{ item: AlertTimelineItem; isLast: boolean }>) {
  const status = statusFromWorkflow(item.workFlowStatus);
  const style = statusColors(status);
  const userName = asLabel(item.userName);
  const comment = asLabel(item.comment);

  return (
    <HStack alignItems="flex-start" space="sm">
      <VStack alignItems="center">
        <Box w={16} h={16} borderRadius="$full" borderWidth={2} borderColor={style.border} />
        {!isLast ? <Box w={2} flex={1} bg="rgba(71, 85, 105, 0.45)" my="$1" /> : null}
      </VStack>
      <VStack flex={1} pb="$4">
        <Text color="#e2e8f0" fontSize={12} fontWeight="$bold">
          {userName}
        </Text>
        <Text color={MUTED} fontSize={12} mt="$1">
          {comment}
        </Text>
        <Box
          mt="$2"
          alignSelf="flex-start"
          px="$3"
          py="$1"
          borderRadius="$md"
          borderWidth={1}
          borderColor={style.border}
          bg={style.bg}
        >
          <Text color={style.text} fontSize={12} fontWeight="$bold">
            {status}
          </Text>
        </Box>
      </VStack>
    </HStack>
  );
}

function AlertDetailsSkeleton() {
  return (
    <VStack space="md">
      <Box bg={CARD} borderRadius="$2xl" borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
        <HStack justifyContent="space-between" alignItems="center" mb="$3">
          <Box h={16} w="45%" bg="rgba(148, 163, 184, 0.22)" borderRadius="$full" />
          <Box h={24} w={64} bg="rgba(59, 130, 246, 0.2)" borderRadius="$lg" />
        </HStack>
        <Box h={12} w="72%" bg="rgba(100, 116, 139, 0.25)" borderRadius="$full" mb="$2" />
        <Box h={12} w="52%" bg="rgba(100, 116, 139, 0.25)" borderRadius="$full" />
      </Box>

      <Box bg={CARD} borderRadius="$2xl" borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
        <Box h={16} w="48%" bg="rgba(148, 163, 184, 0.22)" borderRadius="$full" mb="$4" />
        <HStack space="md" mb="$3">
          <VStack flex={1} space="xs">
            <Box h={10} w="50%" bg="rgba(100, 116, 139, 0.25)" borderRadius="$full" />
            <Box h={12} w="75%" bg="rgba(148, 163, 184, 0.22)" borderRadius="$full" />
          </VStack>
          <VStack flex={1} space="xs">
            <Box h={10} w="50%" bg="rgba(100, 116, 139, 0.25)" borderRadius="$full" />
            <Box h={12} w="75%" bg="rgba(148, 163, 184, 0.22)" borderRadius="$full" />
          </VStack>
        </HStack>
        <HStack space="md">
          <VStack flex={1} space="xs">
            <Box h={10} w="50%" bg="rgba(100, 116, 139, 0.25)" borderRadius="$full" />
            <Box h={12} w="70%" bg="rgba(148, 163, 184, 0.22)" borderRadius="$full" />
          </VStack>
          <VStack flex={1} space="xs">
            <Box h={10} w="60%" bg="rgba(100, 116, 139, 0.25)" borderRadius="$full" />
            <Box h={12} w="85%" bg="rgba(148, 163, 184, 0.22)" borderRadius="$full" />
          </VStack>
        </HStack>
      </Box>

      <Box bg={CARD} borderRadius="$2xl" borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
        <Box h={16} w="45%" bg="rgba(148, 163, 184, 0.22)" borderRadius="$full" mb="$3" />
        <Box
          borderRadius="$xl"
          borderWidth={1}
          borderColor="rgba(100, 116, 139, 0.35)"
          px="$4"
          py="$8"
          alignItems="center"
          bg="rgba(30, 41, 59, 0.45)"
        >
          <Box w={60} h={60} borderRadius="$full" bg="rgba(59, 130, 246, 0.2)" mb="$3" />
          <Box h={12} w="45%" bg="rgba(148, 163, 184, 0.22)" borderRadius="$full" mb="$2" />
          <Box h={10} w="55%" bg="rgba(100, 116, 139, 0.25)" borderRadius="$full" />
        </Box>
        <HStack mt="$4" space="sm">
          <Box flex={1} h={42} borderRadius="$lg" borderWidth={1} borderColor="rgba(239, 68, 68, 0.5)" />
          <Box flex={1} h={42} borderRadius="$lg" borderWidth={1} borderColor="rgba(234, 179, 8, 0.5)" />
        </HStack>
      </Box>

      <Box bg={CARD} borderRadius="$2xl" borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
        <Box h={16} w="40%" bg="rgba(148, 163, 184, 0.22)" borderRadius="$full" mb="$4" />
        {Array.from({ length: 3 }).map((_, idx) => (
          <HStack key={`timeline-skeleton-${idx}`} alignItems="flex-start" space="sm" mb={idx === 2 ? '$0' : '$3'}>
            <VStack alignItems="center">
              <Box w={16} h={16} borderRadius="$full" borderWidth={2} borderColor="rgba(59, 130, 246, 0.5)" />
              {idx !== 2 ? <Box w={2} h={34} bg="rgba(71, 85, 105, 0.45)" my="$1" /> : null}
            </VStack>
            <VStack flex={1} space="xs">
              <Box h={12} w="32%" bg="rgba(148, 163, 184, 0.22)" borderRadius="$full" />
              <Box h={10} w="70%" bg="rgba(100, 116, 139, 0.25)" borderRadius="$full" />
              <Box h={22} w={72} bg="rgba(59, 130, 246, 0.2)" borderRadius="$md" />
            </VStack>
          </HStack>
        ))}
      </Box>
    </VStack>
  );
}

export default function AlertDetailsScreen({ navigation, route }: Readonly<Props>) {
  const dispatch = useAppDispatch();
  const { alertId } = route.params;
  const detailItem = useAppSelector((s) => s.alerts.detailItem);
  const detailStatus = useAppSelector((s) => s.alerts.detailStatus);
  const detailError = useAppSelector((s) => s.alerts.detailError);
  const listItem = useAppSelector((s) => s.alerts.items.find((item) => item.id === alertId));
  const alert = detailItem?.id === alertId ? detailItem : listItem;
  const fallbackEmail = useAppSelector(
    (s) => s.auth.userEmail ?? s.auth.user?.email ?? s.auth.user?.username ?? '',
  );
  const handleBack = () => {
    navigation.navigate('Dashboard', { email: fallbackEmail, initialTab: 'Alerts' });
  };

  useEffect(() => {
    void dispatch(fetchAlertById({ alertId }));
  }, [dispatch, alertId]);

  if (detailStatus === 'loading') {
    return (
      <Box flex={1} bg={BG}>
        <AppHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <VStack px={APP_HORIZONTAL_PADDING} pt="$4" space="md">
            <Pressable
              onPress={handleBack}
              alignSelf="flex-start"
              px="$3"
              py="$2"
              borderRadius="$full"
              bg="rgba(15, 23, 42, 0.95)"
              borderWidth={1}
              borderColor="rgba(56, 189, 248, 0.35)"
            >
              <HStack alignItems="center" space="xs">
                <Ionicons name="arrow-back" size={16} color="#e2e8f0" />
                <Text color="#e2e8f0" fontSize={12} fontWeight="$bold">
                  Back
                </Text>
              </HStack>
            </Pressable>
            <AlertDetailsSkeleton />
          </VStack>
        </ScrollView>
      </Box>
    );
  }

  if (!alert) {
    return (
      <Box flex={1} bg={BG} px="$4" pt="$10">
        <Pressable onPress={handleBack} mb="$4">
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </Pressable>
        <Text color="#e2e8f0" fontSize={16} fontWeight="$bold">
          Alert not found
        </Text>
        {detailError ? (
          <Text color="#ef4444" fontSize={12} mt="$2">
            {detailError}
          </Text>
        ) : null}
      </Box>
    );
  }

  const workflow = statusFromWorkflow(alert.currentTimeLine?.workFlowStatus);
  const wfStyle = statusColors(workflow);
  const timeline = alert.timeLine && alert.timeLine.length > 0 ? alert.timeLine : [alert.currentTimeLine].filter(Boolean);
  const violationAt = formatDate(alert.receivedAt);

  return (
    <Box flex={1} bg={BG}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <VStack px={APP_HORIZONTAL_PADDING} pt="$4" space="md">
          <Pressable
            onPress={handleBack}
            alignSelf="flex-start"
            px="$3"
            py="$2"
            borderRadius="$full"
            bg="rgba(15, 23, 42, 0.95)"
            borderWidth={1}
            borderColor="rgba(56, 189, 248, 0.35)"
          >
            <HStack alignItems="center" space="xs">
              <Ionicons name="arrow-back" size={16} color="#e2e8f0" />
              <Text color="#e2e8f0" fontSize={12} fontWeight="$bold">
                Back
              </Text>
            </HStack>
          </Pressable>

          <Box bg={CARD} borderRadius="$2xl" borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
            <HStack justifyContent="space-between" alignItems="center">
              <Text color="#fff" fontSize={16} fontWeight="$bold">
                {titleFromModel(alert.modelType)}
              </Text>
              <Box px="$3" py="$1" borderRadius="$lg" bg={wfStyle.bg} borderWidth={1} borderColor={wfStyle.border}>
                <Text color={wfStyle.text} fontSize={12} fontWeight="$bold">
                  {workflow}
                </Text>
              </Box>
            </HStack>
            <Text color={MUTED} fontSize={12} mt="$3">
              Picked by {asLabel(alert.currentTimeLine?.userName)}  •  {violationAt}
            </Text>
            <HStack mt="$2" alignItems="center" space="sm">
              <Ionicons name="person-outline" size={14} color={MUTED} />
              <Text color="#dbe7ff" fontSize={12} fontWeight="$bold">
                {asLabel(alert.personId)}
              </Text>
              <Text color="#dbe7ff" fontSize={12} fontWeight="$bold">
                / {asLabel(alert.personName)}
              </Text>
            </HStack>
          </Box>

          <Box bg={CARD} borderRadius="$2xl" borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
            <Text color="#fff" fontSize={16} fontWeight="$bold" mb="$3">
              Location Information
            </Text>
            <HStack space="md">
              <VStack flex={1}>
                <Text color={MUTED} fontSize={12}>
                  Site Name
                </Text>
                <Text color="#fff" fontSize={12} fontWeight="$bold">
                  {asLabel(alert.siteName)}
                </Text>
              </VStack>
              <VStack flex={1}>
                <Text color={MUTED} fontSize={12}>
                  Zone Name
                </Text>
                <Text color="#fff" fontSize={12} fontWeight="$bold">
                  {asLabel(alert.zoneName)}
                </Text>
              </VStack>
            </HStack>

            <HStack space="md" mt="$3">
              <VStack flex={1}>
                <Text color={MUTED} fontSize={12}>
                  Camera Name
                </Text>
                <Text color="#fff" fontSize={12} fontWeight="$bold">
                  {asLabel(alert.cameraName)}
                </Text>
              </VStack>
              <VStack flex={1}>
                <Text color={MUTED} fontSize={12}>
                  Violation Date & Time
                </Text>
                <Text color="#fff" fontSize={12} fontWeight="$bold">
                  {violationAt}
                </Text>
              </VStack>
            </HStack>

            <VStack mt="$3">
              <Text color={MUTED} fontSize={12}>
                Duration
              </Text>
              <Text color="#fff" fontSize={12} fontWeight="$bold">
                {alert.duration ?? 0} seconds
              </Text>
            </VStack>
          </Box>

          <Box bg={CARD} borderRadius="$2xl" borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
            <Text color="#fff" fontSize={16} fontWeight="$bold" mb="$3">
              Violation Recording
            </Text>
            <Box
              borderRadius="$xl"
              borderWidth={1}
              borderColor="rgba(100, 116, 139, 0.35)"
              px="$4"
              py="$8"
              alignItems="center"
              bg="rgba(30, 41, 59, 0.45)"
            >
              <Box w={60} h={60} borderRadius="$full" bg="rgba(37, 99, 235, 0.35)" alignItems="center" justifyContent="center">
                <Ionicons name="play" size={28} color="#3b82f6" />
              </Box>
              <Text color="#e2e8f0" fontSize={12} fontWeight="$bold" mt="$3">
                No recording available
              </Text>
              <Text color={MUTED} fontSize={12} mt="$1">
                Violation time: {violationAt}
              </Text>
            </Box>

            <HStack mt="$4" space="sm">
              <Pressable
                flex={1}
                borderRadius="$lg"
                borderWidth={1}
                borderColor="rgba(239, 68, 68, 0.5)"
                py="$3"
                alignItems="center"
                bg="rgba(127, 29, 29, 0.2)"
              >
                <Text color="#ef4444" fontSize={12} fontWeight="$bold">
                  Denied
                </Text>
              </Pressable>
              <Pressable
                flex={1}
                borderRadius="$lg"
                borderWidth={1}
                borderColor="rgba(234, 179, 8, 0.5)"
                py="$3"
                alignItems="center"
                bg="rgba(113, 63, 18, 0.2)"
              >
                <Text color="#eab308" fontSize={12} fontWeight="$bold">
                  Agree & Pick
                </Text>
              </Pressable>
            </HStack>
          </Box>

          <Box bg={CARD} borderRadius="$2xl" borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
            <Text color="#fff" fontSize={16} fontWeight="$bold" mb="$3">
              Activity Timeline
            </Text>
            <VStack>
              {timeline.map((item, idx) => (
                <TimelineRow key={`${item.analyticsId ?? idx}`} item={item} isLast={idx === timeline.length - 1} />
              ))}
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
}
