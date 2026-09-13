import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigator } from 'alambre';
import { useAlarms } from '../alarms/alarms-context';
import { useLang } from '../providers/lang';
import { useRouteIntent } from '../navigator/RouteIntent';
import { useConfirmations } from '../checklist/confirmations-context';
import { pendingAlarm, shouldResendReminder } from '../checklist/checklist-model';
import { syncSchedule } from './sync';

type AlarmIdData = { alarmId?: unknown };

const rescheduleReminder = async (alarmId: string, body: string): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    identifier: `colguetti-reminder-${alarmId}`,
    content: {
      title: 'Colguetti',
      body,
      data: { alarmId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 600,
      repeats: false,
    },
  });
};

export const NotificationsWatcher = () => {
  const { alarms } = useAlarms();
  const { lang, currentLang } = useLang();
  const { navigate } = useNavigator();
  const { setIntent } = useRouteIntent();
  const { confirmations, reminders, markReminder } = useConfirmations();

  const alarmsRef = useRef(alarms);
  const bodyRef = useRef(lang.home.notificationBody);
  const stateRef = useRef({ confirmations, reminders });

  useEffect(() => { alarmsRef.current = alarms; }, [alarms]);
  useEffect(() => { bodyRef.current = lang.home.notificationBody; }, [lang]);
  useEffect(() => { stateRef.current = { confirmations, reminders }; }, [confirmations, reminders]);

  const reconcile = useCallback(async () => {
    const { confirmations: conf, reminders: rem } = stateRef.current;
    const now = new Date();
    const pending = pendingAlarm(alarmsRef.current, conf, now, 10);
    if (pending && shouldResendReminder(rem, pending, now, 10)) {
      await rescheduleReminder(pending.alarm.id, bodyRef.current);
      await markReminder(pending.alarm.id, now);
    }
  }, [markReminder]);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }, []);

  useEffect(() => {
    const setup = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        }).catch(() => undefined);
      }
      const existing = await Notifications.getPermissionsAsync().catch(() => null);
      if (!existing?.granted) {
        await Notifications.requestPermissionsAsync().catch(() => undefined);
      }
      void syncSchedule(alarmsRef.current, bodyRef.current);
      void reconcile();
    };
    void setup();
  }, [currentLang, reconcile]);

  useEffect(() => {
    void syncSchedule(alarms, lang.home.notificationBody);
    void reconcile();
  }, [alarms, lang, reminders, reconcile]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const { alarmId } = response.notification.request.content.data as AlarmIdData;
      if (typeof alarmId === 'string') {
        setIntent({ alarmId });
        navigate('home');
      }
    });
    return () => sub.remove();
  }, [navigate, setIntent]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncSchedule(alarmsRef.current, bodyRef.current);
        void reconcile();
      }
    });
    return () => sub.remove();
  }, [reconcile]);

  return null;
};
