import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useLang } from '../../providers/lang';
import { useLightDark } from '../../providers/theme';
import { useToast } from 'alambre';
import ToggleLightDark from '../../components/ToggleLightDark';
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
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.color }]}>{lang.settings.language}</Text>
        <View style={styles.row}>
          {(['es', 'en'] as const).map((code) => {
            const active = currentLang === code;
            return (
              <Pressable
                key={code}
                onPress={() => changeLang(code)}
                style={({ pressed }) => [
                  styles.langChip,
                  { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primarySoft : theme.surfaceAlt },
                  pressed && styles.langChipPressed,
                ]}
              >
                <Text style={{ color: active ? theme.primary : theme.color, textTransform: 'uppercase', fontWeight: active ? '800' : '600' }}>
                  {code}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.color }]}>{lang.settings.theme}</Text>
        <ToggleLightDark
          toggle={toggleTheme}
          setLeft={currThemeName === 'light'}
          style={styles.toggle}
          colors={{
            light: {
              background: theme.surfaceAlt,
              border: theme.border,
              circle: '#0b525b',
              sun: '#f59e0b',
              moon: '#5b6572',
            },
            dark: {
              background: theme.surface,
              border: theme.border,
              circle: '#9eebce',
              sun: '#ffc266',
              moon: '#9eb0c8',
            },
          }}
        />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.color }]}>{lang.settings.notifications}</Text>
        <Text style={{ color: theme.muted }}>{permissionHint}</Text>
        <View style={styles.row}>
          {permission !== 'granted' && (
            <Pressable
              onPress={onRequestPermission}
              style={({ pressed }) => [
                styles.actionButton,
                { borderColor: theme.border, backgroundColor: theme.surfaceAlt },
                pressed && styles.langChipPressed,
              ]}
            >
              <Text style={{ color: theme.primary, fontWeight: '700' }}>
                {lang.settings.requestPermission}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={onTestNotification}
            style={({ pressed }) => [
              styles.actionButton,
              { borderColor: theme.border, backgroundColor: theme.surfaceAlt },
              pressed && styles.langChipPressed,
            ]}
          >
            <Text style={{ color: theme.primary, fontWeight: '700' }}>
              {lang.settings.testNotification}
            </Text>
          </Pressable>
        </View>
      </View>
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionLabel: {
    fontWeight: '700',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  langChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
  },
  langChipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  toggle: {
    height: 64,
    aspectRatio: 3.2,
  },
});
