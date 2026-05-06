import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api/client';
import { getApiErrorMessage } from '../../utils/apiError';
import { getAuthToken } from '../../utils/storage';
import type { SiteDto } from './sites.types';
import { extractSitesPage } from './sitesResponse';

export const fetchSites = createAsyncThunk<SiteDto[], void, { rejectValue: string }>(
  'sites/fetchPaged',
  async (_, { rejectWithValue }) => {
    const token = await getAuthToken();
    if (!token) {
      return rejectWithValue('Not authenticated');
    }
    try {
      const { data } = await apiClient.get<unknown>('/sites/paged', {
        params: {
          page: 0,
          size: 1002,
          active: true,
        },
      });
      const page = extractSitesPage(data);
      if (!page) {
        return rejectWithValue('Invalid sites response');
      }
      return page.content;
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e, 'Failed to load sites'));
    }
  },
);

type SitesState = {
  items: SiteDto[];
  selectedSiteId: string | null;
  selectedSiteName: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: SitesState = {
  items: [],
  selectedSiteId: null,
  selectedSiteName: 'All Sites',
  status: 'idle',
  error: null,
};

const sitesSlice = createSlice({
  name: 'sites',
  initialState,
  reducers: {
    selectSite(state, action: PayloadAction<{ id: string | null; name: string }>) {
      state.selectedSiteId = action.payload.id;
      state.selectedSiteName = action.payload.name;
    },
    clearSites(state) {
      state.items = [];
      state.selectedSiteId = null;
      state.selectedSiteName = 'All Sites';
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSites.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchSites.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load sites';
        state.items = [];
      });
  },
});

export const { selectSite, clearSites } = sitesSlice.actions;
export default sitesSlice.reducer;
