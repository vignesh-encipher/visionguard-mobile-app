import { Box, ScrollView } from '@gluestack-ui/themed';
import { ReactNode } from 'react';
import { APP_HORIZONTAL_PADDING } from './AppHeader';

const BG = '#050a14';

export type AppMainProps = {
  children: ReactNode;
  onEndReached?: () => void;
};

export default function AppMain({ children, onEndReached }: AppMainProps) {
  const handleScroll = (event: {
    nativeEvent: {
      layoutMeasurement: { height: number };
      contentOffset: { y: number };
      contentSize: { height: number };
    };
  }) => {
    if (!onEndReached) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const threshold = 120;
    const isAtEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    if (isAtEnd) {
      onEndReached();
    }
  };

  return (
    <Box flex={1} bg={BG}>
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        <Box px={APP_HORIZONTAL_PADDING}>{children}</Box>
      </ScrollView>
    </Box>
  );
}
