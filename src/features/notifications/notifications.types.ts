export type NotificationInfoDto = {
  infoType?: string | null;
  cameraId?: string | null;
  cameraName?: string | null;
  siteId?: string | null;
  siteName?: string | null;
  zoneId?: string | null;
  zoneName?: string | null;
};

export type NotificationDto = {
  id: string;
  message: string;
  type?: string | null;
  read: boolean;
  createdDate: string;
  notificationInfo?: NotificationInfoDto | null;
};

export type NotificationsPageDto = {
  content: NotificationDto[];
  totalElements?: number;
  totalPages?: number;
  pageNumber?: number;
  pageSize?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
};
