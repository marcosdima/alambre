import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigator } from 'alambre';
import { useAlarms } from '../alarms/alarms-context';
import { useLang } from '../providers/lang';
import { useRouteIntent } from '../navigator/RouteIntent';
import { syncSchedule } from './sync';

type AlarmIdData = { alarmId?: unknown };

const INVITE_BODY = /\{label\}/g;

export const NotificationsWatcher = () => {
  const { alarms } = useAlarms();
  const { lang } = useLang();
  const { navigate } = useNavigator();
  const { setIntent } = useRouteIntent();

  const alarmsRef = useRef(alarms);
  const bodyForRef = useRef<(label: string) => string>(() => lang.home.activateBody);

  useEffect(() => { alarmsRef.current = alarms; }, [alarms]);
  useEffect(() => {
    bodyForRef.current = (label: string) => lang.home.activateBody.replace(INVITE_BODY, label);
  }, [lang]);

  const sync = useCallback(async () => {
    await syncSchedule(alarmsRef.current, bodyForRef.current);
  }, []);

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
      void sync();
    };
    void setup();
  }, [sync]);

  useEffect(() => {
    void syncSchedule(alarms, bodyForRef.current);
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
      if (state === 'active') void sync();
    });
    return () => sub.remove();
  }, [sync]);

  return null;
};
