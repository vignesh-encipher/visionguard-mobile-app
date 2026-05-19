import { apiClient } from '../../services/api/client';
import { extractAlertsPage } from '../alerts/alertsResponse';
import type { AlertsPageDto } from '../alerts/alerts.types';
import type { MonitorCameraDto } from './cameras.types';
import { extractCameraDetails } from './camerasResponse';

const HISTORY_PAGE_SIZE = 10;

export async function fetchMonitorCameraById(
  cameraId: string,
  userId: string,
): Promise<MonitorCameraDto> {
  const { data } = await apiClient.get<unknown>(`/monitor-cameras/${cameraId}`, {
    params: { userId },
  });
  const camera = extractCameraDetails(data);
  if (!camera) {
    throw new Error('Invalid camera response');
  }
  return camera;
}

export async function fetchCameraAnalyticsPage(
  cameraId: string,
  page: number,
  size = HISTORY_PAGE_SIZE,
): Promise<AlertsPageDto> {
  const { data } = await apiClient.get<unknown>('/analytics/paged', {
    params: {
      cameraId,
      page,
      size,
    },
  });
  const pageDto = extractAlertsPage(data);
  if (!pageDto) {
    throw new Error('Invalid analytics response');
  }
  return pageDto;
}

export { HISTORY_PAGE_SIZE };
