import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';

type AlertSeverity = 'High' | 'Critical' | 'Medium';
type AlertStatus = 'New' | 'Picked' | 'Resolved';

type AlertItem = {
  id: string;
  title: string;
  location: string;
  violator: string;
  chosen: string;
  last: string;
  severity: AlertSeverity;
  status: AlertStatus;
};

const alerts: AlertItem[] = [
  {
    id: 'a1',
    title: 'No Helmet',
    location: 'Site 1 \u00b7 Zone A \u00b7 Cam-01',
    violator: 'Worker A',
    chosen: 'Supervisor B',
    last: '2024-03-10 14:32',
    severity: 'High',
    status: 'New',
  },
  {
    id: 'a2',
    title: 'Fire Detected',
    location: 'Site 2 \u00b7 Zone B \u00b7 Cam-05',
    violator: 'N/A',
    chosen: 'N/A',
    last: '2024-03-10 14:28',
    severity: 'Critical',
    status: 'Picked',
  },
  {
    id: 'a3',
    title: 'No Vest',
    location: 'Site 1 \u00b7 Zone A \u00b7 Cam-02',
    violator: 'Worker C',
    chosen: 'Supervisor D',
    last: '2024-03-10 13:55',
    severity: 'Medium',
    status: 'Resolved',
  },
  {
    id: 'a4',
    title: 'No Gloves',
    location: 'Site 3 \u00b7 Zone C \u00b7 Cam-07',
    violator: 'Worker D',
    chosen: 'Supervisor A',
    last: '2024-03-10 13:40',
    severity: 'High',
    status: 'New',
  },
  {
    id: 'a5',
    title: 'Unauthorized Entry',
    location: 'Site 2 \u00b7 Gate 1 \u00b7 Cam-03',
    violator: 'Unknown',
    chosen: 'Security Lead',
    last: '2024-03-10 13:26',
    severity: 'Critical',
    status: 'Picked',
  },
  {
    id: 'a6',
    title: 'No Mask',
    location: 'Site 4 \u00b7 Lab \u00b7 Cam-11',
    violator: 'Worker E',
    chosen: 'Supervisor C',
    last: '2024-03-10 13:18',
    severity: 'Medium',
    status: 'Resolved',
  },
  {
    id: 'a7',
    title: 'Restricted Zone Breach',
    location: 'Site 5 \u00b7 Zone D \u00b7 Cam-04',
    violator: 'Visitor X',
    chosen: 'Security Team',
    last: '2024-03-10 13:09',
    severity: 'High',
    status: 'Picked',
  },
  {
    id: 'a8',
    title: 'Smoke Detected',
    location: 'Site 1 \u00b7 Warehouse \u00b7 Cam-09',
    violator: 'N/A',
    chosen: 'Safety Officer',
    last: '2024-03-10 12:58',
    severity: 'Critical',
    status: 'New',
  },
];

function severityColors(severity: AlertSeverity) {
  if (severity === 'Critical') {
    return { bg: 'rgba(127, 29, 29, 0.7)', color: '#f87171' };
  }
  if (severity === 'High') {
    return { bg: 'rgba(124, 45, 18, 0.68)', color: '#fb923c' };
  }
  return { bg: 'rgba(3, 105, 161, 0.58)', color: '#38bdf8' };
}

function statusColors(status: AlertStatus) {
  if (status === 'Resolved') {
    return { bg: 'rgba(6, 78, 59, 0.7)', color: '#22c55e' };
  }
  if (status === 'Picked') {
    return { bg: 'rgba(124, 45, 18, 0.68)', color: '#fb923c' };
  }
  return { bg: 'rgba(3, 105, 161, 0.58)', color: '#38bdf8' };
}

export default function AlertsContent() {
  return (
    <VStack mt="$2" mb="$4" space="md">
      <Text color="$white" fontSize={28} fontWeight="$bold" mb="$2">
        Alerts
      </Text>
      {alerts.map((item) => {
        const severity = severityColors(item.severity);
        const status = statusColors(item.status);

        return (
          <Box
            key={item.id}
            px="$4"
            py="$4"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="rgba(56, 189, 248, 0.22)"
            bg="#040d22"
          >
            <VStack flex={1} pr="$2">
              <Text color="#e2e8f0" fontSize={18} fontWeight="$bold">
                {item.title}
              </Text>
              <Text color="#7b93b5" fontSize={15} mt="$1">
                {item.location}
              </Text>
            </VStack>

            <HStack mt="$4" justifyContent="space-between">
              <VStack flex={1} pr="$3">
                <Text color="#7b93b5" fontSize={15}>
                  Violator: <Text color="#e2e8f0" fontWeight="$bold">{item.violator}</Text>
                </Text>
              </VStack>
              <VStack flex={1}>
                <Text color="#7b93b5" fontSize={15}>
                  Chosen: <Text color="#e2e8f0" fontWeight="$bold">{item.chosen}</Text>
                </Text>
              </VStack>
            </HStack>

            <HStack mt="$3" justifyContent="space-between" alignItems="center">
              <HStack flex={1} pr="$2" alignItems="center" space="xs">
                <Ionicons name="time-outline" size={18} color="#7b93b5" />
                <Text color="#d1d9e8" fontSize={13} fontWeight="$medium">
                  {item.last}
                </Text>
              </HStack>
              <HStack space="sm">
                <Box px="$3" py="$1" borderRadius="$full" bg={severity.bg}>
                  <Text color={severity.color} fontSize={13} fontWeight="$bold">
                    {item.severity}
                  </Text>
                </Box>
                <Box px="$3" py="$1" borderRadius="$full" bg={status.bg}>
                  <Text color={status.color} fontSize={13} fontWeight="$bold">
                    {item.status}
                  </Text>
                </Box>
              </HStack>
            </HStack>
          </Box>
        );
      })}
    </VStack>
  );
}
