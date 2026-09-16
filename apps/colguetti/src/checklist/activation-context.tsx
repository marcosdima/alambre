import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { asyncStorageRaw } from '../storage/async';
import { getJson, removeJson, setJson } from '../storage/json-storage';
import { createActiveRoutine, isExpired, type ActiveRoutine } from './activation-model';
import type { Alarm } from '../alarms/alarm-types';

const ACTIVE_ROUTINE_KEY = 'colguetti.activeRoutine';

type ActivationContextValue = {
  active: ActiveRoutine | null;
  activate: (alarm: Alarm) => Promise<void>;
  deactivate: () => Promise<void>;
};

const ActivationContext = createContext<ActivationContextValue | undefined>(undefined);

export const ActivationProvider = ({ children }: { children: ReactNode }) => {
  const [active, setActive] = useState<ActiveRoutine | null>(null);

  useEffect(() => {
    let mounted = true;
    void getJson<ActiveRoutine>(asyncStorageRaw, ACTIVE_ROUTINE_KEY).then((stored) => {
      if (!mounted) return;
      setActive(stored && !isExpired(stored) ? stored : null);
    });
    return () => { mounted = false; };
  }, []);

  const activate = useCallback(async (alarm: Alarm) => {
    const next = createActiveRoutine(alarm);
    setActive(next);
    await setJson(asyncStorageRaw, ACTIVE_ROUTINE_KEY, next);
  }, []);

  const deactivate = useCallback(async () => {
    setActive(null);
    await removeJson(asyncStorageRaw, ACTIVE_ROUTINE_KEY);
  }, []);

  const value = useMemo(
    () => ({ active, activate, deactivate }),
    [active, activate, deactivate],
  );

  return <ActivationContext.Provider value={value}>{children}</ActivationContext.Provider>;
};

export const useActivation = (): ActivationContextValue => {
  const ctx = useContext(ActivationContext);
  if (!ctx) throw new Error('useActivation must be used within ActivationProvider');
  return ctx;
};
