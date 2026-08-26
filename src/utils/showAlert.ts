import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/** Web 上 RN Alert 常无反应，统一走本机提示 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  const text = message ? `${title}\n\n${message}` : title;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const actions = buttons?.filter((b) => b.text) ?? [{ text: '确定' }];
    if (actions.length <= 1) {
      window.alert(text);
      actions[0]?.onPress?.();
      return;
    }
    const ok = window.confirm(text);
    if (ok) {
      const primary =
        actions.find((b) => b.style !== 'cancel') ?? actions[actions.length - 1];
      primary?.onPress?.();
    } else {
      actions.find((b) => b.style === 'cancel')?.onPress?.();
    }
    return;
  }

  Alert.alert(title, message, buttons, { cancelable: false });
}
