import Toast from 'react-native-toast-message';

export function toastSuccess(message: string, subtitle?: string) {
  Toast.show({
    type: 'success',
    text1: message,
    text2: subtitle,
    position: 'top',
    visibilityTime: 2800,
  });
}

export function toastError(message: string, subtitle?: string) {
  Toast.show({
    type: 'error',
    text1: message,
    text2: subtitle,
    position: 'top',
    visibilityTime: 4000,
  });
}
