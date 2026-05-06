import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import type { ReactNode } from 'react';
import { View } from 'react-native';

const CARD = '#0d1526';
const CARD_BORDER = '#1e293b';
const MUTED = '#8b9cb3';
const ACCENT = '#38bdf8';

function SmallIconTile({ children }: { children: ReactNode }) {
  return (
    <Box w={40} h={40} borderRadius="$md" bg="#0B121E" alignItems="center" justifyContent="center">
      {children}
    </Box>
  );
}

/** Blue tile + light icon (matches PPE / system health reference) */
function AccentIconTile({ children }: { children: ReactNode }) {
  return (
    <Box w={40} h={40} borderRadius="$md" bg={ACCENT} alignItems="center" justifyContent="center">
      {children}
    </Box>
  );
}

function PpeGridCell({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <HStack flex={1} alignItems="center" space="sm" minWidth={0}>
      <Box flexShrink={0}>{icon}</Box>
      <Text color={MUTED} fontSize={16} fontWeight="$medium" numberOfLines={1}>
        {value}
      </Text>
    </HStack>
  );
}

export default function DashboardHomeContent() {
  const total = 256;
  const online = 246;
  const offline = 10;
  const configured = 230;
  const notConfigured = total - configured;
  const configPct = configured / total;

  return (
    <VStack space="lg" pt="$2">
      <Text color="$white" fontSize={28} fontWeight="$bold">
        Dashboard
      </Text>

      <Box bg={CARD} borderRadius="$xl" borderWidth={1} borderColor={CARD_BORDER} p="$4">
        <HStack justifyContent="space-between" alignItems="center" mb="$3">
          <SmallIconTile>
            <Ionicons name="videocam" size={20} color={ACCENT} />
          </SmallIconTile>
          <HStack alignItems="center" space="xs">
            <Ionicons name="trending-up" size={18} color="#22c55e" />
            <Text color="#22c55e" fontWeight="$semibold">
              +3
            </Text>
          </HStack>
        </HStack>
        <Text color={MUTED} fontSize={11} letterSpacing={1} mb="$2">
          CAMERA STATUS
        </Text>
        <Text color="$white" fontSize={32} fontWeight="$bold" mb="$3">
          {online} / {total}
        </Text>
        <HStack space="xl">
          <HStack alignItems="center" space="sm">
            <Box w={8} h={8} borderRadius={4} bg="#22c55e" />
            <Text color="#22c55e" fontWeight="$medium">
              {online} Online
            </Text>
          </HStack>
          <HStack alignItems="center" space="sm">
            <Box w={8} h={8} borderRadius={4} bg="#ef4444" />
            <Text color="#ef4444" fontWeight="$medium">
              {offline} Offline
            </Text>
          </HStack>
        </HStack>
      </Box>

      <Box bg={CARD} borderRadius="$xl" borderWidth={1} borderColor={CARD_BORDER} p="$4">
        <HStack justifyContent="space-between" alignItems="center" mb="$3">
          <SmallIconTile>
            <MaterialCommunityIcons name="shield-check" size={22} color={ACCENT} />
          </SmallIconTile>
        </HStack>
        <Text color={MUTED} fontSize={11} letterSpacing={1} mb="$2">
          CAMERA CONFIGURATION
        </Text>
        <Text color="$white" fontSize={32} fontWeight="$bold" mb="$4">
          {configured} / {total}
        </Text>

        <Box h={10} borderRadius="$full" bg="#1e293b" overflow="hidden">
          <View style={{ width: `${configPct * 100}%`, height: '100%' }}>
            <LinearGradient
              colors={['#38bdf8', '#a78bfa']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1, borderRadius: 999 }}
            />
          </View>
        </Box>
        <Text color={MUTED} fontSize={13} mt="$3">
          {notConfigured} not configured
        </Text>
      </Box>

      {/* PPE Compliance — ref. design */}
      <Box bg={CARD} borderRadius="$xl" borderWidth={1} borderColor={CARD_BORDER} p="$4">
        <HStack justifyContent="space-between" alignItems="center" mb="$3">
          <AccentIconTile>
            <MaterialCommunityIcons name="shield-check" size={22} color="#ffffff" />
          </AccentIconTile>
        </HStack>
        <Text color={MUTED} fontSize={11} letterSpacing={1} mb="$2">
          PPE COMPLIANCE
        </Text>
        <Text color="$white" fontSize={32} fontWeight="$bold" mb="$4">
          91%
        </Text>
        <VStack space="md">
          <HStack space="lg" alignItems="center">
            <PpeGridCell
              icon={<MaterialCommunityIcons name="hard-hat" size={22} color={ACCENT} />}
              value="245"
            />
            <PpeGridCell
              icon={<MaterialCommunityIcons name="tshirt-crew" size={22} color={ACCENT} />}
              value="238"
            />
          </HStack>
          <HStack space="lg" alignItems="center">
            <PpeGridCell
              icon={<MaterialCommunityIcons name="shield-outline" size={22} color={ACCENT} />}
              value="220"
            />
            <PpeGridCell
              icon={<MaterialCommunityIcons name="heart-pulse" size={22} color={ACCENT} />}
              value="232"
            />
          </HStack>
        </VStack>
      </Box>

      {/* System Health — ref. design */}
      <Box bg={CARD} borderRadius="$xl" borderWidth={1} borderColor={CARD_BORDER} p="$4">
        <HStack justifyContent="space-between" alignItems="center" mb="$3">
          <AccentIconTile>
            <MaterialCommunityIcons name="heart-pulse" size={22} color="#ffffff" />
          </AccentIconTile>
          <HStack alignItems="center" space="xs" flexShrink={0}>
            <Ionicons name="trending-up" size={16} color="#ef4444" />
            <Text color="#ef4444" fontWeight="$semibold" fontSize={13}>
              +0.02%
            </Text>
          </HStack>
        </HStack>
        <Text color={MUTED} fontSize={11} letterSpacing={1} mb="$2">
          SYSTEM HEALTH
        </Text>
        <Text color="$white" fontSize={32} fontWeight="$bold" mb="$2">
          99.97%
        </Text>
        <Text color={MUTED} fontSize={14}>
          Uptime
        </Text>
      </Box>
    </VStack>
  );
}
