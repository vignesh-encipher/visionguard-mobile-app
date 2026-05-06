export type MonitorCameraDto = {
  id: string;
  name: string;
  siteId?: string;
  siteName?: string;
  zoneId?: string;
  zoneName?: string;
  status?: string;
  cameraOnline?: boolean;
  isRecording?: boolean;
  mediaMtxWebRtcUrl?: string | null;
  mediaMtxRtspUrl?: string | null;
  hlsUrl?: string | null;
  streamUrl?: string | null;
  ip?: string;
};

export type CamerasPageDto = {
  content: MonitorCameraDto[];
  totalElements?: number;
  totalPages?: number;
  pageNumber?: number;
  pageSize?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
};
