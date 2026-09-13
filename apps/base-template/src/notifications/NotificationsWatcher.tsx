import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigator } from 'alambre';
import { useAlarms } from '../alarms/alarms-context';
import { useLang } from '../providers/lang';
import { useRouteIntent } from '../navigator/RouteIntent';
import { syncSchedule } from './sync';

type AlarmIdData = { alarmId?: unknown };

export const NotificationsWatcher = () => {
  const { alarms } = useAlarms();
  const { lang, currentLang } = useLang();
  const { navigate } = useNavigator();
  const { setIntent } = useRouteIntent();
  const alarmsRef = useRef(alarms);
  const bodyRef = useRef(lang.home.notificationBody);

  useEffect(() => { alarmsRef.current = alarms; }, [alarms]);
  useEffect(() => { bodyRef.current = lang.home.notificationBody; }, [lang]);

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
    };
    void setup();
  }, [currentLang]);

  useEffect(() => {
    void syncSchedule(alarms, lang.home.notificationBody);
  }, [alarms, lang]);

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
      if (state === 'active') void syncSchedule(alarmsRef.current, bodyRef.current);
    });
    return () => sub.remove();
  }, []);

  return null;
};
