export type CameraModelConfig = {
  modelType: string;
  color?: string | null;
  boxText?: string | null;
  isEnabled?: boolean;
};

export type MonitorCameraDto = {
  id: string;
  name: string;
  siteId?: string;
  siteName?: string;
  zoneId?: string;
  zoneName?: string;
  modelConfigs?: Array<string | CameraModelConfig | { modelName?: string; modelType?: string }>;
  status?: string;
  active?: boolean;
  cameraOnline?: boolean;
  isRecording?: boolean;
  optimizationType?: string | null;
  mediaMtxWebRtcUrl?: string | null;
  mediaMtxRtspUrl?: string | null;
  hlsUrl?: string | null;
  streamUrl?: string | null;
  analyticStreamUrl?: string | null;
  genericVideoFeedBroadCastUrl?: string | null;
  defaultAnalyticsUrl?: string | null;
  maxBitrate?: number | null;
  compressionEnabled?: boolean | null;
  cameraRtspPath?: string | null;
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
