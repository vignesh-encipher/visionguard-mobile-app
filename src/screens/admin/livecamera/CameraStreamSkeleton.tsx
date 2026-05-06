import { Box } from '@gluestack-ui/themed';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const BORDER = '#1e293b';
const CARD_BG = '#0d1526';

export default function CameraStreamSkeleton() {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.65,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Box mb="$4" borderRadius="$xl" overflow="hidden" borderWidth={1} borderColor={BORDER} bg={CARD_BG}>
      <View style={styles.videoShell}>
        <Animated.View style={[styles.shimmer, { opacity: pulse }]} />
        <View style={styles.barRow}>
          <View style={styles.barShort} />
          <View style={styles.barTiny} />
        </View>
      </View>
      <Box px="$3" py="$3" bg="rgba(5,10,20,0.88)" borderTopWidth={1} borderTopColor="rgba(30,41,59,0.9)">
        <View style={styles.titleBar} />
        <View style={styles.subBar} />
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  videoShell: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0a1220',
    justifyContent: 'flex-end',
    padding: 12,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1e3a5f',
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barShort: {
    width: '42%',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(148,163,184,0.25)',
  },
  barTiny: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(148,163,184,0.2)',
  },
  titleBar: {
    height: 14,
    width: '55%',
    borderRadius: 6,
    backgroundColor: 'rgba(148,163,184,0.2)',
    marginBottom: 8,
  },
  subBar: {
    height: 11,
    width: '40%',
    borderRadius: 5,
    backgroundColor: 'rgba(148,163,184,0.15)',
  },
});
