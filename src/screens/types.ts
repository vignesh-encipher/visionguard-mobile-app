export type RootStackParamList = {
  Login: undefined;
  Dashboard: {
    email: string;
    initialTab?: 'Home' | 'Live' | 'Alerts' | 'Cameras' | 'More';
  };
  Profile: { email: string };
  AlertDetails: { alertId: string };
};
