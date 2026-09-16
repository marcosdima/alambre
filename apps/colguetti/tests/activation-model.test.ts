import { describe, expect, it } from 'vitest';
import {
  createActiveRoutine,
  extendExpiry,
  isExpired,
  missingItemNames,
  remainingMs,
  type ActiveRoutine,
} from '../src/checklist/activation-model';
import type { Alarm } from '../src/alarms/alarm-types';

const alarm = (windowMinutes: number): Pick<Alarm, 'id' | 'activeWindowMinutes'> => ({
  id: 'a1',
  activeWindowMinutes: windowMinutes,
});

describe('createActiveRoutine', () => {
  it('builds a routine that expires after the alarm window', () => {
    const at = new Date(2026, 8, 14, 8, 30, 0, 0);
    const active = createActiveRoutine(alarm(10), at);
    const expiresAt = new Date(2026, 8, 14, 8, 40, 0, 0);
    expect(active.alarmId).toBe('a1');
    expect(active.activatedAt).toBe(at.toISOString());
    expect(active.expiresAt).toBe(expiresAt.toISOString());
  });

  it('uses the current time by default', () => {
    const before = Date.now();
    const active = createActiveRoutine(alarm(5));
    const after = Date.now();
    const activatedAt = new Date(active.activatedAt).getTime();
    expect(activatedAt).toBeGreaterThanOrEqual(before);
    expect(activatedAt).toBeLessThanOrEqual(after);
  });
});

describe('isExpired', () => {
  const active: ActiveRoutine = {
    alarmId: 'a1',
    activatedAt: new Date(2026, 8, 14, 8, 30).toISOString(),
    expiresAt: new Date(2026, 8, 14, 8, 40).toISOString(),
  };

  it('is false before the deadline', () => {
    expect(isExpired(active, new Date(2026, 8, 14, 8, 39, 59))).toBe(false);
  });

  it('is true at the exact deadline and after', () => {
    expect(isExpired(active, new Date(2026, 8, 14, 8, 40))).toBe(true);
    expect(isExpired(active, new Date(2026, 8, 14, 8, 41))).toBe(true);
  });
});

describe('remainingMs', () => {
  const active: ActiveRoutine = {
    alarmId: 'a1',
    activatedAt: new Date(2026, 8, 14, 8, 30).toISOString(),
    expiresAt: new Date(2026, 8, 14, 8, 40).toISOString(),
  };

  it('returns the remaining time while active', () => {
    expect(remainingMs(active, new Date(2026, 8, 14, 8, 36))).toBe(240_000);
  });

  it('clamps to zero once expired', () => {
    expect(remainingMs(active, new Date(2026, 8, 14, 9, 0))).toBe(0);
  });
});

describe('extendExpiry', () => {
  it('pushes the deadline to at least now plus the given minutes', () => {
    const active: ActiveRoutine = {
      alarmId: 'a1',
      activatedAt: new Date(2026, 8, 14, 8, 30).toISOString(),
      expiresAt: new Date(2026, 8, 14, 8, 40).toISOString(),
    };

    const extended = extendExpiry(active, 10, new Date(2026, 8, 14, 8, 41));
    expect(extended.expiresAt).toBe(new Date(2026, 8, 14, 8, 51).toISOString());
    expect(extended.alarmId).toBe(active.alarmId);
    expect(extended.activatedAt).toBe(active.activatedAt);
  });

  it('never shortens a window that still has more time left', () => {
    const active: ActiveRoutine = {
      alarmId: 'a1',
      activatedAt: new Date(2026, 8, 14, 8, 30).toISOString(),
      expiresAt: new Date(2026, 8, 14, 9, 5).toISOString(),
    };

    const extended = extendExpiry(active, 10, new Date(2026, 8, 14, 8, 41));
    expect(extended.expiresAt).toBe(new Date(2026, 8, 14, 9, 5).toISOString());
  });
});

describe('missingItemNames', () => {
  const items = [
    { id: 'i1', name: 'llaves' },
    { id: 'i2', name: 'billetera' },
    { id: 'i3', name: 'celular' },
  ];

  it('lists every alarm item when nothing is ticked', () => {
    expect(missingItemNames(['i1', 'i2', 'i3'], items, {})).toEqual(['llaves', 'billetera', 'celular']);
  });

  it('drops ticked items and keeps the order of the alarm', () => {
    expect(missingItemNames(['i1', 'i2', 'i3'], items, { i2: true })).toEqual(['llaves', 'celular']);
  });

  it('ignores ticked items that are not part of the alarm', () => {
    expect(missingItemNames(['i1', 'i2'], items, { i3: true, i2: true })).toEqual(['llaves']);
  });

  it('skips item ids without a matching item', () => {
    expect(missingItemNames(['i1', 'ghost'], items, {})).toEqual(['llaves']);
  });
});
