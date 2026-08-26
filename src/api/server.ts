import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConfirmExportRecord } from '../types';
import { API_BASE } from '../config';
import { listConfirmRecords, markRecordsSynced } from '../data/confirmRecords';

const TOKEN_KEY = 'econfirm.api.token';

async function readToken(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(TOKEN_KEY)) || '';
  } catch {
    return '';
  }
}

async function writeToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearApiToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    };
    const token = options.token ?? (await readToken());
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
      signal: ctrl.signal,
    });
    const data = (await res.json().catch(() => ({}))) as T & { message?: string };
    if (!res.ok) {
      throw new Error(data?.message || `请求失败 (${res.status})`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function loginToServer(
  username: string,
  password: string,
): Promise<boolean> {
  try {
    const data = await request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      token: '',
    });
    if (!data.token) return false;
    await writeToken(data.token);
    return true;
  } catch {
    return false;
  }
}

export async function uploadRecords(
  records: ConfirmExportRecord[],
): Promise<{ ok: boolean; message: string }> {
  if (!records.length) return { ok: true, message: '没有待同步记录' };
  try {
    await request('/records', {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
    await markRecordsSynced(records.map((r) => r.id));
    return { ok: true, message: `已同步 ${records.length} 条` };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : '同步失败',
    };
  }
}

export async function authenticateAndSync(
  username: string,
  password: string,
): Promise<{ ok: boolean; message: string }> {
  const loggedIn = await loginToServer(username, password);
  if (!loggedIn) {
    return { ok: false, message: '服务器登录失败，记录仍保存在本机' };
  }
  return syncConfirmRecordsToServer();
}

export async function syncConfirmRecordsToServer(): Promise<{
  ok: boolean;
  message: string;
}> {
  const pending = (await listConfirmRecords()).filter((r) => !r.synced);
  return uploadRecords(pending);
}
