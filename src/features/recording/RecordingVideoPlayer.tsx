import { Video, ResizeMode } from 'expo-av';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

type Props = Readonly<{
  uri: string;
  autoPlay?: boolean;
}>;

type Size = { width: number; height: number };

function fitVideoInBox(box: Size, video: Size): Size {
  if (box.width <= 0 || box.height <= 0 || video.width <= 0 || video.height <= 0) {
    return { width: box.width, height: box.height };
  }
  const scale = Math.min(box.width / video.width, box.height / video.height);
  return {
    width: Math.round(video.width * scale),
    height: Math.round(video.height * scale),
  };
}

function WebRecordingVideo({ uri, autoPlay }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !autoPlay) return;
    void el.play().catch(() => {});
  }, [uri, autoPlay]);

  return (
    <View style={styles.container}>
      {createElement('video', {
        key: uri,
        ref,
        src: uri,
        controls: true,
        playsInline: true,
        preload: 'auto',
        style: {
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          backgroundColor: '#0a1220',
        } as ViewStyle,
      })}
    </View>
  );
}

function NativeRecordingVideo({ uri, autoPlay }: Props) {
  const [boxSize, setBoxSize] = useState<Size>({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<Size>({ width: 16, height: 9 });

  const fittedSize = useMemo(
    () => fitVideoInBox(boxSize, naturalSize),
    [boxSize, naturalSize],
  );

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoxSize({ width, height });
  };

  const canRender = boxSize.width > 0 && boxSize.height > 0 && fittedSize.width > 0;

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      {canRender ? (
        <Video
          source={{ uri }}
          style={{
            width: fittedSize.width,
            height: fittedSize.height,
            backgroundColor: '#0a1220',
          }}
          videoStyle={styles.videoSurface}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={autoPlay}
          isLooping={false}
          isMuted
          useNativeControls
          onReadyForDisplay={(event) => {
            const { width, height } = event.naturalSize;
            if (width > 0 && height > 0) {
              setNaturalSize({ width, height });
            }
          }}
        />
      ) : null}
    </View>
  );
}

/** Recording playback — letterboxed like web `object-fit: contain`. */
export function RecordingVideoPlayer({ uri, autoPlay = true }: Props) {
  if (Platform.OS === 'web') {
    return <WebRecordingVideo uri={uri} autoPlay={autoPlay} />;
  }
  return <NativeRecordingVideo uri={uri} autoPlay={autoPlay} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0a1220',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoSurface: {
    width: '100%',
    height: '100%',
  },
});
