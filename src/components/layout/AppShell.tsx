import { Box } from '@gluestack-ui/themed';
import { ReactNode } from 'react';
import AppFooter, { AppFooterProps } from './AppFooter';
import AppHeader, { AppHeaderProps } from './AppHeader';
import AppMain from './AppMain';

const BG = '#050a14';

export type AppShellProps = {
  children: ReactNode;
  activeTab: AppFooterProps['activeTab'];
  onTabChange: AppFooterProps['onTabChange'];
  headerProps?: AppHeaderProps;
  onMainEndReached?: () => void;
};

export default function AppShell({ children, activeTab, onTabChange, headerProps, onMainEndReached }: AppShellProps) {
  return (
    <Box flex={1} bg={BG}>
      <AppHeader {...headerProps} />
      <AppMain onEndReached={onMainEndReached}>{children}</AppMain>
      <AppFooter activeTab={activeTab} onTabChange={onTabChange} />
    </Box>
  );
}
