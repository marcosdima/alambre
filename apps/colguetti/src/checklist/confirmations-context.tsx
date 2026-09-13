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
import type { Confirmations, ReminderState } from './checklist-model';

const CONFIRMATIONS_KEY = 'colguetti.confirmations';
const REMINDERS_KEY = 'colguetti.reminders';

type ConfirmationsContextValue = {
  confirmations: Confirmations;
  confirm: (alarmId: string, at?: Date) => Promise<void>;
  reminders: ReminderState[];
  markReminder: (alarmId: string, at?: Date) => Promise<void>;
};

const ConfirmationsContext = createContext<ConfirmationsContextValue | undefined>(undefined);

export const ConfirmationsProvider = ({ children }: { children: ReactNode }) => {
  const [confirmations, setConfirmations] = useState<Confirmations>({});
  const [reminders, setReminders] = useState<ReminderState[]>([]);

  useEffect(() => {
    let mounted = true;
    void getJson<Confirmations>(asyncStorageRaw, CONFIRMATIONS_KEY).then((stored) => {
      if (mounted) setConfirmations(stored ?? {});
    });
    void getJson<ReminderState[]>(asyncStorageRaw, REMINDERS_KEY).then((stored) => {
      if (mounted) setReminders(stored ?? []);
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

  const markReminder = useCallback(async (alarmId: string, at: Date = new Date()) => {
    setReminders((current) => {
      const next = [...current, { alarmId, at: at.toISOString() }];
      void setJson(asyncStorageRaw, REMINDERS_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ confirmations, confirm, reminders, markReminder }),
    [confirmations, confirm, reminders, markReminder],
  );

  return <ConfirmationsContext.Provider value={value}>{children}</ConfirmationsContext.Provider>;
};

export const useConfirmations = (): ConfirmationsContextValue => {
  const ctx = useContext(ConfirmationsContext);
  if (!ctx) throw new Error('useConfirmations must be used within ConfirmationsProvider');
  return ctx;
};
