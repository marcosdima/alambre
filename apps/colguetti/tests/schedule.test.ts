import { describe, expect, it } from 'vitest';
import {
  buildDesiredSchedule,
  diffSchedules,
  isoDayOfWeek,
  mergeSchedule,
  scheduleId,
  type ScheduledAlarm,
  type StoredScheduleEntry,
} from '../src/notifications/schedule';
import { createAlarm } from '../src/alarms/alarms-model';
import type { Alarm, AlarmInput } from '../src/alarms/alarm-types';

const base: AlarmInput = {
  label: 'Trabajo',
  time: '08:30',
  weekdays: [1, 3, 5], // Mon, Wed, Fri
  enabled: true,
  itemIds: [],
  activeWindowMinutes: 10,
};

const alarm = (patch: Partial<AlarmInput> = {}): Alarm => (
  createAlarm({ ...base, ...patch })
);

const entries = (desired: ScheduledAlarm[]): StoredScheduleEntry[] =>
  desired.map(({ alarmId, weekday, hour, minute, label }) => ({
    id: scheduleId(alarmId, weekday),
    alarmId,
    weekday,
    hour,
    minute,
    label,
  }));

describe('schedule plan', () => {
  it('maps JS weekdays to ISO weekday numbers', () => {
    expect(isoDayOfWeek(0)).toBe(1); // Sunday
    expect(isoDayOfWeek(6)).toBe(7); // Saturday
  });

  it('builds one entry per selected weekday for enabled alarms', () => {
    const desired = buildDesiredSchedule([alarm()]);
    expect(desired).toHaveLength(3);
    expect(desired.map((d) => d.weekday)).toEqual([2, 4, 6]);
  });

  it('skips disabled alarms and alarms without weekdays', () => {
    const desired = buildDesiredSchedule([
      alarm({ enabled: false }),
      alarm({ weekdays: [] }),
      alarm({ label: 'Casa', time: '18:00' }),
    ]);
    expect(desired).toHaveLength(3);
    expect(desired.every((d) => d.label === 'Casa')).toBe(true);
  });

  it('skips alarms with an invalid time', () => {
    const desired = buildDesiredSchedule([alarm({ time: '99:99' })]);
    expect(desired).toHaveLength(0);
  });

  it('uses stable entry ids', () => {
    const d = buildDesiredSchedule([alarm()]);
    expect(entries(d)[0].id).toBe(scheduleId(d[0].alarmId, d[0].weekday));
  });
});

describe('schedule diffing', () => {
  it('schedules everything when nothing is stored', () => {
    const desired = buildDesiredSchedule([alarm()]);
    const { toSchedule, toCancel } = diffSchedules(desired, []);
    expect(toSchedule).toHaveLength(3);
    expect(toCancel).toHaveLength(0);
  });

  it('cancels entries that disappeared from the plan', () => {
    const stored = entries([{ alarmId: 'a', weekday: 2, hour: 8, minute: 30, label: 'x' }]);
    const { toSchedule, toCancel } = diffSchedules([], stored);
    expect(toSchedule).toHaveLength(0);
    expect(toCancel.map((e) => e.id)).toEqual([scheduleId('a', 2)]);
  });

  it('reschedules entries whose time changed', () => {
    const stored = entries([{ alarmId: 'a', weekday: 2, hour: 8, minute: 30, label: 'x' }]);
    const desired = [{ alarmId: 'a', weekday: 2, hour: 9, minute: 0, label: 'x' }];
    const { toSchedule, toCancel } = diffSchedules(desired, stored);
    expect(toSchedule).toHaveLength(1);
    expect(toSchedule[0]).toMatchObject({ alarmId: 'a', weekday: 2, hour: 9, minute: 0 });
    expect(toCancel).toHaveLength(0);
  });

  it('reschedules entries whose label changed', () => {
    const stored = entries([{ alarmId: 'a', weekday: 2, hour: 8, minute: 30, label: 'old' }]);
    const desired = [{ alarmId: 'a', weekday: 2, hour: 8, minute: 30, label: 'new' }];
    const { toSchedule, toCancel } = diffSchedules(desired, stored);
    expect(toSchedule).toHaveLength(1);
    expect(toSchedule[0]).toMatchObject({ alarmId: 'a', weekday: 2, hour: 8, minute: 30, label: 'new' });
    expect(toCancel).toHaveLength(0);
  });

  it('keeps entries with the same schedule', () => {
    const stored = entries([{ alarmId: 'a', weekday: 2, hour: 8, minute: 30, label: 'x' }]);
    const desired = [{ alarmId: 'a', weekday: 2, hour: 8, minute: 30, label: 'x' }];
    const { toSchedule, toCancel } = diffSchedules(desired, stored);
    expect(toSchedule).toHaveLength(0);
    expect(toCancel).toHaveLength(0);
  });

  it('merges the stored schedule after a reconciliation', () => {
    const stored = entries([{ alarmId: 'a', weekday: 2, hour: 8, minute: 30, label: 'x' }]);
    const scheduled = entries([{ alarmId: 'b', weekday: 3, hour: 9, minute: 0, label: 'y' }]);
    const merged = mergeSchedule(stored, scheduled, stored);
    expect(merged).toEqual(scheduled);
  });
});
