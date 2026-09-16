import { describe, expect, it } from 'vitest';
import {
  addAlarm,
  clampActiveWindowMinutes,
  createAlarm,
  DEFAULT_ACTIVE_WINDOW_MINUTES,
  MAX_ACTIVE_WINDOW_MINUTES,
  MIN_ACTIVE_WINDOW_MINUTES,
  nextOccurrence,
  nextUpcoming,
  occurrencesOn,
  parseTime,
  dayMatches,
  removeAlarm,
  toMinutes,
  updateAlarm,
  withActiveWindowDefault,
} from '../src/alarms/alarms-model';
import type { Alarm, AlarmInput, Weekday } from '../src/alarms/alarm-types';

const base: AlarmInput = {
  label: 'Trabajo',
  time: '08:30',
  weekdays: [1, 2, 3, 4, 5],
  enabled: true,
  itemIds: [],
  activeWindowMinutes: 10,
};

const alarmAt = (
  time: string,
  weekdays: readonly Weekday[],
  patch: Partial<AlarmInput> = {},
): Alarm => createAlarm({ ...base, time, weekdays: [...weekdays], ...patch });

describe('alarms-model time helpers', () => {
  it('parses valid times', () => {
    expect(parseTime('07:05')).toEqual({ hours: 7, minutes: 5 });
  });

  it('rejects invalid times', () => {
    expect(() => parseTime('25:00')).toThrow();
    expect(() => parseTime('8:60')).toThrow();
    expect(() => parseTime('830')).toThrow();
  });

  it('converts times to minutes', () => {
    expect(toMinutes('02:30')).toBe(150);
  });
});

describe('alarms-model day matching', () => {
  it('matches the weekday of a date (0 = Sunday)', () => {
    expect(dayMatches([0], new Date(2026, 8, 13))).toBe(true); // Sunday
    expect(dayMatches([1], new Date(2026, 8, 13))).toBe(false);
    expect(dayMatches([1], new Date(2026, 8, 14))).toBe(true); // Monday
  });
});

describe('alarms-model CRUD', () => {
  it('adds an alarm', () => {
    const next = addAlarm([], base);
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject(base);
  });

  it('updates an alarm by id without mutating the source', () => {
    const alarms = [alarmAt('08:00', [1])];
    const next = updateAlarm(alarms, alarms[0].id, { label: 'Casa' });
    expect(alarms[0].label).toBe('Trabajo');
    expect(next[0].label).toBe('Casa');
  });

  it('removes an alarm by id', () => {
    const alarms = [alarmAt('08:00', [1]), alarmAt('09:00', [2])];
    const next = removeAlarm(alarms, alarms[0].id);
    expect(next).toHaveLength(1);
    expect(next[0].label).toBe('Trabajo');
  });
});

describe('alarms-model activation window', () => {
  it('exposes the default window and the allowed range', () => {
    expect(DEFAULT_ACTIVE_WINDOW_MINUTES).toBe(10);
    expect(MIN_ACTIVE_WINDOW_MINUTES).toBe(1);
    expect(MAX_ACTIVE_WINDOW_MINUTES).toBe(60);
  });

  it('clamps minutes to the allowed range', () => {
    expect(clampActiveWindowMinutes(0)).toBe(1);
    expect(clampActiveWindowMinutes(120)).toBe(60);
    expect(clampActiveWindowMinutes(25)).toBe(25);
  });

  it('falls back to the default when the field is missing', () => {
    expect(withActiveWindowDefault(undefined)).toBe(10);
    expect(withActiveWindowDefault(30)).toBe(30);
  });
});

describe('alarms-model occurrences', () => {
  // 2026-09-14 is a Monday.
  const monday = new Date(2026, 8, 14, 8, 0, 0, 0);

  it('returns null when the alarm is disabled', () => {
    expect(nextOccurrence(alarmAt('08:30', [1], { enabled: false }), monday)).toBeNull();
  });

  it('returns null when no weekday is selected', () => {
    expect(nextOccurrence(alarmAt('08:30', []), monday)).toBeNull();
  });

  it('returns today when the time has not passed yet', () => {
    const at = new Date(2026, 8, 14, 8, 30);
    expect(nextOccurrence(alarmAt('08:30', [1]), monday)).toEqual(at);
  });

  it('skips today when the time already passed', () => {
    const at = new Date(2026, 8, 21, 8, 30); // next selected Monday
    const passed = new Date(2026, 8, 14, 9, 0);
    expect(nextOccurrence(alarmAt('08:30', [1]), passed)).toEqual(at);
  });

  it('rolls forward to the next selected weekday', () => {
    const at = new Date(2026, 8, 19, 8, 30); // Saturday
    const saturdayOnly = alarmAt('08:30', [6]);
    expect(nextOccurrence(saturdayOnly, monday)).toEqual(at);
  });

  it('picks the earliest upcoming alarm', () => {
    const alarms = [
      alarmAt('09:00', [1, 2, 3, 4, 5]),
      alarmAt('08:00', [1, 2, 3, 4, 5]),
    ];
    const best = nextUpcoming(alarms, monday);
    expect(best?.alarm.time).toBe('08:00');
    expect(best?.date).toEqual(new Date(2026, 8, 14, 8, 0));
  });

  it('ignores disabled alarms when choosing the next', () => {
    const alarms = [
      alarmAt('07:00', [1], { enabled: false }),
      alarmAt('09:00', [1, 2, 3, 4, 5]),
    ];
    expect(nextUpcoming(alarms, monday)?.alarm.time).toBe('09:00');
  });

  it('returns alarms scheduled for a given date', () => {
    const alarms = [
      alarmAt('08:00', [1, 3, 5]),
      alarmAt('09:00', [2, 4]),
    ];
    const onMonday = occurrencesOn(alarms, monday);
    expect(onMonday.map((a) => a.time)).toEqual(['08:00']);
  });
});
