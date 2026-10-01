import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as Notifications from 'expo-notifications';
import {
  ALARM_CHANNEL_ID,
  cancelAlarmAlerts,
  expiryNotificationId,
  scheduleExpiryReminder,
  scheduleSuccessReminder,
  successNotificationId,
} from '../src/notifications/expiry';

vi.mock('expo-notifications', () => ({
  scheduleNotificationAsync: vi.fn(),
  cancelScheduledNotificationAsync: vi.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
  AndroidNotificationPriority: {
    MAX: 'max',
  },
}));

describe('expiry notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports the dedicated high-priority alarm channel ID', () => {
    expect(ALARM_CHANNEL_ID).toBe('colguetti-alarms');
  });

  it('schedules expiry reminder with DATE trigger and ALARM_CHANNEL_ID', async () => {
    const futureDate = new Date(Date.now() + 60_000);
    await scheduleExpiryReminder('a1', futureDate, 'Title', 'Body', ['llaves']);

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      expiryNotificationId('a1'),
    );
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: expiryNotificationId('a1'),
      content: {
        title: 'Title',
        body: 'Body',
        sound: true,
        priority: 'max',
        data: { alarmId: 'a1', kind: 'expiry', missing: ['llaves'] },
        categoryIdentifier: 'expiry',
      },
      trigger: {
        type: 'date',
        date: futureDate,
        channelId: ALARM_CHANNEL_ID,
      },
    });
  });

  it('does not schedule expiry reminder if date is in the past', async () => {
    const pastDate = new Date(Date.now() - 1000);
    await scheduleExpiryReminder('a1', pastDate, 'Title', 'Body', ['llaves']);

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules success reminder with DATE trigger and ALARM_CHANNEL_ID', async () => {
    const futureDate = new Date(Date.now() + 60_000);
    await scheduleSuccessReminder('a1', futureDate, 'Bravo', 'Completed');

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      successNotificationId('a1'),
    );
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: successNotificationId('a1'),
      content: {
        title: 'Bravo',
        body: 'Completed',
        sound: true,
        priority: 'max',
        data: { alarmId: 'a1', kind: 'success' },
      },
      trigger: {
        type: 'date',
        date: futureDate,
        channelId: ALARM_CHANNEL_ID,
      },
    });
  });

  it('cancels all alarm alerts including reminders', async () => {
    await cancelAlarmAlerts('a1');
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      expiryNotificationId('a1'),
    );
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      successNotificationId('a1'),
    );
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'colguetti-reminder-a1',
    );
  });
});
