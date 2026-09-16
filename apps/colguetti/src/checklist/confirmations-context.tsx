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
import { getJson, setJson } from '../storage/json-storage';
import type { Confirmations } from './checklist-model';

const CONFIRMATIONS_KEY = 'colguetti.confirmations';

type ConfirmationsContextValue = {
  confirmations: Confirmations;
  confirm: (alarmId: string, at?: Date) => Promise<void>;
};

const ConfirmationsContext = createContext<ConfirmationsContextValue | undefined>(undefined);

export const ConfirmationsProvider = ({ children }: { children: ReactNode }) => {
  const [confirmations, setConfirmations] = useState<Confirmations>({});

  useEffect(() => {
    let mounted = true;
    void getJson<Confirmations>(asyncStorageRaw, CONFIRMATIONS_KEY).then((stored) => {
      if (mounted) setConfirmations(stored ?? {});
    });
    return () => { mounted = false; };
  }, []);

  const confirm = useCallback(async (alarmId: string, at: Date = new Date()) => {
    setConfirmations((current) => {
      const next = { ...current, [alarmId]: at.toISOString() };
      void setJson(asyncStorageRaw, CONFIRMATIONS_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ confirmations, confirm }),
    [confirmations, confirm],
  );

  return <ConfirmationsContext.Provider value={value}>{children}</ConfirmationsContext.Provider>;
};

export const useConfirmations = (): ConfirmationsContextValue => {
  const ctx = useContext(ConfirmationsContext);
  if (!ctx) throw new Error('useConfirmations must be used within ConfirmationsProvider');
  return ctx;
};
