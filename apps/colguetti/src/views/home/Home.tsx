import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigator, useToast, AlambreIcons } from 'alambre';
import { withTiming, Easing } from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useAlarms } from '../../alarms/alarms-context';
import { useItems } from '../../items/items-context';
import { useConfirmations } from '../../checklist/confirmations-context';
import { nextUpcoming, occurrencesOn } from '../../alarms/alarms-model';
import { pendingAlarm } from '../../checklist/checklist-model';
import { cancelReminder } from '../../notifications/sync';
import { useRouteIntent } from '../../navigator/RouteIntent';
import type { Alarm } from '../../alarms/alarm-types';
import AppTitle from '../../components/AppTitle';
import AppButton from '../../components/AppButton';
import { ItemIcon } from '../../items/icon-catalog';
import LetterReveal from '../../components/LetterReveal';

const iconAnimation = {
  drawAnimation: (value: number) => withTiming(value, {
    duration: 460,
    easing: Easing.out(Easing.exp),
  }),
  resetAnimation: (value: number) => withTiming(value, {
    duration: 180,
    easing: Easing.in(Easing.quad),
  }),
};

const weekdayNames = (weekdays: readonly number[], locale: string): string => {
  const names = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const byIndex = Array.from({ length: 7 }, (_, i) => names.format(new Date(2000, 0, 3 + i)));
  return weekdays.map((d) => byIndex[d]).join(' ');
};

const formatTime = (time: string) => time;

export default () => {
  const { theme } = useLightDark();
  const { lang, currentLang } = useLang();
  const { alarms } = useAlarms();
  const { items } = useItems();
  const { confirmations, confirm } = useConfirmations();
  const { navigate } = useNavigator();
  const { show } = useToast();
  const { intent, setIntent } = useRouteIntent();

  const [routine, setRoutine] = useState<Alarm | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);

  const upcoming = nextUpcoming(alarms, new Date());
  const todaysAlarms = occurrencesOn(alarms, new Date());
  const pending = pendingAlarm(alarms, confirmations, new Date(), 10);

  useEffect(() => {
    if (intent.alarmId) {
      const target = alarms.find((a) => a.id === intent.alarmId);
      if (target) setRoutine(target);
      else setRoutine(null);
      setIntent({});
    }
  }, [intent.alarmId, alarms, setIntent]);

  const routineItems = useMemo(
    () => (routine ? items.filter((item) => routine.itemIds.includes(item.id)) : []),
    [routine, items],
  );

  const toggleItem = (id: string) => {
    setTicked((current) => ({ ...current, [id]: !current[id] }));
  };

  const startRoutine = (alarm: Alarm) => {
    setRoutine(alarm);
    setChooserOpen(false);
    setTicked({});
    setSuccess(false);
  };

  const closeRoutine = useCallback(() => {
    setRoutine(null);
    setSuccess(false);
  }, []);

  useEffect(() => {
    if (!success || !routine) return;
    const timer = setTimeout(() => {
      void (async () => {
        await confirm(routine.id, new Date());
        await cancelReminder(routine.id);
      })();
      show({ payload: { title: lang.home.routineConfirmed, tone: 'success' }, duration: 3000 });
      closeRoutine();
    }, 1500);
    return () => clearTimeout(timer);
  }, [success, routine, confirm, show, closeRoutine, lang]);

  const onConfirm = () => {
    if (routine) setSuccess(true);
  };

  const renderPendingBanner = () => {
    if (!pending || routine) return null;
    return (
      <Pressable
        onPress={() => startRoutine(pending.alarm)}
        style={[styles.pendingRow, { backgroundColor: theme.warning, borderColor: theme.warning }]}
      >
        <Text style={[styles.pendingLabel, { color: '#fff' }]}>
          {lang.home.routinePendingTitle}: {pending.alarm.label} ({formatTime(pending.alarm.time)})
        </Text>
        <Text style={{ color: '#fff', fontWeight: '800' }}>{lang.home.routinePendingCta}</Text>
      </Pressable>
    );
  };

  const renderChooser = () => {
    if (!chooserOpen) return null;
    if (todaysAlarms.length === 0) {
      return (
        <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.panelTitle, { color: theme.color }]}>{lang.home.routineChooserTitle}</Text>
          <Text style={{ color: theme.muted }}>{lang.home.routineNoneToday}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.panelTitle, { color: theme.color }]}>{lang.home.routineChooserTitle}</Text>
        {todaysAlarms.map((alarm) => (
          <Pressable
            key={alarm.id}
            onPress={() => startRoutine(alarm)}
            style={[styles.routineOption, { borderColor: theme.border }]}
          >
            <Text style={[styles.routineOptionLabel, { color: theme.color }]}>{alarm.label}</Text>
            <Text style={{ color: theme.muted }}>{formatTime(alarm.time)} · {lang.home.routineNow}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderRoutine = () => {
    if (!routine) return null;
    const allItems = routineItems.length;
    const checkedCount = routineItems.filter((item) => ticked[item.id]).length;

    return (
      <View style={[styles.routineCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.routineHeader}>
          <View style={{ flex: 1 }}>
            <AppTitle style={[styles.routineTitle, { color: theme.color }]}>{routine.label}</AppTitle>
            <Text style={{ color: theme.muted }}>{formatTime(routine.time)}</Text>
          </View>
          {success && (
            <View style={styles.tickBox}>
              <AlambreIcons.Tick
                key={`ok-${routine.id}`}
                drawIt={success}
                iconAnimation={iconAnimation}
                color={theme.success}
                lineWidth={5}
              />
            </View>
          )}
        </View>

        {allItems === 0 ? (
          <Text style={{ color: theme.muted }}>{lang.home.routineNoItems}</Text>
        ) : (
          routineItems.map((item) => {
            const checked = ticked[item.id];
            return (
              <Pressable
                key={item.id}
                onPress={() => toggleItem(item.id)}
                style={[styles.itemRow, { borderColor: theme.border, backgroundColor: checked ? theme.surfaceAlt : 'transparent' }]}
              >
                <View style={styles.itemIcon}>
                  <ItemIcon icon={item.icon} color={checked ? theme.success : theme.muted} lineWidth={5} />
                </View>
                <Text style={[styles.itemName, { color: theme.color, textDecorationLine: checked ? 'line-through' : 'none' }]}>
                  {item.name}
                </Text>
                <View style={[styles.checkbox, { borderColor: theme.border, backgroundColor: checked ? theme.success : 'transparent' }]}>
                  {checked && <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text>}
                </View>
              </Pressable>
            );
          })
        )}

        <Text style={{ color: theme.muted, fontSize: 12 }}>
          {checkedCount}/{allItems}
        </Text>

        <AppButton onPress={onConfirm} disabled={success}>
          <Text style={[styles.confirmLabel, { color: theme.success }]}>{lang.home.routineCta}</Text>
        </AppButton>

        <Pressable onPress={closeRoutine} style={{ alignSelf: 'center', paddingVertical: 6 }}>
          <Text style={{ color: theme.muted }}>{lang.common.cancel}</Text>
        </Pressable>
      </View>
    );
  };

  const nextLabel = upcoming
    ? `${upcoming.alarm.label} · ${upcoming.date.toLocaleDateString()} ${upcoming.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : lang.home.noNextAlarms;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <LetterReveal key={lang.home.title} text={lang.home.title} style={{ color: theme.color }} />
        <Text style={[styles.subtitle, { color: theme.muted }]}>{lang.home.subtitle}</Text>
      </View>

      {renderPendingBanner()}

      {routine ? renderRoutine() : (
        <>
          <View style={[styles.nextRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Text style={[styles.nextLabel, { color: theme.color }]}>{nextLabel}</Text>
            {upcoming && (
              <Text style={{ color: theme.muted, fontSize: 13 }}>
                {weekdayNames(upcoming.alarm.weekdays, currentLang)}
              </Text>
            )}
          </View>

          <AppButton style={styles.leaveButton} onPress={() => setChooserOpen((open) => !open)}>
            <Text style={[styles.leaveLabel, { color: theme.success }]}>{lang.home.leaveNow}</Text>
          </AppButton>

          {renderChooser()}

          <View style={styles.guideRow}>
            <AppButton style={styles.ghost} onPress={() => navigate('items')}>
              <Text style={{ color: theme.primary }}>{lang.home.guideItems}</Text>
            </AppButton>
            <AppButton style={styles.ghost} onPress={() => navigate('alarms')}>
              <Text style={{ color: theme.primary }}>{lang.home.guideAlarms}</Text>
            </AppButton>
            <AppButton style={styles.ghost} onPress={() => navigate('settings')}>
              <Text style={{ color: theme.primary }}>{lang.home.guideSettings}</Text>
            </AppButton>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  nextRow: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 4,
  },
  nextLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  leaveButton: {
    marginTop: 4,
  },
  leaveLabel: {
    fontWeight: '700',
    fontSize: 16,
  },
  guideRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ghost: {
    flexGrow: 1,
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pendingLabel: {
    flex: 1,
    fontWeight: '600',
  },
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  routineOption: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routineOptionLabel: {
    fontWeight: '700',
  },
  routineCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routineTitle: {
    fontSize: 20,
  },
  tickBox: {
    width: 48,
    height: 48,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  itemIcon: {
    width: 48,
    height: 32,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLabel: {
    fontWeight: '800',
    fontSize: 16,
  },
});
