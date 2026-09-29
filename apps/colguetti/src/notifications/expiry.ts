import * as Notifications from 'expo-notifications';

export const expiryNotificationId = (alarmId: string): string => `colguetti-expiry-${alarmId}`;

export const SNOOZE_MINUTES = 10;
export const SNOOZE_ACTION = 'snooze';
export const EXPIRY_CATEGORY = 'expiry';
export const ALARM_CHANNEL_ID = 'colguetti-alarms';

export const scheduleExpiryReminder = async (
  alarmId: string,
  at: Date,
  title: string,
  body: string,
  missing: string[] = [],
): Promise<void> => {
  if (at.getTime() <= Date.now()) return;

  await cancelExpiryReminder(alarmId);

  await Notifications.scheduleNotificationAsync({
    identifier: expiryNotificationId(alarmId),
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { alarmId, kind: 'expiry', missing },
      categoryIdentifier: EXPIRY_CATEGORY,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
      channelId: ALARM_CHANNEL_ID,
    },
  });
};

export const cancelExpiryReminder = async (alarmId: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(expiryNotificationId(alarmId))
    .catch(() => undefined);
};

export const successNotificationId = (alarmId: string): string => `colguetti-success-${alarmId}`;

export const scheduleSuccessReminder = async (
  alarmId: string,
  at: Date,
  title: string,
  body: string,
): Promise<void> => {
  if (at.getTime() <= Date.now()) return;

  await cancelSuccessReminder(alarmId);

  await Notifications.scheduleNotificationAsync({
    identifier: successNotificationId(alarmId),
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { alarmId, kind: 'success' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
      channelId: ALARM_CHANNEL_ID,
    },
  });
};

export const cancelSuccessReminder = async (alarmId: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(successNotificationId(alarmId))
    .catch(() => undefined);
};

export const cancelAlarmAlerts = async (alarmId: string): Promise<void> => {
  await cancelExpiryReminder(alarmId);
  await cancelSuccessReminder(alarmId);
  await Notifications.cancelScheduledNotificationAsync(`colguetti-reminder-${alarmId}`)
    .catch(() => undefined);
};
