export type AlertWorkflowStatus = 'NEW' | 'PICKED' | 'RESOLVED' | string;

export type AlertTimelineItem = {
  analyticsId?: string;
  cameraId?: string;
  cameraName?: string | null;
  comment?: string | null;
  userId?: string | null;
  userName?: string | null;
  workFlowStatus?: AlertWorkflowStatus;
};

export type AlertDto = {
  id: string;
  cameraId?: string;
  cameraName?: string | null;
  modelType?: string | null;
  duration?: number | null;
  personId?: string | null;
  personName?: string | null;
  priority?: string | null;
  receivedAt?: string | null;
  startEpochTime?: number | null;
  endEpochTime?: number | null;
  /** Base64 or data-URI snapshot from analytics API */
  frame?: string | null;
  thumbnail?: string | null;
  /** Clip or stream URL when provided by analytics API */
  event?: string | null;
  siteId?: string | null;
  siteName?: string | null;
  zoneId?: string | null;
  zoneName?: string | null;
  currentTimeLine?: AlertTimelineItem | null;
  timeLine?: AlertTimelineItem[] | null;
};

export type AlertsPageDto = {
  content: AlertDto[];
  totalElements?: number;
  totalPages?: number;
  pageNumber?: number;
  pageSize?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
};
