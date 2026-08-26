import { SIGN_H, SIGN_W } from '../components/SignaturePad';

/** 把签字路径转成可入库、可预览的 SVG data URL */
export function signaturePathsToDataUrl(paths: string[]): string {
  const valid = paths.map((d) => d.trim()).filter(Boolean);
  if (!valid.length) return '';
  const body = valid
    .map(
      (d) =>
        `<path d="${d.replace(/"/g, '')}" fill="none" stroke="#1A2B3C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIGN_W}" height="${SIGN_H}" viewBox="0 0 ${SIGN_W} ${SIGN_H}"><rect width="100%" height="100%" fill="#ffffff"/>${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
