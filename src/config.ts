/** 与管理端同一套接口。APK / Web 都走公网 IP（Demo 暂无域名）。 */
export const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL ?? 'http://124.222.62.190/api'
).replace(/\/$/, '');
