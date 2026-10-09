import AppText from '../../components/AppText';
import { ScrollView, StyleSheet,  View } from 'react-native';
import { useConfirm, useNavigator, useToast } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useAlarms } from '../../alarms/alarms-context';
import { useItems } from '../../items/items-context';
import { ItemIcon } from '../../items/icon-catalog';
import type { Item } from '../../items/item-types';
import { nextOccurrence } from '../../alarms/alarms-model';
import { cancelAlarmAlerts } from '../../notifications/expiry';
import type { Alarm } from '../../alarms/alarm-types';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';

import AppSwitch from '../../components/AppSwitch';
import SwipeableItemRow from '../../components/SwipeableItemRow';
import { useRouteIntent } from '../../navigator/RouteIntent';
import { AlarmGlyph } from '../../components/illustrations/SkiaArt';
import TypewriterText from '../../components/TypewriterText';
import DropInTitle from '../../components/DropInTitle';

const AlarmVisualSummary = ({
  items,
  theme,
  enabled,
  weekdays,
  emptyLabel,
}: {
  items: Item[];
  theme: ReturnType<typeof useLightDark>['theme'];
  enabled: boolean;
  weekdays: number[];
  emptyLabel: string;
}) => {
  const visible = items.slice(0, 4);
  const remaining = items.length - 4;

  const activeColor = enabled ? theme.color : theme.muted;
  const primaryActive = enabled ? theme.primary : theme.borderSoft;

  return (
    <View style={styles.footerRow}>
      <View style={styles.daysRow}>
        {[1, 2, 3, 4, 5, 6, 0].map((day) => {
          const isActive = weekdays.includes(day);
          return (
            <View
              key={day}
              style={[
                styles.dayDot,
                {
                  backgroundColor: isActive ? primaryActive : 'transparent',
                  borderColor: isActive ? primaryActive : theme.borderSoft,
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.itemStack}>
        {items.length === 0 ? (
          <AppText style={{ fontSize: 13, color: theme.muted }}>{emptyLabel}</AppText>
        ) : (
          <>
            {visible.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.stackIcon,
                  {
                    zIndex: 4 - idx,
                    transform: [{ translateX: -idx * 8 }],
                    backgroundColor: theme.surface,
                    borderColor: theme.borderSoft,
                  },
                ]}
              >
                <View style={{ transform: [{ scale: 0.7 }] }}>
                  <ItemIcon
                    icon={item.icon}
                    color={enabled ? item.color : theme.muted}
                    lineWidth={2}
                  />
                </View>
              </View>
            ))}
            {remaining > 0 && (
              <View
                style={[
                  styles.stackIcon,
                  {
                    zIndex: 0,
                    transform: [{ translateX: -4 * 8 }],
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.borderSoft,
                  },
                ]}
              >
                <AppText style={{ fontSize: 11, color: activeColor }}>
                  +{remaining}
                </AppText>
              </View>
            )}
          </>
        )}
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

  const weekdayLabels = lang.alarms.weekdays;

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
            <TypewriterText
              text={lang.alarms.empty}
              textStyle={[styles.empty, { color: theme.color, opacity: 0.6 }]}
              initialDelay={300}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {alarms.map((alarm, index) => {
              const next = nextOccurrence(alarm, now);
              const weekdaysString = alarm.weekdays
                .map((d) => weekdayLabels[d])
                .join(' · ');

              const alarmItems = items.filter((it) => alarm.itemIds.includes(it.id));

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
                      !alarm.enabled && { backgroundColor: theme.surfaceAlt, opacity: 0.75 },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.headerLeft}>
                        <AppText style={[styles.timeText, { color: alarm.enabled ? theme.color : theme.muted }]}>
                          {alarm.time}
                        </AppText>
                        <AppText style={[styles.label, { color: alarm.enabled ? theme.color : theme.muted }]} numberOfLines={1}>
                          {alarm.label}
                        </AppText>
                      </View>
                      <View style={styles.switchContainer}>
                        <AppSwitch
                          checked={alarm.enabled}
                          onChange={(enabled) => updateAlarm(alarm.id, { enabled })}
                          size="md"
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

                    <View style={[styles.cardFooter, { borderTopColor: theme.borderSoft }]}>
                      <AlarmVisualSummary
                        items={alarmItems}
                        theme={theme}
                        enabled={alarm.enabled}
                        weekdays={alarm.weekdays}
                        emptyLabel={lang.alarms.itemsLabel}
                      />
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
    fontFamily: 'Kranky',
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
    fontFamily: 'Kranky',
    letterSpacing: 1,
    lineHeight: 52,
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
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
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    gap: 6,
  },
  dayDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  itemStack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 80,
    minHeight: 32,
  },
  stackIcon: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
});

