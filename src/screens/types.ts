export type RootStackParamList = {
  Login: undefined;
  Dashboard: {
    email: string;
    initialTab?: 'Home' | 'Live' | 'Alerts' | 'Cameras' | 'More';
  };
  Profile: { email: string };
  AlertDetails: {
    alertId: string;
    /** Where to go if the stack cannot pop (e.g. deep link). */
    returnTo?: 'alerts' | 'camera';
    cameraId?: string;
  };
  CameraDetails: { cameraId: string };
  Notifications: undefined;
};
