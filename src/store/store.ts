import { configureStore } from '@reduxjs/toolkit';
import alertsReducer from '../features/alerts/alertsSlice';
import authReducer from '../features/auth/authSlice';
import camerasReducer from '../features/cameras/camerasSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import sitesReducer from '../features/sites/sitesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sites: sitesReducer,
    cameras: camerasReducer,
    alerts: alertsReducer,
    notifications: notificationsReducer,
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
