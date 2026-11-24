import { Platform } from 'react-native';

/** 与 MainTabs 底栏尺寸一致；原生用绝对定位，避免进出内页时撑布局。 */
export function getTabBarMetrics(bottomInset: number) {
  const overlay = Platform.OS !== 'web';
  const bottomPad = Platform.OS === 'web' ? 8 : Math.max(bottomInset, 8);
  const height = Platform.OS === 'web' ? 64 : 62 + bottomPad;
  return { overlay, height, bottomPad };
}
