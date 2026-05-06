import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import camerasReducer from '../features/cameras/camerasSlice';
import sitesReducer from '../features/sites/sitesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sites: sitesReducer,
    cameras: camerasReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ['auth.user'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
