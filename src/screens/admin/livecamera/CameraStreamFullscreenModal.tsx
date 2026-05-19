import { Ionicons } from '@expo/vector-icons';
import { HStack, Pressable } from '@gluestack-ui/themed';
import * as ScreenOrientation from 'expo-screen-orientation';
import { setStatusBarHidden } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraStreamMedia } from '../../../utils/stream';

export type CameraStreamFullscreenModalProps = {
  visible: boolean;
  streamUrl: string;
  onClose: () => void;
};

type OrientationMode = 'default' | 'landscape' | 'portrait';

type WebOrientation = {
  unlock?: () => Promise<void>;
  lock?: (orientation: 'landscape' | 'portrait' | 'natural' | 'any') => Promise<void>;
};

function getWebScreen() {
  if (typeof globalThis === 'undefined') return undefined;
  return (globalThis as unknown as { screen?: { orientation?: WebOrientation } }).screen;
}

export default function CameraStreamFullscreenModal({
  visible,
  streamUrl,
  onClose,
}: Readonly<CameraStreamFullscreenModalProps>) {
  const insets = useSafeAreaInsets();
  const [orientationMode, setOrientationMode] = useState<OrientationMode>('default');

  const restoreOrientation = useCallback(async () => {
    if (Platform.OS === 'web') {
      try {
        await getWebScreen()?.orientation?.unlock?.();
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      await ScreenOrientation.unlockAsync();
    } catch {
      /* ignore */
    }
  }, []);

  const applyOrientation = useCallback(async (mode: OrientationMode) => {
    setOrientationMode(mode);
    if (Platform.OS === 'web') {
      const scr = getWebScreen();
      const o = scr?.orientation;
      if (!o) return;
      try {
        if (mode === 'default') await o.unlock?.();
        else if (mode === 'landscape') await o.lock?.('landscape');
        else await o.lock?.('portrait');
      } catch {
        /* ignore — e.g. not supported or not user gesture */
      }
      return;
    }
    try {
      if (mode === 'default') await ScreenOrientation.unlockAsync();
      else if (mode === 'landscape')
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
      else await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setOrientationMode('default');
    setStatusBarHidden(true, 'fade');
    return () => {
      setStatusBarHidden(false, 'fade');
      void restoreOrientation();
    };
  }, [visible, restoreOrientation]);

  const handleClose = useCallback(() => {
    void restoreOrientation();
    onClose();
  }, [onClose, restoreOrientation]);

  const iconColor = (mode: OrientationMode) =>
    orientationMode === mode ? '#38bdf8' : '#e2e8f0';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      supportedOrientations={[
        'portrait',
        'portrait-upside-down',
        'landscape',
        'landscape-left',
        'landscape-right',
      ]}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <View style={styles.streamLayer}>
          <CameraStreamMedia streamUrl={streamUrl} isActive={visible} resizeMode="contain" />
        </View>

        <HStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          zIndex={20}
          pt={insets.top + 8}
          px="$3"
          pb="$3"
          alignItems="center"
          justifyContent="space-between"
          bg="rgba(0,0,0,0.55)"
        >
          <Pressable
            accessibilityLabel="Close fullscreen"
            onPress={handleClose}
            p="$2"
            borderRadius="$full"
            bg="rgba(255,255,255,0.12)"
            hitSlop={12}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>

          <HStack alignItems="center" space="md">
            <Pressable
              accessibilityLabel="Lock landscape"
              onPress={() => void applyOrientation('landscape')}
              p="$2"
              borderRadius="$md"
              bg={orientationMode === 'landscape' ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.08)'}
              hitSlop={8}
            >
              <Ionicons name="phone-landscape-outline" size={22} color={iconColor('landscape')} />
            </Pressable>
            <Pressable
              accessibilityLabel="Lock portrait"
              onPress={() => void applyOrientation('portrait')}
              p="$2"
              borderRadius="$md"
              bg={orientationMode === 'portrait' ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.08)'}
              hitSlop={8}
            >
              <Ionicons name="phone-portrait-outline" size={22} color={iconColor('portrait')} />
            </Pressable>
            <Pressable
              accessibilityLabel="Allow rotation"
              onPress={() => void applyOrientation('default')}
              p="$2"
              borderRadius="$md"
              bg={orientationMode === 'default' ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.08)'}
              hitSlop={8}
            >
              <Ionicons name="sync-outline" size={22} color={iconColor('default')} />
            </Pressable>
          </HStack>
        </HStack>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  streamLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
