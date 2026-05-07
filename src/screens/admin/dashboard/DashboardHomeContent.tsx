import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useAppSelector } from '../../../store/hooks';

const CARD = '#08142a';
const CARD_BORDER = 'rgba(56, 189, 248, 0.24)';
const MUTED = '#8aa0bd';
const VALUE = '#f8fafc';
const ICON = '#22d3ee';

type StatCardProps = {
  title: string;
  value: number;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
};

function StatCard({ title, value, subtitle, icon, iconColor }: Readonly<StatCardProps>) {
  return (
    <Box bg={CARD} borderRadius="$xl" borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$3">
      <HStack alignItems="center" justifyContent="space-between" mb="$1">
        <Text color="#8fb0d0" fontSize={10} fontWeight="$bold" letterSpacing={1}>
          {title}
        </Text>
        <Ionicons name={icon} size={12} color={iconColor} />
      </HStack>
      <Text color={VALUE} fontSize={30} lineHeight={32} fontWeight="$bold">
        {value}
      </Text>
      <Text color={MUTED} fontSize={13}>
        {subtitle}
      </Text>
    </Box>
  );
}

export default function DashboardHomeContent() {
  const sites = useAppSelector((s) => s.sites.items);
  const cameras = useAppSelector((s) => s.cameras.items);

  const totalSites = sites.length;
  const totalCameras = cameras.length;
  const activeCameras = cameras.filter((cam) => Boolean(cam.active)).length;
  const zones = new Set(
    cameras
      .map((cam) => cam.zoneId)
      .filter((zoneId): zoneId is string => typeof zoneId === 'string' && zoneId.trim().length > 0),
  );
  const totalZones = zones.size;

  return (
    <VStack space="md" pt="$2">
      <Text color="$white" fontSize={28} fontWeight="$bold" mb="$1">
        Dashboard
      </Text>
      <StatCard
        title="CAMERA STATUS"
        value={activeCameras}
        subtitle="Online cameras"
        icon="videocam"
        iconColor="#22c55e"
      />
      <StatCard
        title="AI MODULE CONFIGURATION"
        value={totalCameras}
        subtitle="Total configured"
        icon="sparkles"
        iconColor="#a855f7"
      />
      <StatCard
        title="PPE COMPLIANCE"
        value={totalZones}
        subtitle="Zones"
        icon="shield-checkmark-outline"
        iconColor="#38bdf8"
      />
      <StatCard
        title="SYSTEM HEALTH"
        value={totalSites}
        subtitle="Sites"
        icon="pulse-outline"
        iconColor="#22c55e"
      />
    </VStack>
  );
}
