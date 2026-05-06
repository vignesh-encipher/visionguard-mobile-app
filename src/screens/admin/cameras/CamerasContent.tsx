import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';

type CameraCard = {
  id: string;
  name: string;
  siteZone: string;
  status: 'Online' | 'Disabled';
  fps: number;
  resolution: string;
  labels: string[];
  modeLabel: string;
  enabled: boolean;
};

const cameras: CameraCard[] = [
  {
    id: 'c1',
    name: 'Cam-01',
    siteZone: 'Site 1 - Zone A',
    status: 'Online',
    fps: 30,
    resolution: '1920x1080',
    labels: ['VEST', 'HELMET', 'MASK', 'ZONE'],
    modeLabel: 'Bitrate',
    enabled: true,
  },
  {
    id: 'c2',
    name: 'Cam-02',
    siteZone: 'Site 1 - Zone A',
    status: 'Online',
    fps: 25,
    resolution: '1280x720',
    labels: ['VEST', 'HELMET', 'HAIRNET', 'MASK', 'SHOE', 'GLOVES', 'FIRE'],
    modeLabel: 'Hybrid (Bitrate & Compression)',
    enabled: true,
  },
  {
    id: 'c3',
    name: 'Cam-03',
    siteZone: 'Site 1 - Zone B',
    status: 'Disabled',
    fps: 0,
    resolution: '1920x1080',
    labels: ['OIL SPILL', 'FIRE', 'ZONE'],
    modeLabel: 'Compression',
    enabled: false,
  },
];

const labelStyles: Record<
  string,
  {
    bg: string;
    color: string;
  }
> = {
  VEST: { bg: 'rgba(6, 78, 59, 0.65)', color: '#34d399' },
  HELMET: { bg: 'rgba(30, 64, 175, 0.6)', color: '#60a5fa' },
  MASK: { bg: 'rgba(8, 145, 178, 0.55)', color: '#22d3ee' },
  ZONE: { bg: 'rgba(124, 45, 18, 0.55)', color: '#fb923c' },
  HAIRNET: { bg: 'rgba(88, 28, 135, 0.55)', color: '#c084fc' },
  SHOE: { bg: 'rgba(113, 63, 18, 0.65)', color: '#facc15' },
  GLOVES: { bg: 'rgba(127, 29, 29, 0.65)', color: '#fb7185' },
  FIRE: { bg: 'rgba(127, 29, 29, 0.55)', color: '#f87171' },
  'OIL SPILL': { bg: 'rgba(113, 63, 18, 0.6)', color: '#eab308' },
};

function statusColors(status: CameraCard['status']) {
  if (status === 'Online') {
    return { bg: 'rgba(6, 78, 59, 0.7)', color: '#22c55e' };
  }
  return { bg: 'rgba(127, 29, 29, 0.45)', color: '#ef4444' };
}

export default function CamerasContent() {
  return (
    <VStack mt="$2" mb="$4" space="md">
      <Text color="$white" fontSize={28} fontWeight="$bold" mb="$2">
        Cameras
      </Text>
      {cameras.map((camera) => {
        const status = statusColors(camera.status);
        const cardOpacity = camera.enabled ? 1 : 0.55;

        return (
          <Box
            key={camera.id}
            px="$4"
            py="$4"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="rgba(56, 189, 248, 0.22)"
            bg="#040d22"
            opacity={cardOpacity}
          >
            <HStack justifyContent="space-between" alignItems="center">
              <Text color="#e2e8f0" fontSize={18} fontWeight="$bold">
                {camera.name}
              </Text>
              <Box px="$3" py="$1" borderRadius="$full" bg={status.bg}>
                <Text color={status.color} fontSize={13} fontWeight="$bold">
                  {camera.status}
                </Text>
              </Box>
            </HStack>

            <Text color="#7b93b5" fontSize={18} mt="$1">
              {camera.siteZone}
            </Text>

            <HStack mt="$3" flexWrap="wrap">
              {camera.labels.map((label) => {
                const style = labelStyles[label] ?? { bg: 'rgba(15, 23, 42, 0.7)', color: '#cbd5e1' };
                return (
                  <Box key={`${camera.id}-${label}`} px="$2" py="$1" borderRadius="$md" bg={style.bg} mr="$2" mb="$2">
                    <Text color={style.color} fontSize={12} fontWeight="$bold">
                      {label}
                    </Text>
                  </Box>
                );
              })}
            </HStack>

            <HStack mt="$2" justifyContent="space-between" alignItems="center">
              <Box px="$3" py="$1" borderRadius="$full" bg={camera.enabled ? 'rgba(6, 78, 59, 0.6)' : 'rgba(67, 56, 202, 0.35)'}>
                <Text color={camera.enabled ? '#22c55e' : '#a5b4fc'} fontSize={16} fontWeight="$bold">
                  {camera.modeLabel}
                </Text>
              </Box>

              <HStack alignItems="center" space="sm">
                <HStack
                  w={46}
                  h={24}
                  px="$1"
                  borderRadius="$full"
                  alignItems="center"
                  justifyContent={camera.enabled ? 'flex-end' : 'flex-start'}
                  bg={camera.enabled ? '#0ea5e9' : '#10203d'}
                >
                  <Box w={18} h={18} borderRadius="$full" bg={camera.enabled ? '#64748b' : '#0b1220'} />
                </HStack>
                <Text color={camera.enabled ? '#22c55e' : '#ef4444'} fontSize={16} fontWeight="$bold">
                  {camera.enabled ? 'On' : 'Off'}
                </Text>
              </HStack>
            </HStack>
          </Box>
        );
      })}
    </VStack>
  );
}
