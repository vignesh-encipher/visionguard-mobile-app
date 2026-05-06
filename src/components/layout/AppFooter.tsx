import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Pressable, Text } from '@gluestack-ui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = '#050a14';
const MUTED = '#8b9cb3';
const ACCENT = '#38bdf8';

export type AppTabId = 'Home' | 'Live' | 'Alerts' | 'Cameras' | 'More';

const tabs: { id: AppTabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'Home', label: 'Home', icon: 'grid' },
  { id: 'Live', label: 'Live', icon: 'desktop-outline' },
  { id: 'Alerts', label: 'Alerts', icon: 'notifications-outline' },
  { id: 'Cameras', label: 'Cameras', icon: 'videocam-outline' },
  { id: 'More', label: 'More', icon: 'menu-outline' },
];

export type AppFooterProps = {
  activeTab: AppTabId;
  onTabChange: (tab: AppTabId) => void;
};

export default function AppFooter({ activeTab, onTabChange }: AppFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <Box borderTopWidth={1} borderTopColor="#1e293b" bg={BG} pb={Math.max(insets.bottom, 8)} pt="$2">
      <HStack justifyContent="space-around" alignItems="flex-end">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <Pressable key={t.id} alignItems="center" minW={56} onPress={() => onTabChange(t.id)}>
              {active ? <Box w={24} h={3} borderRadius={2} bg={ACCENT} mb="$1" /> : <Box h={4} mb="$1" />}
              <Ionicons name={t.icon} size={22} color={active ? ACCENT : MUTED} />
              <Text fontSize={11} mt="$1" color={active ? ACCENT : MUTED}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </HStack>
    </Box>
  );
}
