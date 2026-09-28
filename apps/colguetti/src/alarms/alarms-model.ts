import { createId } from '../utils/id';
import type { Alarm, AlarmInput, Weekday } from './alarm-types';

export const DEFAULT_ACTIVE_WINDOW_MINUTES = 10;
export const MIN_ACTIVE_WINDOW_MINUTES = 1;
export const MAX_ACTIVE_WINDOW_MINUTES = 60;

export const clampActiveWindowMinutes = (minutes: number): number => (
  Math.min(MAX_ACTIVE_WINDOW_MINUTES, Math.max(MIN_ACTIVE_WINDOW_MINUTES, minutes))
);

export const withActiveWindowDefault = (
  minutes?: number,
  fallback = DEFAULT_ACTIVE_WINDOW_MINUTES,
): number => (
  clampActiveWindowMinutes(minutes ?? fallback)
);

export const createAlarm = (input: AlarmInput): Alarm => ({
  ...input,
  id: createId(),
});

export const addAlarm = (alarms: Alarm[], input: AlarmInput): Alarm[] => [
  ...alarms,
  createAlarm(input),
];

export const updateAlarm = (
  alarms: Alarm[],
  id: string,
  patch: Partial<AlarmInput>,
): Alarm[] => alarms.map((alarm) => (alarm.id === id ? { ...alarm, ...patch } : alarm));

export const removeAlarm = (alarms: Alarm[], id: string): Alarm[] => (
  alarms.filter((alarm) => alarm.id !== id)
);

export const parseTime = (time: string): { hours: number; minutes: number } => {
  const [hours, minutes] = time.split(':').map(Number);
  if (
    !time.includes(':')
    || !Number.isInteger(hours)
    || !Number.isInteger(minutes)
    || hours < 0 || hours > 23
    || minutes < 0 || minutes > 59
  ) {
    throw new Error(`Invalid time format: ${time}`);
  }
  return { hours, minutes };
};

export const toMinutes = (time: string): number => {
  const { hours, minutes } = parseTime(time);
  return hours * 60 + minutes;
};

export const dayMatches = (weekdays: Weekday[], date: Date): boolean => (
  weekdays.includes(date.getDay() as Weekday)
);

export const nextOccurrence = (alarm: Alarm, from: Date): Date | null => {
  if (!alarm.enabled || alarm.weekdays.length === 0) return null;

  const { hours, minutes } = parseTime(alarm.time);

  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(from);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);

    if (offset === 0 && candidate.getTime() < from.getTime()) continue;
    if (dayMatches(alarm.weekdays, candidate)) return candidate;
  }

  return null;
};

export const occurrencesOn = (alarms: Alarm[], date: Date): Alarm[] => (
  alarms.filter((alarm) => alarm.enabled && dayMatches(alarm.weekdays, date))
);

export const nextUpcoming = (
  alarms: Alarm[],
  now: Date,
): { alarm: Alarm; date: Date } | null => {
  let best: { alarm: Alarm; date: Date } | null = null;

  for (const alarm of alarms) {
    if (!alarm.enabled) continue;
    const date = nextOccurrence(alarm, now);
    if (date && (!best || date.getTime() < best.date.getTime())) {
      best = { alarm, date };
    }
  }

  return best;
};
