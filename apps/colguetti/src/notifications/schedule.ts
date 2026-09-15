import type { Alarm } from '../alarms/alarm-types';
import { parseTime } from '../alarms/alarms-model';

// expo-notifications weekly trigger: weekday 1 = Sunday ... 7 = Saturday,
// while our Alarm model uses JS getDay (0 = Sunday ... 6 = Saturday).
export const isoDayOfWeek = (weekday: number): number => weekday + 1;

export type ScheduledAlarm = {
  alarmId: string;
  weekday: number;
  hour: number;
  minute: number;
  label: string;
};

export type StoredScheduleEntry = {
  id: string;
  alarmId: string;
  weekday: number;
  hour: number;
  minute: number;
  label: string;
};

export const scheduleId = (alarmId: string, weekday: number): string => (
  `colguetti-${alarmId}-${weekday}`
);

export const buildDesiredSchedule = (alarms: Alarm[]): ScheduledAlarm[] => {
  const desired: ScheduledAlarm[] = [];

  for (const alarm of alarms) {
    if (!alarm.enabled) continue;

    let hours: number;
    let minutes: number;
    try {
      ({ hours, minutes } = parseTime(alarm.time));
    } catch {
      continue;
    }

    for (const weekday of alarm.weekdays) {
      const iso = isoDayOfWeek(weekday);
      desired.push({
        alarmId: alarm.id,
        weekday: iso,
        hour: hours,
        minute: minutes,
        label: alarm.label,
      });
    }
  }

  return desired;
};

const sameSchedule = (entry: StoredScheduleEntry, d: ScheduledAlarm): boolean => (
  entry.hour === d.hour && entry.minute === d.minute && entry.label === d.label
);

export type ScheduleDiff = {
  toSchedule: StoredScheduleEntry[];
  toCancel: StoredScheduleEntry[];
};

export const diffSchedules = (
  desired: ScheduledAlarm[],
  stored: StoredScheduleEntry[],
): ScheduleDiff => {
  const storedById = new Map(stored.map((entry) => [entry.id, entry]));
  const toSchedule: StoredScheduleEntry[] = [];
  const toCancel: StoredScheduleEntry[] = [];

  for (const d of desired) {
    const id = scheduleId(d.alarmId, d.weekday);
    const current = storedById.get(id);
    if (!current || !sameSchedule(current, d)) {
      toSchedule.push({ id, alarmId: d.alarmId, weekday: d.weekday, hour: d.hour, minute: d.minute, label: d.label });
    }
    storedById.delete(id);
  }

  toCancel.push(...storedById.values());

  return { toSchedule, toCancel };
};

export const mergeSchedule = (
  stored: StoredScheduleEntry[],
  scheduled: StoredScheduleEntry[],
  cancelled: StoredScheduleEntry[],
): StoredScheduleEntry[] => {
  const kept = stored
    .filter((entry) => !cancelled.some((c) => c.id === entry.id))
    .filter((entry) => !scheduled.some((s) => s.id === entry.id));
  return [...kept, ...scheduled];
};
