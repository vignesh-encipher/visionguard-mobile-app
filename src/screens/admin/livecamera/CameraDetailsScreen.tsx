import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Pressable, ScrollView, Text, VStack } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader, { APP_HORIZONTAL_PADDING } from '../../../components/layout/AppHeader';
import { CameraStreamMedia } from '../../../utils/stream';
import { RootStackParamList } from '../../types';
import {
  cameraIsLive,
  extractModelKeys,
  formatModelLabel,
  pickStreamUrl,
  streamModeLabel,
} from './cameraStreamUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'CameraDetails'>;

const BG = '#050a14';
const CARD = '#0d1526';
const CARD_BORDER = 'rgba(30, 41, 59, 0.95)';
const PANEL = '#141b2d';
const MUTED = '#8fa3bf';
const VALUE = '#ffffff';
const LIVE_GREEN = '#4ade80';
const ACCENT_BLUE = '#3b82f6';
const ORANGE = '#f97316';

function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour12: false });
}

function formatShortTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatHistoryDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncateUrl(url: string, max = 52): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max)}...`;
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
          <Box
            w={22}
            h={22}
            borderRadius={11}
            bg="$white"
            alignSelf={enabled ? 'flex-end' : 'flex-start'}
          />
        </Box>
      </Pressable>
    </HStack>
  );
}

export default function CameraDetailsScreen({ navigation, route }: Readonly<Props>) {
  const { camera } = route.params;
  const insets = useSafeAreaInsets();
  const streamUrl = pickStreamUrl(camera) ?? '';
  const isLive = cameraIsLive(camera);

  const modelKeys = useMemo(() => extractModelKeys(camera), [camera]);
  const [moduleEnabled, setModuleEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(modelKeys.map((k) => [k, true])),
  );
  const [zoomPct, setZoomPct] = useState(100);
  const [now, setNow] = useState(() => new Date());
  const [eventFilter] = useState('All Event Types');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timelineStart = useMemo(() => {
    const d = new Date(now);
    d.setMinutes(d.getMinutes() - 30);
    return d;
  }, [now]);

  const detectionEvents = useMemo(
    () =>
      modelKeys
        .filter((k) => moduleEnabled[k])
        .map((k) => formatModelLabel(k)),
    [modelKeys, moduleEnabled],
  );

  const historyItems = useMemo(() => {
    const base = new Date(now);
    return [0, 1, 2].map((i) => {
      const t = new Date(base);
      t.setMinutes(t.getMinutes() - (i + 2) * 2);
      return {
        id: `hist-${i}`,
        title: formatModelLabel(modelKeys[0] ?? 'HELMET_DETECTION'),
        time: formatClock(t),
        date: formatHistoryDate(t),
      };
    });
  }, [now, modelKeys]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const resetModules = useCallback(() => {
    setModuleEnabled(Object.fromEntries(modelKeys.map((k) => [k, true])));
  }, [modelKeys]);

  return (
    <Box flex={1} bg={BG}>
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <VStack px={APP_HORIZONTAL_PADDING} pt="$3" space="md">
          {/* Header */}
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
                  {camera.name}
                </Text>
                <Text color={MUTED} fontSize={11} mt="$1" numberOfLines={2}>
                  {streamUrl ? truncateUrl(streamUrl, 56) : 'No stream URL'}
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* Video + live time bar */}
          <Box borderRadius={16} overflow="hidden" borderWidth={1} borderColor={CARD_BORDER} bg={CARD}>
            <View style={styles.videoBox}>
              {streamUrl ? (
                <CameraStreamMedia streamUrl={streamUrl} isActive />
              ) : (
                <Box flex={1} alignItems="center" justifyContent="center" bg="#0a1220">
                  <Ionicons name="videocam-off-outline" size={40} color={MUTED} />
                  <Text color={MUTED} fontSize={13} mt="$2">
                    No stream available
                  </Text>
                </Box>
              )}
              {isLive ? (
                <Box position="absolute" top={10} left={10} zIndex={2}>
                  <HStack alignItems="center" bg="#ef4444" px="$2" py="$1" borderRadius="$full" space="xs">
                    <Box w={6} h={6} borderRadius={3} bg="$white" />
                    <Text color="$white" fontSize={10} fontWeight="$bold">
                      LIVE
                    </Text>
                  </HStack>
                </Box>
              ) : null}
            </View>

            <Box bg={PANEL} px="$4" py="$3" borderTopWidth={1} borderTopColor={CARD_BORDER}>
              <HStack alignItems="center" justifyContent="center" mb="$3" position="relative">
                <Text color={LIVE_GREEN} fontSize={22} fontWeight="$bold" letterSpacing={1}>
                  {formatClock(now)}
                </Text>
                <HStack position="absolute" right={0} alignItems="center" space="sm">
                  <Pressable onPress={() => setZoomPct((z) => Math.max(50, z - 10))} p="$1">
                    <Ionicons name="remove-circle-outline" size={22} color={MUTED} />
                  </Pressable>
                  <Text color={VALUE} fontSize={12} minWidth={40} textAlign="center">
                    {zoomPct}%
                  </Text>
                  <Pressable onPress={() => setZoomPct((z) => Math.min(200, z + 10))} p="$1">
                    <Ionicons name="add-circle-outline" size={22} color={MUTED} />
                  </Pressable>
                </HStack>
              </HStack>

              <Box h={6} borderRadius={3} bg="rgba(15, 23, 42, 0.9)" overflow="hidden" mb="$2">
                <Box h={6} w="78%" borderRadius={3} bg={ACCENT_BLUE} />
              </Box>
              <HStack justifyContent="space-between">
                <Text color={MUTED} fontSize={10}>
                  {formatShortTime(timelineStart)}
                </Text>
                <Text color={MUTED} fontSize={10}>
                  {formatShortTime(now)}
                </Text>
              </HStack>
            </Box>
          </Box>

          {/* Detection events */}
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
                detectionEvents.map((label) => (
                  <HStack key={label} alignItems="center" space="sm">
                    <Box w={8} h={8} borderRadius={4} bg={ACCENT_BLUE} />
                    <Text color={VALUE} fontSize={14}>
                      {label}
                    </Text>
                  </HStack>
                ))
              )}
            </VStack>
          </Box>

          {/* Camera details */}
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
            <DetailRow icon="speedometer-outline" iconColor="#a78bfa" label="STREAM MODE" value={streamModeLabel(camera)} />
            <DetailRow icon="speedometer-outline" iconColor="#facc15" label="BITRATE" value="0 Kbps" valueColor="#facc15" />
            <DetailRow icon="flame-outline" iconColor="#60a5fa" label="COMPRESSION" value="Disabled" />
          </VStack>

          {/* AI modules */}
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
              {modelKeys.map((key) => (
                <AiToggleRow
                  key={key}
                  label={formatModelLabel(key)}
                  enabled={Boolean(moduleEnabled[key])}
                  onToggle={() =>
                    setModuleEnabled((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                />
              ))}
            </VStack>
          </Box>

          {/* View history */}
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

            <VStack space="sm">
              {historyItems.map((item) => (
                <HStack
                  key={item.id}
                  alignItems="center"
                  bg="rgba(20, 27, 45, 0.85)"
                  borderRadius={12}
                  borderWidth={1}
                  borderColor={CARD_BORDER}
                  px="$3"
                  py="$3"
                  space="md"
                >
                  <Box
                    w={56}
                    h={56}
                    borderRadius={8}
                    bg="rgba(15, 23, 42, 0.95)"
                    alignItems="center"
                    justifyContent="center"
                    overflow="hidden"
                  >
                    <Ionicons name="image-outline" size={22} color={MUTED} />
                  </Box>
                  <VStack flex={1}>
                    <Text color={VALUE} fontSize={14} fontWeight="$bold">
                      {item.title}
                    </Text>
                    <Text color={ACCENT_BLUE} fontSize={13} fontWeight="$semibold" mt="$1">
                      {item.time}
                    </Text>
                    <Text color={MUTED} fontSize={11} mt="$0.5">
                      {item.date}
                    </Text>
                  </VStack>
                  <Pressable p="$1">
                    <Ionicons name="play" size={22} color={ORANGE} />
                  </Pressable>
                </HStack>
              ))}
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0a1220',
    position: 'relative',
  },
});
