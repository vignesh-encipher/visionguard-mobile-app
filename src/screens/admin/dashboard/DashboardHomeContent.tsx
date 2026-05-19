import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { apiClient } from '../../../services/api/client';
import { getDashboardDayRangeUtc } from '../../../utils/dashboardDateRange';
import { getApiErrorMessage } from '../../../utils/apiError';
import { getAuthToken, getOrganizationId } from '../../../utils/storage';

const PAGE_BG = '#050a14';
const CARD = '#141b2d';
const CARD_BORDER = 'rgba(143, 163, 191, 0.18)';
const MUTED = '#8fa3bf';
const VALUE = '#ffffff';
const CYAN = '#39c5cf';
const GREEN = '#3fb950';
const CHART_LINE = '#22c55e';
const ORANGE = '#ff7a00';
const SKY = '#38bdf8';
const CORAL = '#ff7b72';
const BAR_BLUE = '#58a6ff';
const BAR_ORANGE = '#f0883e';

const SKEL_PRIMARY = 'rgba(148, 163, 184, 0.22)';
const SKEL_SECONDARY = 'rgba(71, 85, 105, 0.35)';
const SKEL_TERTIARY = 'rgba(100, 116, 139, 0.3)';

const PEAK_LABELS = ['18:00', '15:00', '12:00', '09:00', '06:00', '03:00', '00:00', '21:00'] as const;
const DETECTED_ROW_TINTS = [
  'rgba(33, 150, 243, 0.12)',
  'rgba(156, 39, 176, 0.12)',
  'rgba(76, 175, 80, 0.12)',
  'rgba(33, 150, 243, 0.1)',
  'rgba(33, 150, 243, 0.1)',
  'rgba(33, 150, 243, 0.1)',
  'rgba(156, 39, 176, 0.1)',
];

const siteRowStyles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(55, 65, 81, 0.55)',
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 4,
  },
});

function formatInt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatPct(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '0%';
  return `${n.toFixed(digits)}%`;
}

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
};

function StatCard({ title, value, subtitle, icon, iconColor }: Readonly<StatCardProps>) {
  return (
    <Box bg={CARD} borderRadius={18} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$3">
      <HStack alignItems="center" justifyContent="space-between" mb="$1">
        <Text color={MUTED} fontSize={10} fontWeight="$bold" letterSpacing={1}>
          {title}
        </Text>
        <Ionicons name={icon} size={22} color={iconColor} />
      </HStack>
      <Text color={VALUE} fontSize={30} lineHeight={34} fontWeight="$bold">
        {value}
      </Text>
      <Text color={MUTED} fontSize={13} mt="$0.5">
        {subtitle}
      </Text>
    </Box>
  );
}

function InfrastructureCard({ sites, zones }: Readonly<{ sites: number; zones: number }>) {
  return (
    <Box bg={CARD} borderRadius={18} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$3">
      <HStack alignItems="center" justifyContent="space-between" mb="$2">
        <Text color={MUTED} fontSize={10} fontWeight="$bold" letterSpacing={1}>
          INFRASTRUCTURE OVERVIEW
        </Text>
        <Ionicons name="pulse-outline" size={22} color="#4caf50" />
      </HStack>
      <HStack alignItems="center" justifyContent="space-around" flex={1} minHeight={72}>
        <VStack alignItems="center" flex={1}>
          <Text color={VALUE} fontSize={32} fontWeight="$bold">
            {sites}
          </Text>
          <Text color={MUTED} fontSize={13}>
            Sites
          </Text>
        </VStack>
        <Box w={1} h={56} bg="rgba(143, 163, 191, 0.25)" />
        <VStack alignItems="center" flex={1}>
          <Text color={VALUE} fontSize={32} fontWeight="$bold">
            {zones}
          </Text>
          <Text color={MUTED} fontSize={13}>
            Zones
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}

function SectionHeader({ title, subtitle }: Readonly<{ title: string; subtitle: string }>) {
  return (
    <VStack mb="$3" space="xs">
      <Text color={VALUE} fontSize={18} fontWeight="$bold">
        {title}
      </Text>
      <Text color={MUTED} fontSize={13}>
        {subtitle}
      </Text>
    </VStack>
  );
}

function SkeletonBone({
  w,
  h,
  borderRadius = 999,
  mt,
  mb,
  flex,
}: Readonly<{
  w?: number | string;
  h: number;
  borderRadius?: number | string;
  mt?: string;
  mb?: string;
  flex?: number;
}>) {
  return (
    <Box
      w={w}
      h={h}
      flex={flex}
      borderRadius={borderRadius}
      bg={SKEL_PRIMARY}
      mt={mt}
      mb={mb}
    />
  );
}

function StatCardSkeleton() {
  return (
    <Box bg={CARD} borderRadius={18} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$3">
      <HStack alignItems="center" justifyContent="space-between" mb="$2">
        <SkeletonBone w={120} h={10} />
        <Box w={22} h={22} borderRadius={11} bg={SKEL_SECONDARY} />
      </HStack>
      <SkeletonBone w={100} h={32} borderRadius={8} mb="$2" />
      <SkeletonBone w={140} h={13} />
    </Box>
  );
}

function InfrastructureCardSkeleton() {
  return (
    <Box bg={CARD} borderRadius={18} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$3">
      <HStack alignItems="center" justifyContent="space-between" mb="$3">
        <SkeletonBone w={180} h={10} />
        <Box w={22} h={22} borderRadius={11} bg={SKEL_SECONDARY} />
      </HStack>
      <HStack alignItems="center" justifyContent="space-around" minHeight={72}>
        <VStack alignItems="center" flex={1} space="sm">
          <SkeletonBone w={48} h={32} borderRadius={8} />
          <SkeletonBone w={40} h={13} />
        </VStack>
        <Box w={1} h={56} bg="rgba(143, 163, 191, 0.25)" />
        <VStack alignItems="center" flex={1} space="sm">
          <SkeletonBone w={48} h={32} borderRadius={8} />
          <SkeletonBone w={44} h={13} />
        </VStack>
      </HStack>
    </Box>
  );
}

function SectionHeaderSkeleton() {
  return (
    <VStack mb="$3" space="sm">
      <SkeletonBone w={160} h={18} borderRadius={6} />
      <SkeletonBone w={220} h={13} />
    </VStack>
  );
}

function DetectedItemsCardSkeleton() {
  return (
    <Box bg={CARD} borderRadius={16} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4" mt="$1">
      <SectionHeaderSkeleton />
      <VStack space="sm">
        {Array.from({ length: 5 }).map((_, idx) => (
          <HStack
            key={`detected-skel-${idx}`}
            alignItems="center"
            justifyContent="space-between"
            bg="rgba(20, 27, 45, 0.6)"
            borderRadius={10}
            borderWidth={1}
            borderColor={CARD_BORDER}
            px="$3"
            py="$3"
          >
            <SkeletonBone w="45%" h={12} borderRadius={6} flex={1} />
            <HStack space="md" alignItems="center">
              <SkeletonBone w={48} h={13} borderRadius={6} />
              <SkeletonBone w={56} h={13} borderRadius={6} />
            </HStack>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

function PeakAlertsCardSkeleton() {
  return (
    <Box bg={CARD} borderRadius={16} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
      <SectionHeaderSkeleton />
      <Box h={200} borderRadius={12} bg="rgba(20, 27, 45, 0.55)" overflow="hidden" justifyContent="flex-end" px="$2" pb="$2">
        <SkeletonBone w="100%" h={120} borderRadius={8} mb="$2" />
        <HStack justifyContent="space-between" px="$8">
          {PEAK_LABELS.map((label) => (
            <Box key={label} w={28} h={8} borderRadius={4} bg={SKEL_TERTIARY} />
          ))}
        </HStack>
      </Box>
    </Box>
  );
}

function ZoneWiseAlertsCardSkeleton() {
  return (
    <Box bg={CARD} borderRadius={20} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
      <SectionHeaderSkeleton />
      <HStack flexWrap="wrap" justifyContent="space-between">
        {Array.from({ length: 4 }).map((_, slot) => (
          <Box
            key={`zone-skel-${slot}`}
            w="48%"
            mb="$3"
            bg="rgba(20, 27, 45, 0.6)"
            borderRadius={12}
            borderWidth={1}
            borderColor={CARD_BORDER}
            p="$3"
            minHeight={100}
          >
            <SkeletonBone w="70%" h={10} mb="$3" />
            <HStack alignItems="baseline" space="sm" mb="$3">
              <SkeletonBone w={56} h={26} borderRadius={6} />
              <SkeletonBone w={40} h={14} borderRadius={6} />
            </HStack>
            <SkeletonBone w="100%" h={4} borderRadius={2} />
          </Box>
        ))}
      </HStack>
    </Box>
  );
}

function SiteWiseAlertsCardSkeleton() {
  return (
    <Box bg={CARD} borderRadius={16} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
      <SectionHeaderSkeleton />
      <VStack space="md">
        {Array.from({ length: 4 }).map((_, idx) => (
          <VStack
            key={`site-skel-${idx}`}
            space="sm"
            py="$2"
            borderTopWidth={idx === 0 ? 0 : 1}
            borderTopColor="rgba(139, 148, 158, 0.12)"
          >
            <HStack alignItems="center" justifyContent="space-between">
              <HStack space="md" alignItems="center" flex={1}>
                <Box w={28} h={28} borderRadius={999} bg={SKEL_TERTIARY} />
                <SkeletonBone w="50%" h={15} borderRadius={6} flex={1} />
              </HStack>
              <HStack space="md" alignItems="center">
                <SkeletonBone w={44} h={14} borderRadius={6} />
                <SkeletonBone w={36} h={15} borderRadius={6} />
              </HStack>
            </HStack>
            <SkeletonBone w="100%" h={6} borderRadius={4} />
          </VStack>
        ))}
      </VStack>
    </Box>
  );
}

function DashboardHomeSkeleton() {
  return (
    <>
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <InfrastructureCardSkeleton />
      <DetectedItemsCardSkeleton />
      <PeakAlertsCardSkeleton />
      <ZoneWiseAlertsCardSkeleton />
      <SiteWiseAlertsCardSkeleton />
    </>
  );
}

function PeakAlertsChart({ values }: Readonly<{ values: number[] }>) {
  const [w, setW] = useState(280);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 40) setW(width);
  }, []);

  const chartH = 200;
  const padL = 40;
  const padR = 8;
  const padT = 12;
  const padB = 32;
  const innerW = Math.max(1, w - padL - padR);
  const innerH = chartH - padT - padB;
  const maxVal = Math.max(1000, ...values, 1);
  const yTicks = 6;
  const step = maxVal / yTicks;

  const points = values.map((v, i) => {
    const x = padL + (i / Math.max(1, values.length - 1)) * innerW;
    const y = padT + innerH - (v / maxVal) * innerH;
    return { x, y, v };
  });

  let lineD = '';
  let areaD = '';
  if (points.length > 0) {
    lineD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      lineD += ` Q ${cx} ${p0.y} ${p1.x} ${p1.y}`;
    }
    const last = points[points.length - 1];
    const first = points[0];
    const bottom = padT + innerH;
    areaD = `${lineD} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
  }

  const yLabels: number[] = [];
  for (let i = 0; i <= yTicks; i++) {
    yLabels.push(Math.round(step * i));
  }

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      <Svg width={w} height={chartH}>
        <Defs>
          <LinearGradient id="peakFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={CHART_LINE} stopOpacity="0.35" />
            <Stop offset="1" stopColor={CHART_LINE} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {yLabels.map((label, i) => {
          const y = padT + innerH - (i / yTicks) * innerH;
          return (
            <Line
              key={`grid-${i}`}
              x1={padL}
              y1={y}
              x2={w - padR}
              y2={y}
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth={1}
            />
          );
        })}
        {areaD ? <Path d={areaD} fill="url(#peakFill)" /> : null}
        {lineD ? (
          <Path d={lineD} stroke={CHART_LINE} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {yLabels.map((label, i) => {
          const y = padT + innerH - (i / yTicks) * innerH + 4;
          return (
            <SvgText
              key={`ylab-${i}`}
              x={padL - 6}
              y={y}
              fontSize={10}
              fill={MUTED}
              textAnchor="end"
            >
              {formatInt(label)}
            </SvgText>
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', paddingLeft: padL, paddingRight: 4, marginTop: 4, justifyContent: 'space-between' }}>
        {PEAK_LABELS.map((label) => (
          <Text key={label} color={MUTED} fontSize={9} style={{ width: 32, textAlign: 'center' }}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const DASHBOARD_SITE_ID = '';

type ApiEnvelope<T> = {
  status?: string;
  message?: string;
  response?: T;
};

function unwrapDashboardPayload(raw: unknown): UnifiedDashboardResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (obj.response && typeof obj.response === 'object') {
    return obj.response as UnifiedDashboardResponse;
  }
  if ('mainCounts' in obj) {
    return raw as UnifiedDashboardResponse;
  }
  return null;
}

type DashboardMainCounts = {
  siteCount: number;
  zoneCount: number;
  cameraCount: number;
  activeCameraCount: number;
  configuredCameras: number;
  ppeCompliancePercentage: string;
  ppeComplianceSummary?: Record<string, number>;
};

type DashboardTimeAlert = { hour: string; count: number };

type DashboardAnalyticsStat = {
  color?: string | null;
  count: number;
  modelType?: string | null;
  percentage?: string | null;
};

type DashboardZoneCountRow = { zoneId: string; zoneName: string; count: number; percentage: number };
type DashboardSiteCountRow = { siteId: string; siteName: string; count: number; percentage: number };

type UnifiedDashboardResponse = {
  mainCounts: DashboardMainCounts;
  timeAlerts: DashboardTimeAlert[];
  dashboardAnalyticsStatsResponses: DashboardAnalyticsStat[];
  dashboardZoneCountResponse: DashboardZoneCountRow[];
  dashboardSiteCountResponse: DashboardSiteCountRow[];
};

export type DashboardHomeContentProps = {
  /** Fetch + render only while Home tab is visible (same as Alerts / Cameras / Live). */
  isActive: boolean;
  /** Changes whenever user taps a dashboard tab to force refresh. */
  reloadKey: number;
};

export default function DashboardHomeContent({ isActive, reloadKey }: Readonly<DashboardHomeContentProps>) {
  const [dashboardData, setDashboardData] = useState<UnifiedDashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;

    const run = async () => {
      setDashboardLoading(true);
      setDashboardData(null);
      setDashboardError(null);
      try {
        const token = await getAuthToken();
        if (!token) {
          if (!cancelled) {
            setDashboardError('Not authenticated');
            setDashboardData(null);
          }
          return;
        }

        const orgId = await getOrganizationId();
        if (!orgId) {
          if (!cancelled) {
            setDashboardError('Organization not found. Please sign in again.');
            setDashboardData(null);
          }
          return;
        }

        const { startTime, endTime } = getDashboardDayRangeUtc();

        if (__DEV__) {
          console.log('[dashboard] GET /dashboard/sites', {
            orgId,
            siteId: DASHBOARD_SITE_ID,
            startTime,
            endTime,
          });
        }

        const { data: raw } = await apiClient.get<ApiEnvelope<UnifiedDashboardResponse> | UnifiedDashboardResponse>(
          '/dashboard/sites',
          {
            params: {
              orgId,
              siteId: DASHBOARD_SITE_ID,
              startTime,
              endTime,
            },
          },
        );

        if (cancelled) return;

        const payload = unwrapDashboardPayload(raw);
        if (!payload) {
          setDashboardError('Invalid dashboard response');
          setDashboardData(null);
          return;
        }

        setDashboardData(payload);
      } catch (e) {
        if (cancelled) return;
        setDashboardError(getApiErrorMessage(e, 'Failed to load dashboard'));
        setDashboardData(null);
      } finally {
        if (cancelled) return;
        setDashboardLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isActive, reloadKey]);

  const mainCounts = dashboardData?.mainCounts;
  const cameraCount = mainCounts?.cameraCount ?? 0;
  const activeCameraCount = mainCounts?.activeCameraCount ?? 0;
  const configuredCameras = mainCounts?.configuredCameras ?? 0;
  const ppeCompliancePercentage = mainCounts?.ppeCompliancePercentage ?? '0%';
  const siteCount = mainCounts?.siteCount ?? 0;
  const zoneCount = mainCounts?.zoneCount ?? 0;

  const detectedItems = dashboardData?.dashboardAnalyticsStatsResponses ?? [];

  const peakValuesFromApi = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of dashboardData?.timeAlerts ?? []) {
      map.set(t.hour, t.count);
    }
    // Matches `PEAK_LABELS` order used by `PeakAlertsChart`.
    return ['18:00', '15:00', '12:00', '09:00', '06:00', '03:00', '00:00', '21:00'].map((h) => map.get(h) ?? 0);
  }, [dashboardData]);

  const zoneWiseRows = useMemo(() => {
    return (dashboardData?.dashboardZoneCountResponse ?? []).slice(0, 4).map((r) => ({
      label: r.zoneName,
      count: r.count,
      pct: r.percentage,
    }));
  }, [dashboardData]);

  const siteWiseRows = useMemo(() => {
    return (dashboardData?.dashboardSiteCountResponse ?? []).slice(0, 4).map((r) => ({
      label: r.siteName,
      count: r.count,
      pct: r.percentage,
    }));
  }, [dashboardData]);

  const loading = dashboardLoading;

  return (
    <VStack space="md" pt="$2" pb="$6" bg={PAGE_BG}>
      {dashboardError ? (
        <Box bg={CARD} borderRadius={12} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$3">
          <Text color={CORAL} fontSize={13}>
            {dashboardError}
          </Text>
        </Box>
      ) : null}

      {loading ? <DashboardHomeSkeleton /> : null}

      {!loading && dashboardData ? (
        <>
      <StatCard
        title="CAMERA STATUS"
        value={`${activeCameraCount}/${cameraCount}`}
        subtitle="Online cameras"
        icon="videocam-outline"
        iconColor="#4caf50"
      />
      <StatCard
        title="AI MODULE CONFIGURATION"
        value={`${configuredCameras}/${cameraCount}`}
        subtitle="Total configured"
        icon="settings-outline"
        iconColor="#9c27b0"
      />
      <StatCard
        title="PPE COMPLIANCE"
        value={ppeCompliancePercentage}
        subtitle="Total PPE Violations"
        icon="shield-checkmark-outline"
        iconColor="#2196f3"
      />
      <InfrastructureCard sites={siteCount} zones={zoneCount} />

      <Box bg={CARD} borderRadius={16} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4" mt="$1">
        <SectionHeader title="Detected Items" subtitle="Categories and counts" />
        <VStack space="sm">
          {detectedItems.filter((d) => Boolean(d.modelType)).length === 0 ? (
            <Text color={MUTED} fontSize={13}>
              No detections in the current sample.
            </Text>
          ) : (
            detectedItems
              .filter((d) => Boolean(d.modelType))
              .map((d, idx) => {
                const type = String(d.modelType ?? '').toUpperCase();
                const count = d.count;
                const accent = d.color ?? (idx < 2 ? CYAN : GREEN);
                const pctText = d.percentage ?? '0.00%';
                const rowBg = DETECTED_ROW_TINTS[idx % DETECTED_ROW_TINTS.length];
                return (
                <HStack
                  key={type + idx}
                  alignItems="center"
                  justifyContent="space-between"
                  bg={rowBg}
                  borderRadius={10}
                  borderWidth={1}
                  borderColor="rgba(139, 148, 158, 0.2)"
                  px="$3"
                  py="$3"
                >
                  <Text color={VALUE} fontSize={12} fontWeight="$bold" flex={1} numberOfLines={1}>
                    {type}
                  </Text>
                  <HStack space="md" alignItems="center">
                    <Text color={VALUE} fontSize={13} fontWeight="$semibold">
                      {formatInt(count)}
                    </Text>
                    <Text color={accent} fontSize={13} fontWeight="$bold" minWidth={70} textAlign="right">
                      {pctText}
                    </Text>
                  </HStack>
                </HStack>
              );
            })
          )}
        </VStack>
      </Box>

      <Box bg={CARD} borderRadius={16} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
        <SectionHeader title="Peak Alerts" subtitle="Live view of visitor volume throughout the day" />
        <PeakAlertsChart values={peakValuesFromApi} />
      </Box>

      <Box bg={CARD} borderRadius={20} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
        <SectionHeader title="Zone-wise Alerts" subtitle="Alerts grouped by zones" />
        <HStack flexWrap="wrap" justifyContent="space-between">
          {[0, 1, 2, 3].map((slot) => {
            const row = zoneWiseRows[slot];
            if (!row) {
              return (
                <Box
                  key={`z-empty-${slot}`}
                  w="48%"
                  mb="$3"
                  bg="rgba(20, 27, 45, 0.6)"
                  borderRadius={12}
                  borderWidth={1}
                  borderColor={CARD_BORDER}
                  p="$3"
                  minHeight={100}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color={MUTED} fontSize={12}>
                    —
                  </Text>
                </Box>
              );
            }
            const isTop = slot === 0;
            const accent = isTop ? ORANGE : SKY;
            return (
              <Box
                key={row.label + slot}
                w="48%"
                mb="$3"
                bg="rgba(20, 27, 45, 0.95)"
                borderRadius={12}
                borderWidth={1}
                borderColor={CARD_BORDER}
                p="$3"
              >
                <Text color={MUTED} fontSize={10} fontWeight="$bold" letterSpacing={0.5} mb="$2">
                  {row.label.toUpperCase()}
                </Text>
                <HStack alignItems="baseline" space="sm" mb="$3">
                  <Text color={VALUE} fontSize={26} fontWeight="$bold">
                    {formatInt(row.count)}
                  </Text>
                  <Text color={accent} fontSize={14} fontWeight="$semibold">
                    +{formatPct(row.pct)}
                  </Text>
                </HStack>
                <Box h={4} borderRadius={2} bg={accent} />
              </Box>
            );
          })}
        </HStack>
      </Box>

      <Box bg={CARD} borderRadius={16} borderWidth={1} borderColor={CARD_BORDER} px="$4" py="$4">
        <SectionHeader title="Site-wise Alerts" subtitle="Top sites by alert volume" />
        <VStack space="md">
          {siteWiseRows.length === 0 ? (
            <Text color={MUTED} fontSize={13}>
              No site data yet.
            </Text>
          ) : (
            siteWiseRows.map((row, idx) => {
              const rank = idx + 1;
              const barColor = rank === 1 ? BAR_ORANGE : BAR_BLUE;
              const pctWidth = Math.min(100, Math.max(0, row.pct));
              return (
                <VStack
                  key={row.label + rank}
                  space="sm"
                  py="$2"
                  borderTopWidth={idx === 0 ? 0 : 1}
                  borderTopColor="rgba(139, 148, 158, 0.12)"
                >
                  <HStack alignItems="center" justifyContent="space-between">
                    <HStack space="md" alignItems="center" flex={1}>
                      <Box
                        w={28}
                        h={28}
                        borderRadius={999}
                        borderWidth={1}
                        borderColor="rgba(148, 163, 184, 0.45)"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color={MUTED} fontSize={12} fontWeight="$bold">
                          {rank}
                        </Text>
                      </Box>
                      <Text color={VALUE} fontSize={15} fontWeight="$bold" numberOfLines={1} flexShrink={1}>
                        {row.label}
                      </Text>
                    </HStack>
                    <HStack space="md" alignItems="center">
                      <Text color={CORAL} fontSize={14} fontWeight="$semibold">
                        {formatPct(row.pct)}
                      </Text>
                      <Text color={VALUE} fontSize={15} fontWeight="$bold">
                        {formatInt(row.count)}
                      </Text>
                    </HStack>
                  </HStack>
                  <View style={siteRowStyles.track}>
                    <View style={[siteRowStyles.barFill, { width: `${pctWidth}%`, backgroundColor: barColor }]} />
                  </View>
                </VStack>
              );
            })
          )}
        </VStack>
      </Box>
        </>
      ) : null}
    </VStack>
  );
}
