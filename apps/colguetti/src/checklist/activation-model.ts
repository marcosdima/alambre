import type { Alarm } from '../alarms/alarm-types';

export type ActiveRoutine = {
  alarmId: string;
  activatedAt: string;
  expiresAt: string;
};

export type Ticks = Record<string, boolean>;

type Nameable = { id: string; name: string };

export const missingItemNames = (
  itemIds: string[],
  items: Nameable[],
  ticked: Ticks,
): string[] =>
  itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is Nameable => {
      if (!item) return false;
      return !ticked[item.id];
    })
    .map((item) => item.name);

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

export const extendExpiry = (
  active: ActiveRoutine,
  minutes: number,
  at: Date = new Date(),
): ActiveRoutine => {
  const fromNow = new Date(at.getTime() + minutes * 60_000);
  const current = new Date(active.expiresAt);
  const expiresAt = new Date(Math.max(fromNow.getTime(), current.getTime()));
  return { ...active, expiresAt: expiresAt.toISOString() };
};
