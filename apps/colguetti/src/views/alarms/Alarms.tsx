import AppText from '../../components/AppText';
import { ScrollView, StyleSheet,  View } from 'react-native';
import { useConfirm, useNavigator, useToast, Switch, Typewriter } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useAlarms } from '../../alarms/alarms-context';
import { useItems } from '../../items/items-context';

import type { Item } from '../../items/item-types';
import { nextOccurrence } from '../../alarms/alarms-model';
import { cancelAlarmAlerts } from '../../notifications/expiry';
import type { Alarm } from '../../alarms/alarm-types';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';

import SwipeableItemRow from '../../components/SwipeableItemRow';
import { useRouteIntent } from '../../navigator/RouteIntent';
import { AlarmGlyph } from '../../components/illustrations/SkiaArt';

import DropInTitle from '../../components/DropInTitle';
import AnimatedDashedLine from '../../components/AnimatedDashedLine';

const AlarmVisualSummary = ({
  items,
  theme,

  weekdays,
  emptyLabel,
  lang,
  accentColor,
}: {
  items: Item[];
  theme: ReturnType<typeof useLightDark>['theme'];

  weekdays: number[];
  emptyLabel: string;
  lang: ReturnType<typeof useLang>['lang'];
  accentColor: string;
}) => {
  return (
    <View style={styles.footerRow}>
      <View style={styles.daysRow}>
        {[1, 2, 3, 4, 5, 6, 0].map((day) => {
          const isActive = weekdays.includes(day);
          return (
            <View
              key={day}
              style={[
                styles.dayBadge,
                {
                  backgroundColor: isActive ? accentColor : '#ffffff',
                },
              ]}
            >
              <AppText
                style={{
                  fontSize: 12,
                  color: isActive ? theme.background : '#8f938f', // or theme.border, using dark gray
                  fontWeight: isActive ? '600' : '400',
                }}
              >
                {lang.alarms.weekdays[day]}
              </AppText>
            </View>
          );
        })}
      </View>

      <View
        style={[
          styles.itemPill,
          { backgroundColor: items.length > 0 ? theme.surfaceAlt : 'transparent' },
        ]}
      >
        <AppText style={{ fontSize: 13, color: items.length > 0 ? accentColor : theme.muted, fontWeight: '500' }}>
          {items.length === 0
            ? emptyLabel
            : lang.alarms.count.replace('{count}', items.length.toString())}
        </AppText>
      </View>
    </View>
  );
};

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { alarms, updateAlarm, removeAlarm } = useAlarms();
  const { items } = useItems();
  const { navigate } = useNavigator();
  const { show } = useToast();
  const { confirm } = useConfirm();
  const { setIntent } = useRouteIntent();
  const cardColors = [theme.primary, theme.secondary, theme.warning, theme.danger, theme.success, theme.sand];
  const now = new Date();

  const openForm = (alarm?: Alarm) => {
    setIntent({ alarmId: alarm?.id });
    navigate('alarms', { subpage: 'alarm-form' });
  };

  const tryDelete = async (alarm: Alarm) => {
    const ok = await confirm({
      title: lang.common.confirmDeleteTitle,
      message: lang.alarms.confirmDeleteMessage.replace('{name}', alarm.label),
      confirmLabel: lang.common.confirm,
      cancelLabel: lang.common.cancel,
      tone: 'danger',
    });
    if (!ok) return;
    await removeAlarm(alarm.id);
    void cancelAlarmAlerts(alarm.id);
    show({ payload: { title: lang.alarms.deleted, content: alarm.label, tone: 'success' }, duration: 3000 });
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screenHeader}>
          <DropInTitle text={lang.alarms.title} textStyle={[styles.screenTitle, { color: theme.color }]} />
        </View>

        {alarms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AlarmGlyph line={theme.color} size={140} />
            <Typewriter
              text={lang.alarms.empty}
              textStyle={[styles.empty, { color: theme.color, opacity: 0.6 }]}
              initialDelay={300}
              cursorColor={theme.primary}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {alarms.map((alarm, index) => {
              const next = nextOccurrence(alarm, now);
              const alarmItems = items.filter((it) => alarm.itemIds.includes(it.id));
              const accentColor = alarm.enabled ? cardColors[index % cardColors.length] : theme.muted;

              return (
                <SwipeableItemRow
                  key={alarm.id}
                  onDelete={() => void tryDelete(alarm)}
                  onPress={() => openForm(alarm)}
                  peekIndex={index === 0 ? 0 : undefined}
                >
                  <AppCard
                    variant="soft"
                    padding="lg"
                    style={[
                      styles.card,
                      { borderColor: '#ffffff' },
                      !alarm.enabled && { backgroundColor: theme.surfaceAlt, opacity: 0.75 },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.headerLeft}>
                        <AppText style={[styles.timeText, { color: accentColor }]}>
                          {alarm.time}
                        </AppText>
                        <AppText style={[styles.label, { color: alarm.enabled ? theme.color : theme.muted }]} numberOfLines={1}>
                          {alarm.label}
                        </AppText>
                      </View>
                      <View style={styles.switchContainer}>
                        <Switch
                          checked={alarm.enabled}
                          onChange={(enabled) => updateAlarm(alarm.id, { enabled })}
                          size="md"
                          activeColor={theme.primary}
                          inactiveColor={theme.surfaceAlt}
                          inactiveBorderColor={theme.border}
                          accessibilityLabel={`${lang.alarms.enabledLabel} ${alarm.label}`}
                        />
                      </View>
                    </View>

                    {next && (
                      <View style={styles.metaRow}>
                        <AppText style={[styles.metaText, { color: theme.muted }]}>
                          Próx: {next.toLocaleDateString()}
                        </AppText>
                      </View>
                    )}

                    <View style={styles.cardFooter}>
                      <AnimatedDashedLine color={theme.borderSoft} delay={200 + index * 100} />
                      <View style={{ paddingTop: 12 }}>
                        <AlarmVisualSummary
                          items={alarmItems}
                          theme={theme}
                          weekdays={alarm.weekdays}
                          emptyLabel={lang.alarms.itemsLabel}
                          lang={lang}
                          accentColor={accentColor}
                        />
                      </View>
                    </View>
                  </AppCard>
                </SwipeableItemRow>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <AppButton
          variant="solid"
          tone="primary"
          size="lg"
          fullWidth
          label={lang.alarms.add}
          onPress={() => openForm()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 24,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  list: {
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 0,
  },
  timeText: {
    fontSize: 48,

    letterSpacing: 1,
    lineHeight: 52,
    includeFontPadding: false,

  },
  switchContainer: {
    justifyContent: 'center',
    paddingLeft: 16,
  },
  label: {
    fontSize: 16,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  metaRow: {
    marginTop: 0,
  },
  metaText: {
    fontSize: 13,
  },
  cardFooter: {
    marginTop: 16,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
});

