import { Platform } from 'react-native';

/** 仅 Web 可读 URL 查询参数；真机禁止碰 window.location（会闪退） */
export function getWebSearchParam(name: string): string | null {
  if (Platform.OS !== 'web') return null;
  try {
    if (typeof window === 'undefined' || !window.location?.search) return null;
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

export function hasWebQaParam(): boolean {
  return getWebSearchParam('qa') != null;
}
