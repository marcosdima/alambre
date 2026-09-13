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
import { readCollection, writeCollection } from '../storage/collection';
import {
  addAlarm as modelAdd,
  removeAlarm as modelRemove,
  updateAlarm as modelUpdate,
} from './alarms-model';
import type { Alarm, AlarmInput } from './alarm-types';

const ALARMS_KEY = 'colguetti.alarms';

type AlarmsContextValue = {
  alarms: Alarm[];
  loading: boolean;
  addAlarm: (input: AlarmInput) => Promise<void>;
  updateAlarm: (id: string, patch: Partial<AlarmInput>) => Promise<void>;
  removeAlarm: (id: string) => Promise<void>;
};

const AlarmsContext = createContext<AlarmsContextValue | undefined>(undefined);

const persist = (alarms: Alarm[]) => writeCollection(asyncStorageRaw, ALARMS_KEY, alarms);

export const AlarmsProvider = ({ children }: { children: ReactNode }) => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void readCollection<Alarm>(asyncStorageRaw, ALARMS_KEY).then((stored) => {
      if (!mounted) return;
      setAlarms(stored);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const addAlarmFn = useCallback(async (input: AlarmInput) => {
    const next = modelAdd(alarms, input);
    setAlarms(next);
    await persist(next);
  }, [alarms]);

  const updateAlarmFn = useCallback(async (id: string, patch: Partial<AlarmInput>) => {
    const next = modelUpdate(alarms, id, patch);
    setAlarms(next);
    await persist(next);
  }, [alarms]);

  const removeAlarmFn = useCallback(async (id: string) => {
    const next = modelRemove(alarms, id);
    setAlarms(next);
    await persist(next);
  }, [alarms]);

  const value = useMemo(
    () => ({ alarms, loading, addAlarm: addAlarmFn, updateAlarm: updateAlarmFn, removeAlarm: removeAlarmFn }),
    [alarms, loading, addAlarmFn, updateAlarmFn, removeAlarmFn],
  );

  return <AlarmsContext.Provider value={value}>{children}</AlarmsContext.Provider>;
};

export const useAlarms = (): AlarmsContextValue => {
  const ctx = useContext(AlarmsContext);
  if (!ctx) throw new Error('useAlarms must be used within AlarmsProvider');
  return ctx;
};
