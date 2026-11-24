import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionState, Role } from '../types';
import { authenticateAndSync, clearApiToken, syncConfirmRecordsToServer } from '../api/server';
import { STAFF_PASS, STAFF_USER } from '../config';
import { AppState } from 'react-native';

const STORAGE_KEY = 'econfirm.session.v1';

export const initialSession: SessionState = {
  role: 'patient',
  department: '眼科病区',
  patientName: '',
  admissionNo: '',
  bedNo: '',
  familyName: '',
  relation: '无',
  selectedPartIds: [],
  bodyGender: 'male',
  bodyView: 'front',
  plannedSurgeryName: '',
  plannedSite: '',
  nurseName: '访视护士',
  familySigned: false,
  familySignaturePaths: [],
  confirmedAt: null,
  compareResult: null,
  siteSubmitted: false,
  reselectCount: 0,
};

type PersistedAuth = {
  isLoggedIn: boolean;
  staffUsername: string;
  session: SessionState;
};

type SessionContextValue = {
  isLoggedIn: boolean;
  staffUsername: string;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  session: SessionState;
  setRole: (role: Role) => void;
  update: (patch: Partial<SessionState>) => void;
  reset: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staffUsername, setStaffUsername] = useState('');
  const [session, setSession] = useState<SessionState>(initialSession);
  const [readyToPersist, setReadyToPersist] = useState(false);
  const skipNextPersist = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as PersistedAuth;
          if (parsed?.session && typeof parsed.session === 'object') {
            setSession({ ...initialSession, ...parsed.session });
          }
          // 不自动恢复登录态：每次冷启动都进登录页
          // 只恢复进行中的患者填写/指认草稿
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setReadyToPersist(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!readyToPersist || !isLoggedIn) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    const payload: PersistedAuth = { isLoggedIn, staffUsername, session };
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(
      () => {},
    );
  }, [readyToPersist, isLoggedIn, staffUsername, session]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncConfirmRecordsToServer();
      }
    });
    return () => sub.remove();
  }, [isLoggedIn]);

  const clearPersist = useCallback(async () => {
    skipNextPersist.current = true;
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      isLoggedIn,
      staffUsername,
      login: (username, password) => {
        if (username === STAFF_USER && password === STAFF_PASS) {
          setIsLoggedIn(true);
          setStaffUsername(username);
          setSession((s) => ({
            ...s,
            nurseName: username === 'admin' ? '访视护士' : username,
          }));
          void authenticateAndSync(username, password);
          return true;
        }
        return false;
      },
      logout: () => {
        void clearPersist();
        void clearApiToken();
        setIsLoggedIn(false);
        setStaffUsername('');
        setSession(initialSession);
      },
      session,
      setRole: (role) => setSession((s) => ({ ...s, role })),
      update: (patch) => setSession((s) => ({ ...s, ...patch })),
      reset: () => setSession(initialSession),
    }),
    [isLoggedIn, staffUsername, session, clearPersist],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
