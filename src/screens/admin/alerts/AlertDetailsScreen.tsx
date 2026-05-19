import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Pressable, ScrollView, Spinner, Text, VStack } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertThumbnail } from '../../../features/alerts/AlertThumbnail';
import { getAlertFrameUri } from '../../../features/alerts/alertMedia';
import { fetchAlertById } from '../../../features/alerts/alertsSlice';
import type { AlertDto } from '../../../features/alerts/alerts.types';
import {
  getAnalyticsBarDetails,
  releaseRecordingPlayback,
  type RecordingPlayback,
} from '../../../features/recording/recordingApi';
import { getRecordingEpochRange } from '../../../features/recording/recordingEpoch';
import { RootStackParamList } from '../../types';
import type { AlertTimelineItem } from '../../../features/alerts/alerts.types';
import AppHeader, { APP_HORIZONTAL_PADDING } from '../../../components/layout/AppHeader';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { RecordingVideoPlayer } from '../../../features/recording/RecordingVideoPlayer';

type Props = NativeStackScreenProps<RootStackParamList, 'AlertDetails'>;

const BG = '#050a14';
const CARD = '#081a36';
const CARD_BORDER = 'rgba(56, 189, 248, 0.25)';
const MUTED = '#8aa0bd';
const PANEL = '#141b2d';

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

function MediaPlaceholder({
  icon,
  title,
  subtitle,
}: Readonly<{ icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }>) {
  return (
    <Box flex={1} alignItems="center" justifyContent="center" bg="rgba(30, 41, 59, 0.45)">
      <Ionicons name={icon} size={40} color={MUTED} />
      <Text color="#e2e8f0" fontSize={12} fontWeight="$bold" mt="$3">
        {title}
      </Text>
      {subtitle ? (
        <Text color={MUTED} fontSize={12} mt="$1" textAlign="center" px="$4">
          {subtitle}
        </Text>
      ) : null}
    </Box>
  );
}

function EventIncidentImage({ alert }: Readonly<{ alert: AlertDto }>) {
  const hasImage = Boolean(getAlertFrameUri(alert));

  return (
    <Box bg={CARD} borderRadius="$2xl" borderWidth={1} borderColor={CARD_BORDER} overflow="hidden">
      <Box px="$4" py="$3" borderBottomWidth={1} borderBottomColor={CARD_BORDER}>
        <Text color="#fff" fontSize={16} fontWeight="$bold">
          Event Incident Image
        </Text>
      </Box>
      <View style={styles.mediaBox}>
        {hasImage ? (
          <AlertThumbnail alert={alert} preferFrame fill iconSize={40} />
        ) : (
          <MediaPlaceholder icon="image-outline" title="No incident image available" />
        )}
      </View>
    </Box>
  );
}

type RecordingPhase = 'loading' | 'ready' | 'empty' | 'error';

function ViolationRecording({ alert }: Readonly<{ alert: AlertDto }>) {
  const [playback, setPlayback] = useState<RecordingPlayback | null>(null);
  const [phase, setPhase] = useState<RecordingPhase>('loading');
  const violationAt = formatDate(alert.receivedAt);

  const loadRecording = useCallback(async () => {
    setPhase('loading');
    setPlayback((prev) => {
      releaseRecordingPlayback(prev);
      return null;
    });

    if (!alert.cameraId) {
      setPhase('empty');
      return;
    }

    const range = getRecordingEpochRange(alert);
    if (!range) {
      setPhase('empty');
      return;
    }

    try {
      const next = await getAnalyticsBarDetails({
        cameraId: alert.cameraId,
        startTime: range.startTime,
        endTime: range.endTime,
        modelType: alert.modelType,
      });
      if (!next) {
        setPhase('empty');
        return;
      }
      setPlayback(next);
      setPhase('ready');
    } catch {
      setPhase('error');
    }
  }, [
    alert.cameraId,
    alert.endEpochTime,
    alert.modelType,
    alert.receivedAt,
    alert.startEpochTime,
  ]);

  useEffect(() => {
    void loadRecording();
    return () => {
      setPlayback((prev) => {
        releaseRecordingPlayback(prev);
        return null;
      });
    };
  }, [loadRecording]);

  const renderVideoBody = () => {
    if (phase === 'loading') {
      return (
        <Box flex={1} alignItems="center" justifyContent="center" bg="rgba(30, 41, 59, 0.45)">
          <Spinner size="large" color="#38bdf8" />
          <Text color="#e2e8f0" fontSize={12} fontWeight="$bold" mt="$3">
            Loading recording…
          </Text>
        </Box>
      );
    }

    if (phase === 'ready' && playback?.uri) {
      return <RecordingVideoPlayer uri={playback.uri} />;
    }

    if (phase === 'error') {
      return (
        <Box flex={1} alignItems="center" justifyContent="center" bg="rgba(30, 41, 59, 0.45)" px="$4">
          <Ionicons name="alert-circle-outline" size={40} color={MUTED} />
          <Text color="#e2e8f0" fontSize={12} fontWeight="$bold" mt="$3" textAlign="center">
            Failed to load recording
          </Text>
          <Pressable onPress={() => void loadRecording()} mt="$3" px="$4" py="$2" borderRadius="$lg" bg="#38bdf8">
            <Text color="#0f172a" fontSize={12} fontWeight="$bold">
              Retry
            </Text>
          </Pressable>
        </Box>
      );
    }

    return (
      <MediaPlaceholder
        icon="videocam-off-outline"
        title="No video record found"
        subtitle={`Violation time: ${violationAt}`}
      />
    );
  };

  return (
    <Box bg={CARD} borderRadius="$2xl" borderWidth={1} borderColor={CARD_BORDER} overflow="hidden">
      <Box px="$4" py="$3" borderBottomWidth={1} borderBottomColor={CARD_BORDER}>
        <Text color="#fff" fontSize={16} fontWeight="$bold">
          Violation Recording
        </Text>
      </Box>
      <View style={styles.mediaBox}>{renderVideoBody()}</View>
      <Box bg={PANEL} px="$4" py="$3" borderTopWidth={1} borderTopColor={CARD_BORDER}>
        <HStack space="sm">
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
    </Box>
  );
}

function MediaCardsSkeleton() {
  return (
    <>
      <Box bg={CARD} borderRadius="$2xl" borderWidth={1} borderColor={CARD_BORDER} overflow="hidden">
        <Box px="$4" py="$3">
          <Box h={16} w="55%" bg="rgba(148, 163, 184, 0.22)" borderRadius="$full" />
        </Box>
        <Box style={styles.mediaBox} bg="rgba(30, 41, 59, 0.45)" alignItems="center" justifyContent="center">
          <Box w={60} h={60} borderRadius="$full" bg="rgba(59, 130, 246, 0.2)" />
        </Box>
      </Box>
      <Box bg={CARD} borderRadius="$2xl" borderWidth={1} borderColor={CARD_BORDER} overflow="hidden">
        <Box px="$4" py="$3">
          <Box h={16} w="48%" bg="rgba(148, 163, 184, 0.22)" borderRadius="$full" />
        </Box>
        <Box style={styles.mediaBox} bg="rgba(30, 41, 59, 0.45)" alignItems="center" justifyContent="center">
          <Box w={60} h={60} borderRadius="$full" bg="rgba(37, 99, 235, 0.35)" />
        </Box>
      </Box>
    </>
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

            <MediaCardsSkeleton />


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
  const { alertId, returnTo, cameraId } = route.params;
  const detailItem = useAppSelector((s) => s.alerts.detailItem);
  const detailStatus = useAppSelector((s) => s.alerts.detailStatus);
  const detailError = useAppSelector((s) => s.alerts.detailError);
  const listItem = useAppSelector((s) => s.alerts.items.find((item) => item.id === alertId));
  const alert = detailItem?.id === alertId ? detailItem : listItem;
  const fallbackEmail = useAppSelector(
    (s) => s.auth.userEmail ?? s.auth.user?.email ?? s.auth.user?.username ?? '',
  );
  const unreadNotificationCount = useAppSelector((s) =>
    s.notifications.items.filter((n) => !n.read).length,
  );
  const headerProps = {
    onPressNotifications: () => navigation.navigate('Notifications'),
    notificationCount: unreadNotificationCount,
  };

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (returnTo === 'camera' && cameraId) {
      navigation.navigate('CameraDetails', { cameraId });
      return;
    }
    navigation.navigate('Dashboard', { email: fallbackEmail, initialTab: 'Alerts' });
  }, [navigation, returnTo, cameraId, fallbackEmail]);

  useEffect(() => {
    void dispatch(fetchAlertById({ alertId }));
  }, [dispatch, alertId]);

  if (detailStatus === 'loading') {
    return (
      <Box flex={1} bg={BG}>
        <AppHeader {...headerProps} />
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
      <AppHeader {...headerProps} />
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

          <EventIncidentImage alert={alert} />
          <ViolationRecording alert={alert} />

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

const styles = StyleSheet.create({
  mediaBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0a1220',
    overflow: 'hidden',
    position: 'relative',
  },
});
