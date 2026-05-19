import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api/client';
import { getApiErrorMessage } from '../../utils/apiError';
import { getAuthToken } from '../../utils/storage';
import { extractNotificationsPage } from './notificationsResponse';
import type { NotificationDto } from './notifications.types';

export const NOTIFICATIONS_PAGE_SIZE = 20;

export type FetchNotificationsArgs = {
  pageNo?: number;
  pageSize?: number;
  append?: boolean;
};

export const fetchNotifications = createAsyncThunk<
  {
    content: NotificationDto[];
    pageNumber?: number;
    hasNext?: boolean;
    append: boolean;
  },
  FetchNotificationsArgs | void,
  { rejectValue: string }
>('notifications/fetchPaged', async (args, { rejectWithValue }) => {
  const token = await getAuthToken();
  if (!token) {
    return rejectWithValue('Not authenticated');
  }

  const pageNo = args && typeof args === 'object' ? (args.pageNo ?? 0) : 0;
  const pageSize =
    args && typeof args === 'object' ? (args.pageSize ?? NOTIFICATIONS_PAGE_SIZE) : NOTIFICATIONS_PAGE_SIZE;
  const append = args && typeof args === 'object' ? (args.append ?? false) : false;

  try {
    const { data } = await apiClient.get<unknown>('/notification/paged', {
      params: { pageNo, pageSize },
    });
    const pageDto = extractNotificationsPage(data);
    if (!pageDto) {
      return rejectWithValue('Invalid notifications response');
    }
    return {
      content: pageDto.content,
      pageNumber: pageDto.pageNumber,
      hasNext: pageDto.hasNext,
      append,
    };
  } catch (e) {
    return rejectWithValue(getApiErrorMessage(e, 'Failed to load notifications'));
  }
});

export type MarkNotificationsReadArgs = {
  notificationId?: string | null;
  readAll?: boolean;
};

export const markNotificationsRead = createAsyncThunk<
  string,
  MarkNotificationsReadArgs | void,
  { rejectValue: string }
>('notifications/markRead', async (args, { rejectWithValue }) => {
  const token = await getAuthToken();
  if (!token) {
    return rejectWithValue('Not authenticated');
  }

  const readAll = args && typeof args === 'object' ? (args.readAll ?? true) : true;
  const notificationId = args && typeof args === 'object' ? (args.notificationId ?? null) : null;

  try {
    const { data } = await apiClient.put<unknown>('/notification', {
      notificationId,
      readAll,
    });

    if (data && typeof data === 'object') {
      const body = data as Record<string, unknown>;
      if (typeof body.status === 'string' && body.status.toUpperCase() !== 'SUCCESS') {
        return rejectWithValue(
          typeof body.message === 'string' ? body.message : 'Failed to mark notifications as read',
        );
      }
      if (typeof body.message === 'string' && body.message.trim()) {
        return body.message;
      }
    }

    return readAll ? 'All notifications marked as read' : 'Notification marked as read';
  } catch (e) {
    return rejectWithValue(getApiErrorMessage(e, 'Failed to mark notifications as read'));
  }
});

type NotificationsState = {
  items: NotificationDto[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  pageNumber: number;
  hasNext: boolean;
  isLoadingMore: boolean;
  markReadStatus: 'idle' | 'loading';
  error: string | null;
};

const initialState: NotificationsState = {
  items: [],
  status: 'idle',
  pageNumber: 0,
  hasNext: false,
  isLoadingMore: false,
  markReadStatus: 'idle',
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications(state) {
      state.items = [];
      state.status = 'idle';
      state.pageNumber = 0;
      state.hasNext = false;
      state.isLoadingMore = false;
      state.markReadStatus = 'idle';
      state.error = null;
    },
    markAllNotificationsRead(state) {
      for (const item of state.items) {
        item.read = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state, action) => {
        const append = Boolean(
          action.meta.arg && typeof action.meta.arg === 'object' && action.meta.arg.append,
        );
        state.status = 'loading';
        state.error = null;
        state.isLoadingMore = append;
        if (!append) {
          state.items = [];
          state.pageNumber = 0;
          state.hasNext = false;
        }
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isLoadingMore = false;
        state.pageNumber = action.payload.pageNumber ?? 0;
        state.hasNext = Boolean(action.payload.hasNext);
        state.items = action.payload.append
          ? [...state.items, ...action.payload.content]
          : action.payload.content;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.isLoadingMore = false;
        state.error = action.payload ?? 'Failed to load notifications';
        const append = Boolean(
          action.meta.arg && typeof action.meta.arg === 'object' && action.meta.arg.append,
        );
        if (!append) {
          state.items = [];
        }
      })
      .addCase(markNotificationsRead.pending, (state) => {
        state.markReadStatus = 'loading';
      })
      .addCase(markNotificationsRead.fulfilled, (state, action) => {
        state.markReadStatus = 'idle';
        const readAll = Boolean(
          action.meta.arg && typeof action.meta.arg === 'object' && action.meta.arg.readAll !== false,
        );
        const notificationId =
          action.meta.arg && typeof action.meta.arg === 'object'
            ? action.meta.arg.notificationId
            : null;
        if (readAll) {
          for (const item of state.items) {
            item.read = true;
          }
        } else if (notificationId) {
          const item = state.items.find((n) => n.id === notificationId);
          if (item) item.read = true;
        }
      })
      .addCase(markNotificationsRead.rejected, (state) => {
        state.markReadStatus = 'idle';
      });
  },
});

export const { clearNotifications, markAllNotificationsRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
