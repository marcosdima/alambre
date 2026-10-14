import { useMemo } from 'react';
import { createCollection } from 'alambre';
import { storage } from '../storage';
import { createId } from '../utils/id';
import { withActiveWindowDefault } from './alarms-model';
import type { Alarm, AlarmInput } from './alarm-types';

const collection = createCollection<Alarm>({
  storage,
  storageKey: 'colguetti.alarms',
});

type UseAlarmsReturn = {
  alarms: Alarm[];
  loading: boolean;
  addAlarm: (input: AlarmInput) => Promise<void>;
  updateAlarm: (id: string, patch: Partial<AlarmInput>) => Promise<void>;
  removeAlarm: (id: string) => Promise<void>;
};

export const AlarmsProvider = collection.Provider;

export const useAlarms = (): UseAlarmsReturn => {
  const { records, loading, add, update, remove } = collection.useCollection();

  return useMemo(
    () => ({
      alarms: records.map((alarm) => ({
        ...alarm,
        activeWindowMinutes: withActiveWindowDefault(alarm.activeWindowMinutes),
      })),
      loading,
      addAlarm: (input) => add({ ...input, id: createId() }),
      updateAlarm: update,
      removeAlarm: remove,
    }),
    [records, loading, add, update, remove],
  );
};
