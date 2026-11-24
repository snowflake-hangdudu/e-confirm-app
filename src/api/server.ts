import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConfirmExportRecord } from '../types';
import { API_BASE, STAFF_PASS, STAFF_USER } from '../config';
import { listConfirmRecords, markRecordsSynced } from '../data/confirmRecords';

const TOKEN_KEY = 'econfirm.api.token';
const REQUEST_TIMEOUT_MS = 45000;
const MAX_SIGNATURE_CHARS = 180000;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slimRecord(record: ConfirmExportRecord): ConfirmExportRecord {
  const img = record.signatureImage || '';
  return {
    ...record,
    signatureImage: img.length > MAX_SIGNATURE_CHARS ? '' : img,
  };
}

async function request<T>(
  path: string,
  options: { method?: string; body?: string; token?: string } = {},
): Promise<T> {
  const token = options.token !== undefined ? options.token : await readToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method || 'GET', `${API_BASE}${path}`, true);
    xhr.timeout = REQUEST_TIMEOUT_MS;
    xhr.responseType = 'text';
    xhr.setRequestHeader('Accept', 'application/json');
    if (options.body) {
      xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    }
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.onload = () => {
      let data: T & { message?: string } = {} as T & { message?: string };
      try {
        data = JSON.parse(xhr.responseText || '{}') as T & { message?: string };
      } catch {
        /* ignore non-json */
      }
      if (xhr.status === 401) {
        const err = new Error(data?.message || '未登录') as Error & { status?: number };
        err.status = 401;
        reject(err);
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(data?.message || `请求失败 (${xhr.status})`));
        return;
      }
      resolve(data);
    };
    xhr.onerror = () => reject(new Error('无法连接服务器'));
    xhr.ontimeout = () => reject(new Error('网络超时，请检查平板能否访问医院服务器'));
    xhr.send(options.body ?? null);
  });
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

async function ensureLoggedIn(): Promise<boolean> {
  if (await readToken()) return true;
  return loginToServer(STAFF_USER, STAFF_PASS);
}

async function postRecords(records: ConfirmExportRecord[]): Promise<void> {
  await request('/records', {
    method: 'POST',
    body: JSON.stringify({ records: records.map(slimRecord) }),
  });
}

export async function uploadRecords(
  records: ConfirmExportRecord[],
): Promise<{ ok: boolean; message: string }> {
  if (!records.length) return { ok: true, message: '没有待同步记录' };
  let lastError = '同步失败';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (attempt > 0) await sleep(800 * attempt);
      const ready = await ensureLoggedIn();
      if (!ready) {
        lastError = '服务器登录失败，记录仍保存在本机';
        continue;
      }
      await postRecords(records);
      await markRecordsSynced(records.map((r) => r.id));
      return { ok: true, message: `已同步 ${records.length} 条` };
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 401) {
        await clearApiToken();
        await loginToServer(STAFF_USER, STAFF_PASS);
      }
      lastError = err instanceof Error ? err.message : '同步失败';
    }
  }
  return { ok: false, message: lastError };
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
