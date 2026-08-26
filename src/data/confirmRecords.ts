import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { ConfirmExportRecord } from '../types';

const STORAGE_KEY = 'econfirm.confirmRecords.v1';

/** 导出表头：与院方表格一致 */
export const EXPORT_HEADERS = [
  '日期',
  '科室',
  '住院号',
  '是否一次选择正确',
  '手术部位确认人',
] as const;

async function readRaw(): Promise<ConfirmExportRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeRaw(list: ConfirmExportRecord[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function listConfirmRecords(): Promise<ConfirmExportRecord[]> {
  const list = await readRaw();
  return list.sort((a, b) => (a.confirmedAt < b.confirmedAt ? 1 : -1));
}

export async function appendConfirmRecord(
  record: ConfirmExportRecord,
): Promise<void> {
  const list = await readRaw();
  list.push(record);
  await writeRaw(list);
}

export async function clearConfirmRecords(): Promise<void> {
  await writeRaw([]);
}

export function formatExportDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function recordsToCsv(records: ConfirmExportRecord[]): string {
  const escape = (cell: string) => {
    if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
    return cell;
  };
  const lines = [
    EXPORT_HEADERS.join(','),
    ...records.map((r) =>
      [
        formatExportDate(r.confirmedAt),
        r.department,
        r.admissionNo,
        r.firstPickCorrect ? '是' : '否',
        r.confirmerName,
      ]
        .map(escape)
        .join(','),
    ),
  ];
  return `\uFEFF${lines.join('\n')}`;
}

/** 本机导出 CSV（Web 下载；原生暂复制到剪贴板需调用方处理） */
export function downloadCsvOnWeb(csv: string, filename: string): boolean {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return false;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export async function markRecordsSynced(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const set = new Set(ids);
  const list = await readRaw();
  await writeRaw(list.map((r) => (set.has(r.id) ? { ...r, synced: true } : r)));
}
