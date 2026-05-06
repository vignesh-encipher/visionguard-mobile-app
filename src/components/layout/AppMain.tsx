import { Box, ScrollView } from '@gluestack-ui/themed';
import { ReactNode } from 'react';
import { APP_HORIZONTAL_PADDING } from './AppHeader';

const BG = '#050a14';

export type AppMainProps = {
  children: ReactNode;
};

export default function AppMain({ children }: AppMainProps) {
  return (
    <Box flex={1} bg={BG}>
      <ScrollView flex={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <Box px={APP_HORIZONTAL_PADDING}>{children}</Box>
      </ScrollView>
    </Box>
  );
}
