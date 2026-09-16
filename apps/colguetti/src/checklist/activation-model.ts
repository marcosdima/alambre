import type { Alarm } from '../alarms/alarm-types';

export type ActiveRoutine = {
  alarmId: string;
  activatedAt: string;
  expiresAt: string;
};

export const createActiveRoutine = (
  alarm: Pick<Alarm, 'id' | 'activeWindowMinutes'>,
  at: Date = new Date(),
): ActiveRoutine => {
  const expiresAt = new Date(at.getTime() + alarm.activeWindowMinutes * 60_000);
  return {
    alarmId: alarm.id,
    activatedAt: at.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
};

export const isExpired = (active: ActiveRoutine, now: Date = new Date()): boolean => (
  now.getTime() >= new Date(active.expiresAt).getTime()
);

export const remainingMs = (active: ActiveRoutine, now: Date = new Date()): number => {
  const ms = new Date(active.expiresAt).getTime() - now.getTime();
  return ms > 0 ? ms : 0;
};
