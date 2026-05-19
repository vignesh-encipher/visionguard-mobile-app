import type { NotificationsPageDto } from './notifications.types';

export function extractNotificationsPage(body: unknown): NotificationsPageDto | null {
  if (!body || typeof body !== 'object') return null;
  const top = body as Record<string, unknown>;

  if (typeof top.status === 'string' && top.status.toUpperCase() !== 'SUCCESS') {
    return null;
  }

  const res = top.response;
  if (!res || typeof res !== 'object') return null;
  const r = res as Record<string, unknown>;
  const content = r.content;
  if (!Array.isArray(content)) return null;

  return {
    content: content as NotificationsPageDto['content'],
    totalElements: typeof r.totalElements === 'number' ? r.totalElements : undefined,
    totalPages: typeof r.totalPages === 'number' ? r.totalPages : undefined,
    pageNumber: typeof r.pageNumber === 'number' ? r.pageNumber : undefined,
    pageSize: typeof r.pageSize === 'number' ? r.pageSize : undefined,
    hasNext: typeof r.hasNext === 'boolean' ? r.hasNext : undefined,
    hasPrevious: typeof r.hasPrevious === 'boolean' ? r.hasPrevious : undefined,
  };
}
