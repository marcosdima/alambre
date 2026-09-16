import { describe, expect, it } from 'vitest';
import {
  isConfirmedAfter,
  lastOccurrenceBefore,
} from '../src/checklist/checklist-model';
import { createAlarm } from '../src/alarms/alarms-model';
import type { Alarm, AlarmInput } from '../src/alarms/alarm-types';

const base: AlarmInput = {
  label: 'Trabajo',
  time: '08:30',
  weekdays: [1, 2, 3, 4, 5], // Mon..Fri
  enabled: true,
  itemIds: [],
  activeWindowMinutes: 10,
};

const alarm = (patch: Partial<AlarmInput> = {}): Alarm => createAlarm({ ...base, ...patch });

const monday = new Date(2026, 8, 14); // Monday 2026-09-14

describe('lastOccurrenceBefore', () => {
  it('finds today when the alarm already occurred', () => {
    const before = new Date(2026, 8, 14, 12, 0);
    expect(lastOccurrenceBefore(alarm(), before)).toEqual(new Date(2026, 8, 14, 8, 30));
  });

  it('returns the previous weekday when today has not occurred yet', () => {
    const before = new Date(2026, 8, 14, 7, 0);
    expect(lastOccurrenceBefore(alarm(), before)).toEqual(new Date(2026, 8, 11, 8, 30)); // Friday
  });

  it('returns null for a disabled alarm', () => {
    expect(lastOccurrenceBefore(alarm({ enabled: false }), monday)).toBeNull();
  });

  it('returns null when no weekday is scheduled', () => {
    expect(lastOccurrenceBefore(alarm({ weekdays: [] }), monday)).toBeNull();
  });
});

describe('isConfirmedAfter', () => {
  it('is true when the confirmation is later than the occurrence', () => {
    const confirmed = new Date(2026, 8, 14, 9, 0).toISOString();
    expect(isConfirmedAfter({ a1: confirmed }, 'a1', new Date(2026, 8, 14, 8, 30))).toBe(true);
  });

  it('is false when the confirmation is earlier or missing', () => {
    const confirmed = new Date(2026, 8, 13, 9, 0).toISOString();
    expect(isConfirmedAfter({ a1: confirmed }, 'a1', new Date(2026, 8, 14, 8, 30))).toBe(false);
    expect(isConfirmedAfter({}, 'a1', monday)).toBe(false);
  });
});
