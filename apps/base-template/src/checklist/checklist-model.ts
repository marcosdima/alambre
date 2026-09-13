import type { Alarm, Weekday } from '../alarms/alarm-types';
import { parseTime } from '../alarms/alarms-model';

export type Confirmations = Record<string, string>;

export type ReminderState = {
  alarmId: string;
  at: string;
};

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

const startOfDay = (date: Date): number => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
};

export type PendingAlarm = {
  alarm: Alarm;
  due: Date;
  withinGrace: boolean;
};

export const pendingAlarm = (
  alarms: Alarm[],
  confirmations: Confirmations,
  now: Date,
  graceMinutes = 10,
): PendingAlarm | null => {
  let best: PendingAlarm | null = null;

  for (const alarm of alarms) {
    if (!alarm.enabled) continue;
    const due = lastOccurrenceBefore(alarm, now);
    if (!due) continue;
    if (due.getTime() < startOfDay(now)) continue;
    if (isConfirmedAfter(confirmations, alarm.id, due)) continue;

    if (!best || due.getTime() > best.due.getTime()) {
      const withinGrace = (now.getTime() - due.getTime()) / 60000 <= graceMinutes;
      best = { alarm, due, withinGrace };
    }
  }

  return best;
};

export const shouldResendReminder = (
  reminders: ReminderState[],
  pending: PendingAlarm,
  now: Date,
  graceMinutes = 10,
  resendWindowMinutes = 60,
): boolean => {
  const minutesSinceDue = (now.getTime() - pending.due.getTime()) / 60000;
  if (minutesSinceDue > resendWindowMinutes) return false;

  const existing = reminders.find((r) => r.alarmId === pending.alarm.id);
  if (!existing) return true;
  const minutesSinceReminder = (now.getTime() - new Date(existing.at).getTime()) / 60000;
  return minutesSinceReminder >= graceMinutes;
};
