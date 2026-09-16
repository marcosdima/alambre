import * as Notifications from 'expo-notifications';

export const expiryNotificationId = (alarmId: string): string => `colguetti-expiry-${alarmId}`;

export const scheduleExpiryReminder = async (
  alarmId: string,
  at: Date,
  title: string,
  body: string,
  missing: string[] = [],
): Promise<void> => {
  const remainingSeconds = Math.ceil((at.getTime() - Date.now()) / 1000);
  if (remainingSeconds <= 0) return;

  await Notifications.scheduleNotificationAsync({
    identifier: expiryNotificationId(alarmId),
    content: {
      title,
      body,
      data: { alarmId, kind: 'expiry', missing },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: remainingSeconds,
      repeats: false,
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
  const remainingSeconds = Math.ceil((at.getTime() - Date.now()) / 1000);
  if (remainingSeconds <= 0) return;

  await Notifications.scheduleNotificationAsync({
    identifier: successNotificationId(alarmId),
    content: {
      title,
      body,
      data: { alarmId, kind: 'success' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: remainingSeconds,
      repeats: false,
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
