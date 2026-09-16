import type { Alarm, Weekday } from '../alarms/alarm-types';
import { parseTime } from '../alarms/alarms-model';

export type Confirmations = Record<string, string>;

export const lastOccurrenceBefore = (alarm: Alarm, before: Date): Date | null => {
  if (!alarm.enabled || alarm.weekdays.length === 0) return null;
  const { hours, minutes } = parseTime(alarm.time);

  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(before);
    candidate.setDate(candidate.getDate() - offset);
    candidate.setHours(hours, minutes, 0, 0);
    if (candidate.getTime() > before.getTime()) continue;
    if ((alarm.weekdays as Weekday[]).includes(candidate.getDay() as Weekday)) return candidate;
  }

  return null;
};

export const isConfirmedAfter = (
  confirmations: Confirmations,
  alarmId: string,
  at: Date,
): boolean => {
  const iso = confirmations[alarmId];
  if (!iso) return false;
  const time = new Date(iso).getTime();
  return Number.isFinite(time) && time > at.getTime();
};
