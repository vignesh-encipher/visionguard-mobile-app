import { useEffect } from 'react';
import { rehydrateFromStorage } from '../features/auth/authSlice';
import { useAppDispatch } from '../store/hooks';
import { getAuthToken } from '../utils/storage';

/** Restores bearer token into Redux after cold start. */
export default function RehydrateAuth() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void getAuthToken().then((token) => {
      if (token) {
        dispatch(rehydrateFromStorage({ token }));
      }
    });
  }, [dispatch]);

  return null;
}
