import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Pressable, ScrollView, Spinner, Text, VStack } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AlertDto } from '../../../features/alerts/alerts.types';
import { AlertThumbnail } from '../../../features/alerts/AlertThumbnail';
import {
  fetchCameraAnalyticsPage,
  fetchMonitorCameraById,
  HISTORY_PAGE_SIZE,
} from '../../../features/cameras/cameraDetailsApi';
import type { MonitorCameraDto } from '../../../features/cameras/cameras.types';
import AppHeader, { APP_HORIZONTAL_PADDING } from '../../../components/layout/AppHeader';
import { useAppSelector } from '../../../store/hooks';
import { getApiErrorMessage } from '../../../utils/apiError';
import { getAuthToken, getUserId } from '../../../utils/storage';
import { CameraStreamMedia } from '../../../utils/stream';
import CameraStreamFullscreenModal from './CameraStreamFullscreenModal';
import { RootStackParamList } from '../../types';
import {
  cameraIsLive,
  compressionLabel,
  formatBitrateLabel,
  formatModelLabel,
  getCameraStreamUrl,
  parseModelConfigs,
  streamModeLabel,
} from './cameraStreamUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'CameraDetails'>;

const BG = '#050a14';
const CARD = '#0d1526';
const CARD_BORDER = 'rgba(30, 41, 59, 0.95)';
const MUTED = '#8fa3bf';
const VALUE = '#ffffff';
const ACCENT_BLUE = '#3b82f6';
const ORANGE = '#f97316';
const CORAL = '#ff7b72';

function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour12: false });
}

function formatHistoryDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncateUrl(url: string, max = 52): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max)}...`;
}

function alertTitle(alert: AlertDto): string {
  const m = alert.modelType?.trim();
  if (!m) return 'Alert';
  return formatModelLabel(m.toUpperCase());
}

function formatAlertReceivedAt(receivedAt?: string | null): { time: string; date: string } {
  if (!receivedAt) return { time: '--', date: '--' };
  const d = new Date(receivedAt);
  if (Number.isNaN(d.getTime())) return { time: '--', date: '--' };
  return {
    time: formatClock(d),
    date: formatHistoryDate(d),
  };
}

type DetailRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
};

function DetailRow({ icon, iconColor, label, value, valueColor = VALUE }: Readonly<DetailRowProps>) {
  return (
    <HStack
      alignItems="center"
      bg={CARD}
      borderRadius={12}
      borderWidth={1}
      borderColor={CARD_BORDER}
      px="$3"
      py="$3"
      space="md"
    >
      <Box w={36} h={36} borderRadius={10} bg="rgba(15, 23, 42, 0.9)" alignItems="center" justifyContent="center">
        <Ionicons name={icon} size={18} color={iconColor} />
      </Box>
      <VStack flex={1}>
        <Text color={MUTED} fontSize={10} fontWeight="$bold" letterSpacing={0.8}>
          {label}
        </Text>
        <Text color={valueColor} fontSize={14} fontWeight="$semibold" mt="$0.5" numberOfLines={2}>
          {value}
        </Text>
      </VStack>
    </HStack>
  );
}

function AiToggleRow({
  label,
  enabled,
  onToggle,
}: Readonly<{ label: string; enabled: boolean; onToggle: () => void }>) {
  return (
    <HStack
      alignItems="center"
      justifyContent="space-between"
      bg={CARD}
      borderRadius={12}
      borderWidth={1}
      borderColor={CARD_BORDER}
      px="$3"
      py="$3"
    >
      <VStack flex={1} pr="$2">
        <Text color={VALUE} fontSize={14} fontWeight="$bold">
          {label}
        </Text>
        <Text color={enabled ? ACCENT_BLUE : MUTED} fontSize={12} mt="$0.5">
          {enabled ? 'Enabled' : 'Disabled'}
        </Text>
      </VStack>
      <Pressable onPress={onToggle} accessibilityRole="switch" accessibilityState={{ checked: enabled }}>
        <Box
          w={48}
          h={26}
          borderRadius={13}
          bg={enabled ? ACCENT_BLUE : 'rgba(71, 85, 105, 0.65)'}
          justifyContent="center"
          px="$0.5"
        >
          <Box w={22} h={22} borderRadius={11} bg="$white" alignSelf={enabled ? 'flex-end' : 'flex-start'} />
        </Box>
      </Pressable>
    </HStack>
  );
}

function DetailsSkeleton() {
  return (
    <VStack space="md">
      <Box h={72} borderRadius={14} bg="rgba(148, 163, 184, 0.12)" />
      <Box h={220} borderRadius={16} bg="rgba(148, 163, 184, 0.12)" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Box key={`sk-${i}`} h={56} borderRadius={12} bg="rgba(148, 163, 184, 0.1)" />
      ))}
    </VStack>
  );
}

export default function CameraDetailsScreen({ navigation, route }: Readonly<Props>) {
  const { cameraId } = route.params;
  const insets = useSafeAreaInsets();
  const authUserId = useAppSelector((s) => s.auth.user?.id ?? null);
  const unreadNotificationCount = useAppSelector((s) =>
    s.notifications.items.filter((n) => !n.read).length,
  );

  const [camera, setCamera] = useState<MonitorCameraDto | null>(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [historyItems, setHistoryItems] = useState<AlertDto[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyHasNext, setHistoryHasNext] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [moduleEnabled, setModuleEnabled] = useState<Record<string, boolean>>({});
  const [eventFilter] = useState('All Event Types');
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const historyPageRef = useRef(0);
  const historyHasNextRef = useRef(false);
  const historyLoadingMoreRef = useRef(false);

  const streamUrl = camera ? getCameraStreamUrl(camera, 'default') : '';
  const trimmedStreamUrl = streamUrl.trim();
  const showStream = Boolean(trimmedStreamUrl);
  const isLive = camera ? cameraIsLive(camera) : false;
  const modelConfigs = useMemo(() => (camera ? parseModelConfigs(camera) : []), [camera]);

  useEffect(() => {
    if (!showStream) setFullscreenOpen(false);
  }, [showStream]);

  useEffect(() => {
    if (!camera) return;
    setModuleEnabled(
      Object.fromEntries(modelConfigs.map((m) => [m.modelType, Boolean(m.isEnabled)])),
    );
  }, [camera, modelConfigs]);

  const loadHistory = useCallback(
    async (page: number, append: boolean) => {
      if (append) {
        if (historyLoadingMoreRef.current || !historyHasNextRef.current) return;
        historyLoadingMoreRef.current = true;
        setHistoryLoadingMore(true);
      } else {
        setHistoryLoading(true);
        setHistoryError(null);
      }

      try {
        const pageDto = await fetchCameraAnalyticsPage(cameraId, page, HISTORY_PAGE_SIZE);
        setHistoryItems((prev) => (append ? [...prev, ...pageDto.content] : pageDto.content));
        const nextPage = pageDto.pageNumber ?? page;
        historyPageRef.current = nextPage;
        setHistoryPage(nextPage);
        const hasNext = Boolean(pageDto.hasNext);
        historyHasNextRef.current = hasNext;
        setHistoryHasNext(hasNext);
      } catch (e) {
        const msg = getApiErrorMessage(e, 'Failed to load history');
        if (!append) {
          setHistoryItems([]);
          setHistoryError(msg);
        }
      } finally {
        if (append) {
          historyLoadingMoreRef.current = false;
          setHistoryLoadingMore(false);
        } else {
          setHistoryLoading(false);
        }
      }
    },
    [cameraId],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setCameraLoading(true);
      setCameraError(null);
      setCamera(null);

      try {
        const token = await getAuthToken();
        if (!token) {
          if (!cancelled) setCameraError('Not authenticated');
          return;
        }

        const storedUserId = await getUserId();
        const userId = storedUserId ?? authUserId;
        if (!userId) {
          if (!cancelled) setCameraError('User not found. Please sign in again.');
          return;
        }

        const cam = await fetchMonitorCameraById(cameraId, userId);
        if (cancelled) return;
        setCamera(cam);
      } catch (e) {
        if (!cancelled) {
          setCameraError(getApiErrorMessage(e, 'Failed to load camera'));
        }
      } finally {
        if (!cancelled) setCameraLoading(false);
      }
    };

    void run();
    void loadHistory(0, false);

    return () => {
      cancelled = true;
    };
  }, [cameraId, authUserId, loadHistory]);

  const detectionEvents = useMemo(
    () => modelConfigs.filter((m) => moduleEnabled[m.modelType]),
    [modelConfigs, moduleEnabled],
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const resetModules = useCallback(() => {
    setModuleEnabled(
      Object.fromEntries(modelConfigs.map((m) => [m.modelType, Boolean(m.isEnabled)])),
    );
  }, [modelConfigs]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      if (layoutMeasurement.height + contentOffset.y < contentSize.height - 100) return;
      if (!historyHasNextRef.current || historyLoadingMoreRef.current || historyLoading) return;
      void loadHistory(historyPageRef.current + 1, true);
    },
    [historyLoading, loadHistory],
  );

  const displayStreamUrl = streamUrl || '---';

  return (
    <>
    <Box flex={1} bg={BG}>
      <AppHeader
        onPressNotifications={() => navigation.navigate('Notifications')}
        notificationCount={unreadNotificationCount}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <VStack px={APP_HORIZONTAL_PADDING} pt="$3" space="md">
          <Box bg={CARD} borderRadius={14} borderWidth={1} borderColor={CARD_BORDER} px="$3" py="$3">
            <HStack alignItems="flex-start" space="md">
              <Pressable
                onPress={handleBack}
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
              <VStack flex={1}>
                <Text color={VALUE} fontSize={18} fontWeight="$bold" numberOfLines={1}>
                  {camera?.name ?? 'Camera'}
                </Text>
                <Text color={MUTED} fontSize={11} mt="$1" numberOfLines={2}>
                  {displayStreamUrl !== '---' ? truncateUrl(String(displayStreamUrl), 56) : 'Loading…'}
                </Text>
              </VStack>
            </HStack>
          </Box>

          {cameraError ? (
            <Box bg={CARD} borderRadius={12} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$3">
              <Text color={CORAL} fontSize={13}>
                {cameraError}
              </Text>
            </Box>
          ) : null}

          {cameraLoading && !camera ? (
            <DetailsSkeleton />
          ) : camera ? (
            <>
              <Box borderRadius={16} overflow="hidden" borderWidth={1} borderColor={CARD_BORDER} bg={CARD}>
                <View style={styles.videoBox}>
                  {!showStream ? (
                    <Box flex={1} alignItems="center" justifyContent="center" bg="#0a1220">
                      <Ionicons name="videocam-off-outline" size={40} color={MUTED} />
                      <Text color={MUTED} fontSize={13} mt="$2">
                        No stream available
                      </Text>
                    </Box>
                  ) : fullscreenOpen ? (
                    <View style={styles.fullscreenPlaceholder}>
                      <Text color={MUTED} fontSize={12}>
                        Playing fullscreen
                      </Text>
                    </View>
                  ) : (
                    <CameraStreamMedia streamUrl={trimmedStreamUrl} isActive resizeMode="contain" />
                  )}
                  {isLive ? (
                    <Box position="absolute" top={10} left={10} zIndex={4} pointerEvents="none">
                      <HStack alignItems="center" bg="#ef4444" px="$2" py="$1" borderRadius="$full" space="xs">
                        <Box w={6} h={6} borderRadius={3} bg="$white" />
                        <Text color="$white" fontSize={10} fontWeight="$bold">
                          LIVE
                        </Text>
                      </HStack>
                    </Box>
                  ) : null}
                  <Box position="absolute" top={10} right={10} zIndex={4}>
                    {showStream ? (
                      <Pressable
                        accessibilityLabel="Open fullscreen"
                        onPress={() => setFullscreenOpen(true)}
                        bg="rgba(0,0,0,0.45)"
                        borderRadius="$full"
                        p="$2"
                        hitSlop={8}
                      >
                        <Ionicons name="expand-outline" size={20} color="#e2e8f0" />
                      </Pressable>
                    ) : (
                      <Box bg="rgba(0,0,0,0.25)" borderRadius="$full" p="$2" opacity={0.45}>
                        <Ionicons name="expand-outline" size={20} color="#64748b" />
                      </Box>
                    )}
                  </Box>
                </View>
              </Box>

              <Box bg={CARD} borderRadius={14} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$3">
                <HStack alignItems="center" space="sm" mb="$3">
                  <Ionicons name="pulse-outline" size={16} color={MUTED} />
                  <Text color={MUTED} fontSize={11} fontWeight="$bold" letterSpacing={1}>
                    DETECTION EVENTS
                  </Text>
                </HStack>
                <VStack space="sm">
                  {detectionEvents.length === 0 ? (
                    <Text color={MUTED} fontSize={13}>
                      No active detections
                    </Text>
                  ) : (
                    detectionEvents.map((m) => (
                      <HStack key={m.modelType} alignItems="center" space="sm">
                        <Box w={8} h={8} borderRadius={4} bg={m.color ?? ACCENT_BLUE} />
                        <VStack flex={1}>
                          <Text color={VALUE} fontSize={14}>
                            {formatModelLabel(m.modelType)}
                          </Text>
                          {m.boxText?.trim() ? (
                            <Text color={MUTED} fontSize={11} mt="$0.5" numberOfLines={1}>
                              {m.boxText.trim()}
                            </Text>
                          ) : null}
                        </VStack>
                      </HStack>
                    ))
                  )}
                </VStack>
              </Box>

              <VStack space="sm">
                <Text color={MUTED} fontSize={11} fontWeight="$bold" letterSpacing={1}>
                  CAMERA DETAILS
                </Text>
                <DetailRow icon="business-outline" iconColor="#60a5fa" label="SITE" value={camera.siteName ?? '---'} />
                <DetailRow icon="location-outline" iconColor="#a78bfa" label="ZONE" value={camera.zoneName ?? '---'} />
                <DetailRow
                  icon="globe-outline"
                  iconColor="#34d399"
                  label="STREAM URL"
                  value={streamUrl ? truncateUrl(streamUrl, 40) : '---'}
                />
                <DetailRow
                  icon="speedometer-outline"
                  iconColor="#a78bfa"
                  label="STREAM MODE"
                  value={streamModeLabel(camera)}
                />
                <DetailRow
                  icon="speedometer-outline"
                  iconColor="#facc15"
                  label="BITRATE"
                  value={formatBitrateLabel(camera.maxBitrate)}
                  valueColor="#facc15"
                />
                <DetailRow
                  icon="flame-outline"
                  iconColor="#60a5fa"
                  label="COMPRESSION"
                  value={compressionLabel(camera.compressionEnabled)}
                />
              </VStack>

              <Box bg={CARD} borderRadius={14} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
                <HStack alignItems="center" justifyContent="space-between" mb="$3">
                  <Text color={MUTED} fontSize={11} fontWeight="$bold" letterSpacing={1}>
                    AI MODULES
                  </Text>
                  <HStack space="sm">
                    <Pressable onPress={resetModules} px="$3" py="$2" borderRadius={8} bg="rgba(71, 85, 105, 0.45)">
                      <Text color={VALUE} fontSize={12} fontWeight="$semibold">
                        Reset
                      </Text>
                    </Pressable>
                    <Pressable px="$3" py="$2" borderRadius={8} bg={ACCENT_BLUE}>
                      <Text color="$white" fontSize={12} fontWeight="$semibold">
                        Update
                      </Text>
                    </Pressable>
                  </HStack>
                </HStack>
                <VStack space="sm">
                  {modelConfigs.length === 0 ? (
                    <Text color={MUTED} fontSize={13}>
                      No AI modules configured
                    </Text>
                  ) : (
                    modelConfigs.map((m) => (
                      <AiToggleRow
                        key={m.modelType}
                        label={formatModelLabel(m.modelType)}
                        enabled={Boolean(moduleEnabled[m.modelType])}
                        onToggle={() =>
                          setModuleEnabled((prev) => ({
                            ...prev,
                            [m.modelType]: !prev[m.modelType],
                          }))
                        }
                      />
                    ))
                  )}
                </VStack>
              </Box>

              <Box bg={CARD} borderRadius={14} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
                <HStack alignItems="center" space="sm" mb="$3">
                  <Ionicons name="time-outline" size={18} color={MUTED} />
                  <Text color={VALUE} fontSize={16} fontWeight="$bold">
                    View History
                  </Text>
                </HStack>

                <Pressable
                  mb="$3"
                  px="$3"
                  py="$2.5"
                  borderRadius={10}
                  borderWidth={1}
                  borderColor={CARD_BORDER}
                  bg="rgba(15, 23, 42, 0.85)"
                >
                  <HStack alignItems="center" justifyContent="space-between">
                    <Text color={VALUE} fontSize={13}>
                      {eventFilter}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={MUTED} />
                  </HStack>
                </Pressable>

                {historyError ? (
                  <Text color={CORAL} fontSize={13} mb="$2">
                    {historyError}
                  </Text>
                ) : null}

                {historyLoading && historyItems.length === 0 ? (
                  <HStack py="$4" justifyContent="center" space="sm">
                    <Spinner size="small" color={ACCENT_BLUE} />
                    <Text color={MUTED} fontSize={13}>
                      Loading history…
                    </Text>
                  </HStack>
                ) : null}

                {!historyLoading && historyItems.length === 0 ? (
                  <Text color={MUTED} fontSize={13} py="$2">
                    No events for this camera
                  </Text>
                ) : null}

                <VStack space="sm">
                  {historyItems.map((item) => {
                    const { time, date } = formatAlertReceivedAt(item.receivedAt);
                    const openAlertDetails = () =>
                      navigation.navigate('AlertDetails', {
                        alertId: item.id,
                        returnTo: 'camera',
                        cameraId,
                      });
                    return (
                      <Pressable key={item.id} onPress={openAlertDetails}>
                      <HStack
                        alignItems="center"
                        bg="rgba(20, 27, 45, 0.85)"
                        borderRadius={12}
                        borderWidth={1}
                        borderColor={CARD_BORDER}
                        px="$3"
                        py="$3"
                        space="md"
                      >
                        <AlertThumbnail alert={item} size={56} borderRadius={8} iconSize={22} placeholderColor={MUTED} />
                        <VStack flex={1}>
                          <Text color={VALUE} fontSize={14} fontWeight="$bold">
                            {alertTitle(item)}
                          </Text>
                          <Text color={ACCENT_BLUE} fontSize={13} fontWeight="$semibold" mt="$1">
                            {time}
                          </Text>
                          <Text color={MUTED} fontSize={11} mt="$0.5">
                            {date}
                          </Text>
                        </VStack>
                        <Box p="$1">
                          <Ionicons name="play" size={22} color={ORANGE} />
                        </Box>
                      </HStack>
                      </Pressable>
                    );
                  })}
                </VStack>

                {historyLoadingMore ? (
                  <HStack py="$3" justifyContent="center" space="sm">
                    <Spinner size="small" color={ACCENT_BLUE} />
                    <Text color={MUTED} fontSize={12}>
                      Loading more…
                    </Text>
                  </HStack>
                ) : null}
              </Box>
            </>
          ) : null}
        </VStack>
      </ScrollView>
    </Box>

    <CameraStreamFullscreenModal
      visible={fullscreenOpen && showStream}
      streamUrl={trimmedStreamUrl}
      onClose={() => setFullscreenOpen(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0a1220',
    position: 'relative',
    overflow: 'hidden',
  },
  fullscreenPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a1220',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
