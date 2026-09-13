import { useMemo, type ReactNode } from 'react';
import { createCollectionProvider, type UseCollectionType } from 'alambre';
import { asyncStorageRaw } from '../storage/async';
import { toAlambreStorage } from '../storage/alambre-storage';
import { createId } from '../utils/id';
import type { Alarm, AlarmInput } from './alarm-types';

const { Provider: AlarmsCollectionProvider, useValue } = createCollectionProvider<Alarm>({
  storage: toAlambreStorage(asyncStorageRaw),
  storageKey: 'colguetti.alarms',
  hookName: 'Alarms',
});

type UseAlarmsReturn = {
  alarms: Alarm[];
  loading: boolean;
  addAlarm: (input: AlarmInput) => Promise<void>;
  updateAlarm: (id: string, patch: Partial<AlarmInput>) => Promise<void>;
  removeAlarm: (id: string) => Promise<void>;
};

export const AlarmsProvider = ({ children }: { children: ReactNode }) => (
  <AlarmsCollectionProvider>{children}</AlarmsCollectionProvider>
);

export const useAlarms = (): UseAlarmsReturn => {
  const value = useValue() as unknown as UseCollectionType<Alarm>;

  return useMemo(
    () => ({
      alarms: value.records,
      loading: value.loading,
      addAlarm: (input) => value.add({ ...input, id: createId() }),
      updateAlarm: value.update,
      removeAlarm: value.remove,
    }),
    [value],
  );
};
