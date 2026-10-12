import AppText from '../../components/AppText';
import { Linking, Pressable, ScrollView, StyleSheet,  View } from 'react-native';
import { AlambreIcons, useToast, useNavigator, DropInTitle } from 'alambre';
import { useLang } from '../../providers/lang';
import { useLightDark } from '../../providers/theme';
import { useConfig } from '../../providers/config';
import ToggleLightDark from '../../components/ToggleLightDark';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import { useNotificationPermission } from '../../notifications/notification-permission-context';

const CAFECITO_URL = 'https://cafecito.app/marcosdima';
const GITHUB_URL = 'https://github.com/marcosdima';

export const FONTS = [
  'Kranky',
  'Inter',
  'Nunito',
  'PlayfairDisplay',
  'SpaceMono',
  'sans-serif',
  'serif',
  'monospace',
];

export default () => {
  const { theme, toggleTheme, currThemeName } = useLightDark();
  const { lang, currentLang, changeLang } = useLang();
  const { config, saveField } = useConfig();
  const { show } = useToast();
  const { permission, loading, requestPermission, openSettings, sendTestNotification } =
    useNotificationPermission();

  const { navigate } = useNavigator();

  const permissionHint = loading
    ? lang.settings.notificationsChecking
    : permission === 'granted'
      ? lang.settings.notificationsGranted
      : permission === 'denied'
        ? lang.settings.notificationsDenied
        : lang.settings.notificationsUndetermined;

  const permissionBadge = loading
    ? { label: lang.settings.notificationsBadgeUndetermined, tone: 'warning' as const }
    : permission === 'granted'
      ? { label: lang.settings.notificationsBadgeGranted, tone: 'success' as const }
      : permission === 'denied'
        ? { label: lang.settings.notificationsBadgeDenied, tone: 'danger' as const }
        : { label: lang.settings.notificationsBadgeUndetermined, tone: 'warning' as const };

  const currentGrace = parseInt(config.leaveGraceMinutes || '10', 10);

  const onRequestPermission = () => {
    void requestPermission();
  };

  const onOpenSettings = () => {
    void openSettings();
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

  const handleOpenCafecito = () => {
    void Linking.openURL(CAFECITO_URL);
  };

  const handleOpenGithub = () => {
    void Linking.openURL(GITHUB_URL);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.screenHeader}>
        <DropInTitle
          text={lang.settings.title}
          fontFamily={config.fontFamily}
          textStyle={[styles.screenTitle, { color: theme.color, fontFamily: config.fontFamily }]}
        />
      </View>

      {/* Tutorial */}
      <AppCard
        variant="soft"
        title={lang.settings.tutorialTitle}
        subtitle={lang.settings.tutorialSubtitle}
        style={styles.card}
      >
        <AppButton
          variant="outline"
          tone="primary"
          label={lang.settings.tutorialAction}
          onPress={() => navigate('tutorial')}
          fullWidth
        />
      </AppCard>

      {/* Idioma / Language */}
      <AppCard
        variant="soft"
        title={lang.settings.language}
        style={styles.card}
      >
        <View
          style={[
            styles.segmentedContainer,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          {(['es', 'en'] as const).map((code) => {
            const active = currentLang === code;
            const label = code === 'es' ? 'Español' : 'English';
            return (
              <Pressable
                key={code}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => changeLang(code)}
                style={[
                  styles.segmentedButton,
                  active && [
                    styles.segmentedButtonActive,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.primary,
                    },
                  ],
                ]}
              >
                <AppText
                  style={[
                    styles.segmentedText,
                    {
                      color: active ? theme.primary : theme.muted,
                      fontWeight: active ? '700' : '600',
                    },
                  ]}
                >
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      {/* Tema / Theme */}
      <AppCard
        variant="soft"
        title={lang.settings.theme}
        subtitle={
          currThemeName === 'light'
            ? lang.settings.themeSubtitleLight
            : lang.settings.themeSubtitleDark
        }
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

      {/* Tiempo de preparación predeterminado / Routine duration */}
      <AppCard
        variant="soft"
        title={lang.settings.routineDuration}
        subtitle={lang.settings.routineDurationHint}
        style={styles.card}
      >
        <View style={styles.durationRow}>
          {[5, 10, 15, 20].map((mins) => {
            const active = currentGrace === mins;
            return (
              <Pressable
                key={mins}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => void saveField('leaveGraceMinutes', String(mins))}
                style={[
                  styles.durationChip,
                  {
                    backgroundColor: active ? theme.primarySoft : theme.surfaceAlt,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <AppText
                  style={[
                    styles.durationText,
                    {
                      color: active ? theme.primary : theme.color,
                      fontWeight: active ? '700' : '600',
                    },
                  ]}
                >
                  {mins} min
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard
        variant="soft"
        title={lang.settings.typography}
        subtitle={lang.settings.typographySubtitle}
        style={styles.card}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
          {FONTS.map((font) => {
            const active = config.fontFamily === font;
            const displayLabel = font === 'PlayfairDisplay' ? 'Playfair' : font === 'SpaceMono' ? 'Space Mono' : font;
            return (
              <Pressable
                key={font}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => void saveField('fontFamily', font)}
                style={[
                  styles.fontChip,
                  {
                    backgroundColor: active ? theme.primarySoft : theme.surfaceAlt,
                    borderColor: active ? theme.primary : theme.borderSoft,
                  },
                ]}
              >
                <AppText
                  style={{
                    color: active ? theme.primary : theme.color,
                    fontFamily: font,
                    fontSize: 16,
                  }}
                >
                  {displayLabel}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </AppCard>

      {/* Notificaciones */}
      <AppCard
        variant="soft"
        title={lang.settings.notifications}
        subtitle={permissionHint}
        badge={permissionBadge.label}
        badgeTone={permissionBadge.tone}
        style={styles.card}
      >
        <View style={styles.notificationsStack}>
          {permission === 'undetermined' && (
            <AppButton
              variant="outline"
              tone="primary"
              label={lang.settings.requestPermission}
              onPress={onRequestPermission}
              fullWidth
            />
          )}
          {permission === 'denied' && (
            <AppButton
              variant="outline"
              tone="primary"
              label={lang.settings.openSettings}
              onPress={onOpenSettings}
              fullWidth
            />
          )}
          <AppButton
            variant="soft"
            tone="primary"
            label={lang.settings.testNotification}
            onPress={onTestNotification}
            fullWidth
          />
          {permission === 'granted' && (
            <AppButton
              variant="ghost"
              tone="neutral"
              label={lang.settings.openSettings}
              onPress={onOpenSettings}
              fullWidth
            />
          )}
        </View>
        <AppText style={[styles.batteryHintText, { color: theme.muted }]}>
          {lang.settings.batteryOptimizationHint}
        </AppText>
      </AppCard>

      {/* Apoyar el proyecto / Support */}
      <AppCard
        variant="soft"
        title={lang.settings.supportTitle}
        subtitle={lang.settings.supportHint}
        style={styles.card}
      >
        <AppButton
          variant="soft"
          tone="primary"
          label={lang.settings.supportAction}
          onPress={handleOpenCafecito}
          rightIcon={
            <AlambreIcons.Coffee
              color={theme.primary}
              lineWidth={2.2}
              style={styles.coffeeIcon}
            />
          }
          fullWidth
        />
      </AppCard>

      {/* Acerca de / About (no identity badges per user explicit request) */}
      <AppCard
        variant="soft"
        title={lang.settings.aboutTitle}
        style={styles.card}
      >
        <View style={styles.aboutContent}>
          <View style={styles.aboutRow}>
            <AppText style={[styles.aboutLabel, { color: theme.muted }]}>
              {lang.settings.version}
            </AppText>
            <AppText style={[styles.aboutValue, { color: theme.color }]}>
              1.0.0
            </AppText>
          </View>
          <View style={[styles.aboutDivider, { backgroundColor: theme.border }]} />
          <View style={styles.aboutRow}>
            <AppText style={[styles.aboutLabel, { color: theme.muted }]}>
              {lang.settings.developer}
            </AppText>
            <AppText style={[styles.aboutValue, { color: theme.primary }]}>
              @marcosdima
            </AppText>
          </View>

          <View style={styles.aboutActions}>
            <AppButton
              variant="outline"
              tone="primary"
              label={lang.settings.viewGithub}
              onPress={handleOpenGithub}
              rightIcon={
                <AlambreIcons.Arrow
                  drawIt
                  color={theme.primary}
                  lineWidth={16}
                  style={styles.arrowIcon}
                />
              }
              fullWidth
            />
          </View>
        </View>
      </AppCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 48,
    gap: 16,
  },
  screenHeader: {
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  screenTitle: {

    fontSize: 42,
    letterSpacing: 2,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 24,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 4,
    gap: 6,
    marginTop: 4,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  segmentedButtonActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  segmentedText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  toggleRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggle: {
    height: 60,
    aspectRatio: 3.2,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
  },
  durationText: {
    fontSize: 13,
  },
  notificationsStack: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 6,
  },
  batteryHintText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  aboutContent: {
    gap: 10,
    marginTop: 4,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  aboutLabel: {
    fontSize: 14,
  },
  aboutValue: {
    fontSize: 14,

  },
  aboutDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  aboutActions: {
    marginTop: 4,
  },
  coffeeIcon: {
    width: 18,
    height: 18,
  },
  arrowIcon: {
    width: 22,
    height: 16,
  },
  fontChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
  },
});


