export type SiteDto = {
  id: string;
  name: string;
  organizationId?: string;
  zoneCount?: number;
  cameraCount?: number;
  active?: boolean;
};

export type SitesPageDto = {
  content: SiteDto[];
  totalElements?: number;
  totalPages?: number;
  pageNumber?: number;
  pageSize?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
};
