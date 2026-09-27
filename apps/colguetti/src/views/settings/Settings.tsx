import { StyleSheet, View } from 'react-native';
import { useToast } from 'alambre';
import { useLang } from '../../providers/lang';
import { useLightDark } from '../../providers/theme';
import ToggleLightDark from '../../components/ToggleLightDark';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import { AppChip } from '../../components/AppBadge';
import { useNotificationPermission } from '../../notifications/notification-permission-context';

export default () => {
  const { theme, toggleTheme, currThemeName } = useLightDark();
  const { lang, currentLang, changeLang } = useLang();
  const { show } = useToast();
  const { permission, loading, requestPermission, sendTestNotification } =
    useNotificationPermission();

  const permissionHint = loading
    ? lang.settings.notificationsChecking
    : permission === 'granted'
      ? lang.settings.notificationsGranted
      : permission === 'denied'
        ? lang.settings.notificationsDenied
        : lang.settings.notificationsUndetermined;

  const onRequestPermission = () => {
    void requestPermission();
  };

  const onTestNotification = () => {
    void (async () => {
      const ok = await sendTestNotification();
      show({
        payload: {
          title: ok
            ? lang.settings.testNotificationSent
            : lang.settings.testNotificationFailed,
          tone: ok ? 'success' : 'warning',
        },
        duration: 3000,
      });
    })();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppCard
        variant="outlined"
        title={lang.settings.language}
        style={styles.card}
      >
        <View style={styles.row}>
          {(['es', 'en'] as const).map((code) => {
            const active = currentLang === code;
            return (
              <AppChip
                key={code}
                label={code.toUpperCase()}
                selected={active}
                onPress={() => changeLang(code)}
                style={styles.langChip}
              />
            );
          })}
        </View>
      </AppCard>

      <AppCard
        variant="outlined"
        title={lang.settings.theme}
        style={styles.card}
      >
        <View style={styles.toggleRow}>
          <ToggleLightDark
            toggle={toggleTheme}
            setLeft={currThemeName === 'light'}
            style={styles.toggle}
            colors={{
              light: {
                background: theme.surfaceAlt,
                border: theme.border,
                circle: '#15803d',
                sun: '#d97706',
                moon: '#64748b',
              },
              dark: {
                background: theme.surfaceAlt,
                border: theme.border,
                circle: '#4ade80',
                sun: '#fbbf24',
                moon: '#94a3b8',
              },
            }}
          />
        </View>
      </AppCard>

      <AppCard
        variant="outlined"
        title={lang.settings.notifications}
        subtitle={permissionHint}
        style={styles.card}
      >
        <View style={styles.btnRow}>
          {permission !== 'granted' && (
            <AppButton
              variant="outline"
              tone="primary"
              label={lang.settings.requestPermission}
              onPress={onRequestPermission}
              style={styles.actionBtn}
            />
          )}
          <AppButton
            variant="soft"
            tone="primary"
            label={lang.settings.testNotification}
            onPress={onTestNotification}
            style={styles.actionBtn}
          />
        </View>
      </AppCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  card: {
    borderWidth: 1.5,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  langChip: {
    flex: 1,
    alignItems: 'center',
  },
  toggleRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggle: {
    height: 60,
    aspectRatio: 3.2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  actionBtn: {
    flex: 1,
  },
});

