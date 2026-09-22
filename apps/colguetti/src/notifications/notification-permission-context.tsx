import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as Notifications from 'expo-notifications';

export type NotificationPermission = 'undetermined' | 'granted' | 'denied';

const TEST_NOTIFICATION_ID = 'colguetti-test-notification';
const TEST_DELAY_SECONDS = 2;

type NotificationPermissionContextValue = {
  permission: NotificationPermission;
  loading: boolean;
  requestPermission: () => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
};

const NotificationPermissionContext = createContext<
  NotificationPermissionContextValue | undefined
>(undefined);

const statusToPermission = (status: Notifications.PermissionStatus): NotificationPermission => {
  switch (status) {
    case Notifications.PermissionStatus.GRANTED:
      return 'granted';
    case Notifications.PermissionStatus.DENIED:
      return 'denied';
    default:
      return 'undetermined';
  }
};

export const NotificationPermissionProvider = ({ children }: { children: ReactNode }) => {
  const [permission, setPermission] = useState<NotificationPermission>('undetermined');
  const [loading, setLoading] = useState(true);

  const readPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return statusToPermission(status);
    } catch {
      return 'denied';
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void readPermission().then((result) => {
      if (!mounted) return;
      setPermission(result);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [readPermission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const current = await readPermission();
      if (current === 'undetermined') {
        await Notifications.requestPermissionsAsync();
      }
      const after = await readPermission();
      setPermission(after);
      return after === 'granted';
    } catch {
      setPermission('denied');
      return false;
    }
  }, [readPermission]);

  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    const granted = await requestPermission();
    if (!granted) return false;
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: TEST_NOTIFICATION_ID,
        content: {
          title: 'Colguetti',
          body: 'Notificación de prueba',
          data: { kind: 'test' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: TEST_DELAY_SECONDS,
          repeats: false,
        },
      });
      return true;
    } catch {
      return false;
    }
  }, [requestPermission]);

  const value = useMemo(
    () => ({ permission, loading, requestPermission, sendTestNotification }),
    [permission, loading, requestPermission, sendTestNotification],
  );

  return (
    <NotificationPermissionContext.Provider value={value}>
      {children}
    </NotificationPermissionContext.Provider>
  );
};

export const useNotificationPermission = (): NotificationPermissionContextValue => {
  const ctx = useContext(NotificationPermissionContext);
  if (!ctx) throw new Error('useNotificationPermission must be used within NotificationPermissionProvider');
  return ctx;
};
