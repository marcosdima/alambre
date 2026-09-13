import * as Notifications from 'expo-notifications';
import type { Alarm } from '../alarms/alarm-types';
import { asyncStorageRaw } from '../storage/async';
import { readCollection, writeCollection } from '../storage/collection';
import {
  buildDesiredSchedule,
  diffSchedules,
  mergeSchedule,
  type StoredScheduleEntry,
} from './schedule';

export const SCHEDULE_KEY = 'colguetti.schedule';

const reschedule = async (entry: StoredScheduleEntry, body: string): Promise<void> => {
  const trigger: Notifications.NotificationTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday: entry.weekday,
    hour: entry.hour,
    minute: entry.minute,
  };
  await Notifications.scheduleNotificationAsync({
    identifier: entry.id,
    content: {
      title: entry.label,
      body,
      data: { alarmId: entry.alarmId },
    },
    trigger,
  });
};

export const cancelReminder = async (alarmId: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(`colguetti-reminder-${alarmId}`)
    .catch(() => undefined);
};

export const syncSchedule = async (alarms: Alarm[], body: string): Promise<void> => {
  const stored = await readCollection<StoredScheduleEntry>(asyncStorageRaw, SCHEDULE_KEY);
  const desired = buildDesiredSchedule(alarms);
  const { toSchedule, toCancel } = diffSchedules(desired, stored);

  if (toSchedule.length === 0 && toCancel.length === 0) return;

  const osId = await Notifications.getPermissionsAsync();
  const actuallyScheduled: StoredScheduleEntry[] = [];

  for (const entry of toSchedule) {
    if (!osId?.granted) break;
    await reschedule(entry, body);
    actuallyScheduled.push(entry);
  }

  for (const entry of toCancel) {
    await Notifications.cancelScheduledNotificationAsync(entry.id).catch(() => undefined);
  }

  const storedEntries = await readCollection<StoredScheduleEntry>(asyncStorageRaw, SCHEDULE_KEY);
  await writeCollection(
    asyncStorageRaw,
    SCHEDULE_KEY,
    mergeSchedule(storedEntries, actuallyScheduled, toCancel),
  );
};
