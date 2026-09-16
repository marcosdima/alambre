import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { storage } from '../storage';
import { getJson, removeJson, setJson } from 'alambre';
import { createActiveRoutine, extendExpiry, isExpired, type ActiveRoutine } from './activation-model';
import type { Alarm } from '../alarms/alarm-types';

const ACTIVE_ROUTINE_KEY = 'colguetti.activeRoutine';

type ActivationContextValue = {
  active: ActiveRoutine | null;
  activate: (alarm: Alarm) => Promise<void>;
  deactivate: () => Promise<void>;
  snooze: (minutes: number) => Promise<void>;
};

const ActivationContext = createContext<ActivationContextValue | undefined>(undefined);

export const ActivationProvider = ({ children }: { children: ReactNode }) => {
  const [active, setActive] = useState<ActiveRoutine | null>(null);

  useEffect(() => {
    let mounted = true;
    void getJson<ActiveRoutine>(storage, ACTIVE_ROUTINE_KEY).then((stored) => {
      if (!mounted) return;
      setActive(stored && !isExpired(stored) ? stored : null);
    });
    return () => { mounted = false; };
  }, []);

  const activate = useCallback(async (alarm: Alarm) => {
    const next = createActiveRoutine(alarm);
    setActive(next);
    await setJson(storage, ACTIVE_ROUTINE_KEY, next);
  }, []);

  const deactivate = useCallback(async () => {
    setActive(null);
    await removeJson(storage, ACTIVE_ROUTINE_KEY);
  }, []);

  const snooze = useCallback(async (minutes: number) => {
    setActive((current) => {
      if (!current) return current;
      const next = extendExpiry(current, minutes);
      void setJson(storage, ACTIVE_ROUTINE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ active, activate, deactivate, snooze }),
    [active, activate, deactivate, snooze],
  );

  return <ActivationContext.Provider value={value}>{children}</ActivationContext.Provider>;
};

export const useActivation = (): ActivationContextValue => {
  const ctx = useContext(ActivationContext);
  if (!ctx) throw new Error('useActivation must be used within ActivationProvider');
  return ctx;
};
