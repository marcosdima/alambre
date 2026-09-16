import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigator } from 'alambre';
import { useAlarms } from '../alarms/alarms-context';
import { useLang } from '../providers/lang';
import { useRouteIntent } from '../navigator/RouteIntent';
import { useActivation } from '../checklist/activation-context';
import { ACTIVATION_CATEGORY, syncSchedule } from './sync';
import { EXPIRY_CATEGORY, SNOOZE_ACTION, SNOOZE_MINUTES } from './expiry';

type AlarmIdData = { alarmId?: unknown; missing?: unknown };

const INVITE_BODY = /\{label\}/g;
const ACTIVATE_ACTION = 'activate';

export const NotificationsWatcher = () => {
  const { alarms } = useAlarms();
  const { lang } = useLang();
  const { navigate } = useNavigator();
  const { setIntent } = useRouteIntent();
  const { active, activate, snooze } = useActivation();

  const alarmsRef = useRef(alarms);
  const activeRef = useRef(active);
  const processedRef = useRef(new Set<string>());
  const bodyForRef = useRef<(label: string) => string>(
    () => lang.home.activateBody,
  );

  useEffect(() => {
    alarmsRef.current = alarms;
  }, [alarms]);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    bodyForRef.current = (label: string) =>
      lang.home.activateBody.replace(INVITE_BODY, label);
  }, [lang]);

  const sync = useCallback(async () => {
    await syncSchedule(alarmsRef.current, bodyForRef.current);
  }, []);

  const dismiss = useCallback((response: Notifications.NotificationResponse) => {
    void Notifications.dismissNotificationAsync(response.notification.request.identifier)
      .catch(() => undefined);
  }, []);

  const handleResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as AlarmIdData;
      const { missing } = data;
      const { alarmId } = data;

      const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (processedRef.current.has(responseKey)) return;
      processedRef.current.add(responseKey);

      if (response.actionIdentifier === ACTIVATE_ACTION && typeof alarmId === 'string') {
        const alarm = alarmsRef.current.find((current) => current.id === alarmId);
        if (alarm) {
          void activate(alarm);
        }
        dismiss(response);
        navigate('home');
        return;
      }

      if (response.actionIdentifier === SNOOZE_ACTION && typeof alarmId === 'string') {
        const alarm = alarmsRef.current.find((current) => current.id === alarmId);
        if (alarm) {
          if (activeRef.current?.alarmId === alarmId) {
            void snooze(SNOOZE_MINUTES);
          } else {
            void activate(alarm);
          }
        }
        dismiss(response);
        navigate('home');
        return;
      }

      if (typeof alarmId === 'string') {
        dismiss(response);
        setIntent(Array.isArray(missing) ? { alarmId, missing } : { alarmId });
        navigate('home');
      }
    },
    [navigate, setIntent, activate, snooze, dismiss],
  );

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
      await Notifications.setNotificationCategoryAsync(ACTIVATION_CATEGORY, [
        {
          identifier: ACTIVATE_ACTION,
          buttonTitle: lang.home.activate,
          options: { opensAppToForeground: true },
        },
      ]).catch(() => undefined);

      await Notifications.setNotificationCategoryAsync(EXPIRY_CATEGORY, [
        {
          identifier: SNOOZE_ACTION,
          buttonTitle: lang.home.snoozeCta,
          options: { opensAppToForeground: true },
        },
      ]).catch(() => undefined);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        }).catch(() => undefined);
      }
      const existing = await Notifications.getPermissionsAsync().catch(
        () => null,
      );
      if (!existing?.granted) {
        await Notifications.requestPermissionsAsync().catch(() => undefined);
      }
      void sync();
    };
    void setup();
  }, [lang, sync]);

  useEffect(() => {
    void syncSchedule(alarms, bodyForRef.current);
  }, [alarms, lang]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      handleResponse,
    );
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });
    return () => sub.remove();
  }, [handleResponse]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync();
    });
    return () => sub.remove();
  }, [sync]);

  return null;
};
