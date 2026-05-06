import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api/client';
import { getApiErrorMessage } from '../../utils/apiError';
import { getAuthToken } from '../../utils/storage';
import type { MonitorCameraDto } from './cameras.types';
import { extractCamerasPage } from './camerasResponse';

export type FetchMonitorCamerasArgs = {
  page?: number;
  size?: number;
  active?: boolean;
  /** When set, sent as `siteId` query param if backend supports it. */
  siteId?: string | null;
};

export const fetchMonitorCameras = createAsyncThunk<
  MonitorCameraDto[],
  FetchMonitorCamerasArgs | void,
  { rejectValue: string }
>('cameras/fetchMonitorPaged', async (args, { rejectWithValue }) => {
  const token = await getAuthToken();
  if (!token) {
    return rejectWithValue('Not authenticated');
  }

  const page = args && typeof args === 'object' ? (args.page ?? 0) : 0;
  const size = args && typeof args === 'object' ? (args.size ?? 12) : 12;
  const active = args && typeof args === 'object' ? (args.active ?? true) : true;
  const siteId = args && typeof args === 'object' ? args.siteId : undefined;

  try {
    const { data } = await apiClient.get<unknown>('/monitor-cameras/paged', {
      params: {
        page,
        size,
        active,
        ...(siteId ? { siteId } : {}),
      },
    });
    const pageDto = extractCamerasPage(data);
    if (!pageDto) {
      return rejectWithValue('Invalid cameras response');
    }
    return pageDto.content;
  } catch (e) {
    return rejectWithValue(getApiErrorMessage(e, 'Failed to load cameras'));
  }
});

type CamerasState = {
  items: MonitorCameraDto[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: CamerasState = {
  items: [],
  status: 'idle',
  error: null,
};

const camerasSlice = createSlice({
  name: 'cameras',
  initialState,
  reducers: {
    clearCameras(state) {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonitorCameras.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMonitorCameras.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchMonitorCameras.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load cameras';
        state.items = [];
      });
  },
});

export const { clearCameras } = camerasSlice.actions;
export default camerasSlice.reducer;
