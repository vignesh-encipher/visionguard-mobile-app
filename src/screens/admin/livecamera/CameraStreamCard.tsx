import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Pressable, Text } from '@gluestack-ui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { CameraStreamMedia } from '../../../utils/stream';
import CameraStreamFullscreenModal from './CameraStreamFullscreenModal';

const BORDER = '#1e293b';
const CARD_BG = '#0d1526';

export type CameraStreamCardProps = {
  title: string;
  subtitle?: string;
  isLive?: boolean;
  /** Single resolved stream URL (WebRTC page, HLS, MJPEG, MP4, etc.). Parent picks priority. */
  streamUrl?: string | null;
  /** When false, heavy stream views unmount (tab in background). */
  isStreamActive?: boolean;
  onPress?: () => void;
};

export default function CameraStreamCard({
  title,
  subtitle,
  isLive = true,
  streamUrl,
  isStreamActive = true,
  onPress,
}: Readonly<CameraStreamCardProps>) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const trimmed = streamUrl?.trim() ?? '';
  const showStream = Boolean(isStreamActive && trimmed);

  useEffect(() => {
    if (!showStream) setFullscreenOpen(false);
  }, [showStream]);

  const openFullscreen = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setFullscreenOpen(true);
  };

  return (
    <>
      <Pressable onPress={onPress} mb="$4">
        <Box borderRadius="$xl" overflow="hidden" borderWidth={1} borderColor={BORDER} bg={CARD_BG}>
          <Box position="relative" width="100%">
            <View style={styles.ratioBox}>
              {!showStream ? (
                <>
                  <LinearGradient
                    colors={
                      isLive ? ['#1a3a52', '#0c1929', '#050a14'] : ['#1e293b', '#0f172a', '#050a14']
                    }
                    locations={[0, 0.45, 1]}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.scanline} pointerEvents="none" />
                </>
              ) : fullscreenOpen ? (
                <View style={styles.fullscreenPlaceholder}>
                  <Text color="#64748b" fontSize={12}>
                    Playing fullscreen
                  </Text>
                </View>
              ) : (
                <CameraStreamMedia streamUrl={trimmed} isActive={isStreamActive} />
              )}
            </View>

            <Box position="absolute" top={10} left={10} zIndex={4} pointerEvents="none">
              {isLive ? (
                <HStack alignItems="center" bg="#ef4444" px="$2" py="$1" borderRadius="$full" space="xs">
                  <Box w={6} h={6} borderRadius={3} bg="$white" />
                  <Text color="$white" fontSize={10} fontWeight="$bold" letterSpacing={0.5}>
                    LIVE
                  </Text>
                </HStack>
              ) : (
                <Box bg="#475569" px="$2" py="$1" borderRadius="$full">
                  <Text color="#e2e8f0" fontSize={10} fontWeight="$bold" letterSpacing={0.5}>
                    OFFLINE
                  </Text>
                </Box>
              )}
            </Box>

            <Box position="absolute" top={10} right={10} zIndex={4}>
              {showStream ? (
                <Pressable
                  accessibilityLabel="Open fullscreen"
                  onPress={openFullscreen}
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

            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              px="$3"
              py="$3"
              bg="rgba(5,10,20,0.88)"
              borderTopWidth={1}
              borderTopColor="rgba(30,41,59,0.9)"
              zIndex={3}
            >
              <Text color="$white" fontWeight="$semibold" fontSize={15} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text color="#94a3b8" fontSize={12} mt="$1" numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </Box>
          </Box>
        </Box>
      </Pressable>

      <CameraStreamFullscreenModal
        visible={fullscreenOpen && showStream}
        streamUrl={trimmed}
        onClose={() => setFullscreenOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  ratioBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#050a14',
    position: 'relative',
  },
  fullscreenPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050a14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanline: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    backgroundColor: '#fff',
  },
});
