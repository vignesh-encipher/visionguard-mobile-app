export type MonitorCameraDto = {
  id: string;
  name: string;
  siteId?: string;
  siteName?: string;
  zoneId?: string;
  zoneName?: string;
  modelConfigs?: Array<string | { modelName?: string }>;
  status?: string;
  active?: boolean;
  cameraOnline?: boolean;
  isRecording?: boolean;
  optimizationType?: string | null;
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
