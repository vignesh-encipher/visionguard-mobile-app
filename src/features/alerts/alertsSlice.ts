import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api/client';
import { getApiErrorMessage } from '../../utils/apiError';
import { getAuthToken } from '../../utils/storage';
import { extractAlertDetails, extractAlertsPage } from './alertsResponse';
import type { AlertDto } from './alerts.types';

export type FetchAlertsArgs = {
  page?: number;
  size?: number;
  searchString?: string;
  append?: boolean;
  userId?: string | null;
};

export const fetchAlerts = createAsyncThunk<
  {
    content: AlertDto[];
    pageNumber?: number;
    hasNext?: boolean;
    append: boolean;
  },
  FetchAlertsArgs | void,
  { rejectValue: string }
>('alerts/fetchPaged', async (args, { rejectWithValue }) => {
  const token = await getAuthToken();
  if (!token) {
    return rejectWithValue('Not authenticated');
  }

  const page = args && typeof args === 'object' ? (args.page ?? 0) : 0;
  const size = args && typeof args === 'object' ? (args.size ?? 15) : 15;
  const searchString = args && typeof args === 'object' ? (args.searchString ?? '') : '';
  const append = args && typeof args === 'object' ? (args.append ?? false) : false;
  const userId = args && typeof args === 'object' ? (args.userId ?? undefined) : undefined;

  try {
    const { data } = await apiClient.get<unknown>('/analytics/paged', {
      params: {
        page,
        size,
        searchString,
        ...(userId ? { userId } : {}),
      },
    });
    const pageDto = extractAlertsPage(data);
    if (!pageDto) {
      return rejectWithValue('Invalid alerts response');
    }
    return {
      content: pageDto.content,
      pageNumber: pageDto.pageNumber,
      hasNext: pageDto.hasNext,
      append,
    };
  } catch (e) {
    return rejectWithValue(getApiErrorMessage(e, 'Failed to load alerts'));
  }
});

export const fetchAlertById = createAsyncThunk<
  AlertDto,
  { alertId: string },
  { rejectValue: string }
>('alerts/fetchById', async ({ alertId }, { rejectWithValue }) => {
  const token = await getAuthToken();
  if (!token) {
    return rejectWithValue('Not authenticated');
  }

  try {
    const { data } = await apiClient.get<unknown>(`/analytics/${alertId}`);
    const alert = extractAlertDetails(data);
    if (!alert) {
      return rejectWithValue('Invalid alert details response');
    }
    return alert;
  } catch (e) {
    return rejectWithValue(getApiErrorMessage(e, 'Failed to load alert details'));
  }
});

type AlertsState = {
  items: AlertDto[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  pageNumber: number;
  hasNext: boolean;
  isLoadingMore: boolean;
  detailItem: AlertDto | null;
  detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  detailError: string | null;
  error: string | null;
};

const initialState: AlertsState = {
  items: [],
  status: 'idle',
  pageNumber: 0,
  hasNext: false,
  isLoadingMore: false,
  detailItem: null,
  detailStatus: 'idle',
  detailError: null,
  error: null,
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    clearAlerts(state) {
      state.items = [];
      state.status = 'idle';
      state.pageNumber = 0;
      state.hasNext = false;
      state.isLoadingMore = false;
      state.detailItem = null;
      state.detailStatus = 'idle';
      state.detailError = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state, action) => {
        const append = Boolean(action.meta.arg && typeof action.meta.arg === 'object' && action.meta.arg.append);
        state.status = 'loading';
        state.error = null;
        state.isLoadingMore = append;
        if (!append) {
          state.items = [];
          state.pageNumber = 0;
          state.hasNext = false;
        }
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isLoadingMore = false;
        state.pageNumber = action.payload.pageNumber ?? 0;
        state.hasNext = Boolean(action.payload.hasNext);
        state.items = action.payload.append ? [...state.items, ...action.payload.content] : action.payload.content;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.status = 'failed';
        state.isLoadingMore = false;
        state.error = action.payload ?? 'Failed to load alerts';
        const append = Boolean(action.meta.arg && typeof action.meta.arg === 'object' && action.meta.arg.append);
        if (!append) {
          state.items = [];
        }
      })
      .addCase(fetchAlertById.pending, (state) => {
        state.detailStatus = 'loading';
        state.detailError = null;
      })
      .addCase(fetchAlertById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.detailItem = action.payload;
      })
      .addCase(fetchAlertById.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.detailError = action.payload ?? 'Failed to load alert details';
      });
  },
});

export const { clearAlerts } = alertsSlice.actions;
export default alertsSlice.reducer;
