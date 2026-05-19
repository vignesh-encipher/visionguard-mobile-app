import { Ionicons } from '@expo/vector-icons';
import { Box } from '@gluestack-ui/themed';
import { useEffect, useState } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import type { AlertDto } from './alerts.types';
import { getAlertFrameUri, getAlertThumbnailUri } from './alertMedia';

type Props = Readonly<{
  alert: Pick<AlertDto, 'frame' | 'thumbnail'>;
  size?: number;
  borderRadius?: number;
  iconSize?: number;
  /** Use full frame image (detail). Default: thumbnail for list. */
  preferFrame?: boolean;
  placeholderColor?: string;
  /** Fill parent (e.g. 16:9 incident image card). */
  fill?: boolean;
  style?: StyleProp<ImageStyle>;
}>;

export function AlertThumbnail({
  alert,
  size = 72,
  borderRadius = 10,
  iconSize = 28,
  preferFrame = false,
  placeholderColor = '#7b93b5',
  fill = false,
  style,
}: Props) {
  const uri = preferFrame ? getAlertFrameUri(alert) : getAlertThumbnailUri(alert);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri, alert.frame, alert.thumbnail]);

  if (!uri || failed) {
    if (fill) {
      return (
        <Box
          w="100%"
          h="100%"
          bg="rgba(15, 23, 42, 0.95)"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="image-outline" size={iconSize} color={placeholderColor} />
        </Box>
      );
    }

    return (
      <Box
        w={size}
        h={size}
        borderRadius={borderRadius}
        bg="rgba(15, 23, 42, 0.95)"
        alignItems="center"
        justifyContent="center"
        borderWidth={1}
        borderColor="rgba(56, 189, 248, 0.15)"
        overflow="hidden"
      >
        <Ionicons name="image-outline" size={iconSize} color={placeholderColor} />
      </Box>
    );
  }

  return (
    <Image
      key={uri}
      source={{ uri }}
      style={
        fill
          ? [{ width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.95)' }, style]
          : [
              {
                width: size,
                height: size,
                borderRadius,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
              },
              style,
            ]
      }
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}
