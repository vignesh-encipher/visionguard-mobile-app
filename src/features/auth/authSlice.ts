import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api/client';
import { getApiErrorMessage } from '../../utils/apiError';
import { clearAuthStorage, persistLoginResponse } from '../../utils/storage';
import type { LoginRequest, LoginResponse } from './auth.types';
import {
  extractAccessToken,
  extractLoginPayload,
  getLoginFailureMessage,
} from './loginResponse';

export const login = createAsyncThunk<LoginResponse, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (body, { rejectWithValue }) => {
    try {
      const { data: raw } = await apiClient.post<unknown>('/auth/login', body);

      const failMsg = getLoginFailureMessage(raw);
      if (failMsg) {
        return rejectWithValue(failMsg);
      }

      const data = extractLoginPayload(raw);
      const access = extractAccessToken(data);
      if (!access) {
        return rejectWithValue(
          data.message?.trim() || 'Login failed: no access token from server.',
        );
      }

      await persistLoginResponse(raw);
      return data;
    } catch (e) {
      return rejectWithValue(getApiErrorMessage(e, 'Login failed'));
    }
  },
);

type AuthStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type AuthState = {
  token: string | null;
  user: LoginResponse['user'] | null;
  userEmail: string | null;
  status: AuthStatus;
  error: string | null;
};

const initialState: AuthState = {
  token: null,
  user: null,
  userEmail: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.userEmail = null;
      state.status = 'idle';
      state.error = null;
      void clearAuthStorage();
    },
    rehydrateFromStorage(state, action: PayloadAction<{ token: string }>) {
      state.token = action.payload.token;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.accessToken ?? action.payload.token ?? state.token;
        state.user = action.payload.user ?? null;
        const arg = action.meta.arg.usernameOrEmail;
        const u = action.payload.user;
        const emailish =
          (typeof u?.email === 'string' && u.email) ||
          (typeof u?.username === 'string' && u.username) ||
          arg;
        state.userEmail = emailish.trim();
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Login failed';
      });
  },
});

export const { logout, rehydrateFromStorage } = authSlice.actions;
export default authSlice.reducer;
