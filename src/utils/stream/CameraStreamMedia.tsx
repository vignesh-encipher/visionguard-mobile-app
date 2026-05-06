import { Text } from '@gluestack-ui/themed';
import { Video, ResizeMode } from 'expo-av';
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { detectStreamType, type StreamType } from './streamUtils';

/** Match desktop Chrome so LAN viewer pages (e.g. MediaMTX) serve the same path as in a browser. */
const WEBVIEW_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function stripHash(u: string) {
  const i = u.indexOf('#');
  return i === -1 ? u : u.slice(0, i);
}

function sameDocumentUrl(a: string, b: string) {
  const x = stripHash(a).replace(/\/+$/, '');
  const y = stripHash(b).replace(/\/+$/, '');
  return x === y || x.startsWith(`${y}/`) || y.startsWith(`${x}/`);
}

/** RN Web’s WebView shim is unreliable for LAN MediaMTX pages; use a real iframe (same as desktop Chrome). */
function WebStreamIframe({
  streamUrl,
  onLoad,
  onError,
}: Readonly<{
  streamUrl: string;
  onLoad: () => void;
  onError: () => void;
}>) {
  return createElement('iframe', {
    src: streamUrl,
    title: 'Camera stream',
    allow: 'autoplay; fullscreen; encrypted-media; picture-in-picture',
    allowFullScreen: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    style: {
      border: 'none',
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
    },
    onLoad,
    onError,
  });
}

export type StreamStatus = 'loading' | 'playing' | 'paused' | 'error' | 'retrying';

export type CameraStreamMediaProps = {
  streamUrl: string;
  autoPlay?: boolean;
  playing?: boolean;
  muted?: boolean;
  isActive?: boolean;
  retryAttempts?: number;
  retryInterval?: number;
  onLoaded?: () => void;
  onError?: (message: string) => void;
};

export default function CameraStreamMedia({
  streamUrl,
  autoPlay = true,
  playing,
  muted = true,
  isActive = true,
  retryAttempts = 3,
  retryInterval = 5000,
  onLoaded,
  onError,
}: Readonly<CameraStreamMediaProps>) {
  const resolvedPlaying = playing ?? autoPlay;
  const streamType: StreamType = useMemo(() => detectStreamType(streamUrl), [streamUrl]);

  const [status, setStatus] = useState<StreamStatus>('loading');
  const [mediaKey, setMediaKey] = useState(0);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const bumpMedia = useCallback(() => {
    setMediaKey((k) => k + 1);
  }, []);

  const scheduleRetry = useCallback(() => {
    if (retryCountRef.current >= retryAttempts) {
      setStatus('error');
      onError?.('Unable to load stream.');
      return;
    }
    retryCountRef.current += 1;
    setStatus('retrying');
    clearRetryTimer();
    retryTimerRef.current = setTimeout(() => {
      setStatus('loading');
      bumpMedia();
    }, retryInterval);
  }, [retryAttempts, retryInterval, onError, bumpMedia, clearRetryTimer]);

  useEffect(() => {
    retryCountRef.current = 0;
    clearRetryTimer();
    setStatus('loading');
    if (!streamUrl.trim()) {
      setStatus('error');
      onError?.('No stream URL provided.');
      return;
    }
    return () => {
      clearRetryTimer();
    };
  }, [streamUrl, streamType, clearRetryTimer, onError]);

  const handleLoaded = useCallback(() => {
    setStatus(resolvedPlaying && isActive ? 'playing' : 'paused');
    retryCountRef.current = 0;
    onLoaded?.();
  }, [resolvedPlaying, isActive, onLoaded]);

  const handleFatalError = useCallback(() => {
    scheduleRetry();
  }, [scheduleRetry]);

  if (!isActive) {
    return <View style={styles.fill} />;
  }

  const showOverlay = status === 'loading' || status === 'retrying';
  const showError = status === 'error';

  const renderMedia = () => {
    if (streamType === 'webrtc' || streamType === 'unknown') {
      if (streamType === 'unknown' && !streamUrl.startsWith('http')) {
        return (
          <View style={[styles.fill, styles.center]}>
            <Text color="#94a3b8" fontSize={12} px="$3" textAlign="center">
              Unsupported stream URL
            </Text>
          </View>
        );
      }
      return (
        <View key={`embed-${mediaKey}`} style={styles.fill} collapsable={false}>
          {Platform.OS === 'web' ? (
            <WebStreamIframe
              streamUrl={streamUrl}
              onLoad={handleLoaded}
              onError={handleFatalError}
            />
          ) : (
            <WebView
              source={{ uri: streamUrl }}
              style={styles.fill}
              userAgent={WEBVIEW_USER_AGENT}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              allowsAirPlayForMediaPlayback
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              originWhitelist={['*']}
              allowsFullscreenVideo
              setBuiltInZoomControls={false}
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              setSupportMultipleWindows={false}
              onLoadEnd={handleLoaded}
              onError={handleFatalError}
              onHttpError={(e) => {
                const { statusCode, url: failedUrl } = e.nativeEvent;
                if (statusCode < 400) return;
                if (sameDocumentUrl(failedUrl, streamUrl)) {
                  handleFatalError();
                }
              }}
            />
          )}
        </View>
      );
    }

    if (streamType === 'mjpeg') {
      return (
        <Image
          key={`img-${mediaKey}`}
          source={{ uri: streamUrl }}
          style={styles.fill}
          resizeMode="cover"
          onLoad={handleLoaded}
          onError={handleFatalError}
        />
      );
    }

    return (
      <Video
        key={`vid-${mediaKey}`}
        source={{ uri: streamUrl }}
        style={styles.fill}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={resolvedPlaying && isActive}
        isLooping={streamType === 'hls'}
        isMuted={muted}
        useNativeControls={false}
        onReadyForDisplay={handleLoaded}
        onError={handleFatalError}
      />
    );
  };

  return (
    <View style={styles.wrap}>
      {renderMedia()}

      {showOverlay ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text color="#e2e8f0" fontSize={12} mt="$3">
            {status === 'retrying'
              ? `Reconnecting… (${retryCountRef.current}/${retryAttempts})`
              : 'Loading stream…'}
          </Text>
        </View>
      ) : null}

      {showError ? (
        <View style={styles.overlay}>
          <Text color="#fecaca" fontSize={13} mb="$3" textAlign="center">
            Unable to load stream
          </Text>
          <Pressable
            onPress={() => {
              retryCountRef.current = 0;
              clearRetryTimer();
              setStatus('loading');
              bumpMedia();
            }}
            style={styles.retryBtn}
          >
            <Text color="#0f172a" fontWeight="$bold">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,10,20,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    paddingHorizontal: 16,
  },
  retryBtn: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
