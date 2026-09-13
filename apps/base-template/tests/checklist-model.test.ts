import { describe, expect, it } from 'vitest';
import {
  isConfirmedAfter,
  lastOccurrenceBefore,
  pendingAlarm,
  shouldResendReminder,
  type ReminderState,
} from '../src/checklist/checklist-model';
import { createAlarm } from '../src/alarms/alarms-model';
import type { Alarm, AlarmInput } from '../src/alarms/alarm-types';

const base: AlarmInput = {
  label: 'Trabajo',
  time: '08:30',
  weekdays: [1, 2, 3, 4, 5], // Mon..Fri
  enabled: true,
  itemIds: [],
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

describe('pendingAlarm', () => {
  it('returns null when the occurrence was confirmed', () => {
    const a = alarm();
    const confirmations = { [a.id]: new Date(2026, 8, 14, 9, 0).toISOString() };
    const now = new Date(2026, 8, 14, 9, 5);
    expect(pendingAlarm([a], confirmations, now)).toBeNull();
  });

  it('returns an alarm with an unconfirmed occurrence today', () => {
    const a = alarm();
    const now = new Date(2026, 8, 14, 9, 5);
    const pending = pendingAlarm([a], {}, now);
    expect(pending?.alarm.id).toBe(a.id);
    expect(pending?.due).toEqual(new Date(2026, 8, 14, 8, 30));
  });

  it('flags withinGrace only while the grace window is open', () => {
    const a = alarm();
    const recent = pendingAlarm([a], {}, new Date(2026, 8, 14, 8, 39));
    const stale = pendingAlarm([a], {}, new Date(2026, 8, 14, 10, 0));
    expect(recent?.withinGrace).toBe(true);
    expect(stale?.withinGrace).toBe(false);
  });

  it('ignores occurrences from previous days', () => {
    const a = alarm();
    const now = new Date(2026, 8, 16, 9, 0); // Wednesday, unconfirmed
    expect(pendingAlarm([a], {}, now)?.due).toEqual(new Date(2026, 8, 16, 8, 30));
  });

  it('returns null when the latest occurrence is on a previous day', () => {
    const a = alarm({ weekdays: [1] }); // only Mondays
    const now = new Date(2026, 8, 16, 12, 0); // Wednesday
    expect(pendingAlarm([a], {}, now)).toBeNull();
  });
});

describe('shouldResendReminder', () => {
  it('sends when there is no reminder yet', () => {
    const pending = pendingAlarm([alarm()], {}, new Date(2026, 8, 14, 8, 40));
    expect(pending).not.toBeNull();
    expect(shouldResendReminder([], pending!, new Date(2026, 8, 14, 8, 40))).toBe(true);
  });

  it('does not resend outside the grace window', () => {
    const pending = pendingAlarm([alarm()], {}, new Date(2026, 8, 14, 12, 0));
    expect(pending).not.toBeNull();
    expect(shouldResendReminder([], pending!, new Date(2026, 8, 14, 12, 0))).toBe(false);
  });

  it('resends only after enough time has passed since the last reminder', () => {
    const a = alarm();
    const now = new Date(2026, 8, 14, 8, 50);
    const pending = pendingAlarm([a], {}, now);
    expect(pending).not.toBeNull();
    const recent: ReminderState[] = [{ alarmId: a.id, at: new Date(2026, 8, 14, 8, 41).toISOString() }];
    expect(shouldResendReminder(recent, pending!, now)).toBe(false);
    const old: ReminderState[] = [{ alarmId: a.id, at: new Date(2026, 8, 14, 8, 30).toISOString() }];
    expect(shouldResendReminder(old, pending!, now)).toBe(true);
  });
});
