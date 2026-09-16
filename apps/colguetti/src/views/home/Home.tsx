import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigator, useToast, AlambreIcons } from 'alambre';
import { withTiming, Easing } from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useAlarms } from '../../alarms/alarms-context';
import { useItems } from '../../items/items-context';
import { useConfirmations } from '../../checklist/confirmations-context';
import { useActivation } from '../../checklist/activation-context';
import { isExpired, missingItemNames, remainingMs } from '../../checklist/activation-model';
import { dayMatches, nextOccurrence, nextUpcoming } from '../../alarms/alarms-model';
import { isConfirmedAfter } from '../../checklist/checklist-model';
import { cancelAlarmAlerts, cancelExpiryReminder, cancelSuccessReminder, scheduleExpiryReminder, scheduleSuccessReminder, SNOOZE_MINUTES } from '../../notifications/expiry';
import { useRouteIntent } from '../../navigator/RouteIntent';
import type { Alarm } from '../../alarms/alarm-types';
import AppTitle from '../../components/AppTitle';
import AppButton from '../../components/AppButton';
import { ItemIcon } from '../../items/icon-catalog';
import LetterReveal from '../../components/LetterReveal';
import { weekdayNames } from '../../utils/weekday-names';

const MISSING_ITEMS_BODY = /\{items\}/g;

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

type ProposalEntry = { alarm: Alarm; due: Date };

type MissedRoutine = {
  alarmId: string;
  label: string;
  time: string;
  items: string[];
};

const formatCountdown = (ms: number): string => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default () => {
  const { theme } = useLightDark();
  const { lang, currentLang } = useLang();
  const { alarms } = useAlarms();
  const { items } = useItems();
  const { confirmations, confirm } = useConfirmations();
  const { active, activate, deactivate, snooze } = useActivation();
  const { navigate } = useNavigator();
  const { show } = useToast();
  const { intent, setIntent } = useRouteIntent();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);
  const [missed, setMissed] = useState<MissedRoutine | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const routine = useMemo(
    () => (active ? alarms.find((alarm) => alarm.id === active.alarmId) ?? null : null),
    [active, alarms],
  );

  const routineItems = useMemo(
    () => (routine ? items.filter((item) => routine.itemIds.includes(item.id)) : []),
    [routine, items],
  );

  const upcoming = nextUpcoming(alarms, new Date());
  const remaining = active ? remainingMs(active, new Date(now)) : 0;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!intent.alarmId) return;
    setSelectedId(intent.alarmId);
    if (intent.missing) {
      const alarm = alarms.find((current) => current.id === intent.alarmId);
      setMissed({
        alarmId: intent.alarmId,
        label: alarm?.label ?? '',
        time: alarm?.time ?? '',
        items: intent.missing,
      });
    }
    setIntent({});
  }, [intent.alarmId, intent.missing, alarms, setIntent]);

  const proposals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entries: ProposalEntry[] = alarms
      .filter((alarm) => alarm.enabled && dayMatches(alarm.weekdays, today))
      .flatMap((alarm) => {
        const due = nextOccurrence(alarm, today);
        return due ? [{ alarm, due }] : [];
      })
      .filter(({ alarm, due }) => !isConfirmedAfter(confirmations, alarm.id, due))
      .sort((a, b) => a.due.getTime() - b.due.getTime());

    if (selectedId && !entries.some((entry) => entry.alarm.id === selectedId)) {
      const target = alarms.find((alarm) => alarm.id === selectedId);
      if (target) entries.unshift({ alarm: target, due: nextOccurrence(target, today) ?? today });
    }

    return entries;
  }, [alarms, confirmations, selectedId]);

  useEffect(() => {
    if (!active || !isExpired(active)) return;
    const alarm = alarms.find((a) => a.id === active.alarmId);
    const unchecked = alarm ? missingItemNames(alarm.itemIds, items, ticked) : [];
    void cancelAlarmAlerts(active.alarmId);
    setMissed({
      alarmId: active.alarmId,
      label: alarm?.label ?? '',
      time: alarm?.time ?? '',
      items: unchecked,
    });
    setTicked({});
    setSuccess(false);
    void deactivate();
  }, [active, alarms, items, ticked, deactivate]);

  useEffect(() => {
    if (!active) return;
    const alarm = alarms.find((current) => current.id === active.alarmId);
    if (!alarm) return;

    const unchecked = missingItemNames(alarm.itemIds, items, ticked);
    if (unchecked.length === 0) {
      void cancelExpiryReminder(active.alarmId);
      void scheduleSuccessReminder(
        active.alarmId,
        new Date(active.expiresAt),
        lang.home.successTitle,
        lang.home.successBody,
      );
      return;
    }

    void cancelSuccessReminder(active.alarmId);
    const body = lang.home.missingBody.replace(MISSING_ITEMS_BODY, unchecked.join(', '));
    void scheduleExpiryReminder(
      active.alarmId,
      new Date(active.expiresAt),
      lang.home.missingTitle,
      body,
      unchecked,
    );
  }, [active, alarms, items, ticked, lang]);

  const toggleItem = (id: string) => {
    setTicked((current) => ({ ...current, [id]: !current[id] }));
  };

  const activateAlarm = async (alarm: Alarm) => {
    await activate(alarm);
    setTicked({});
    setSuccess(false);
    setMissed(null);
  };

  const closeRoutine = useCallback(() => {
    if (active) void cancelAlarmAlerts(active.alarmId);
    setTicked({});
    setSuccess(false);
    void deactivate();
  }, [active, deactivate]);

  useEffect(() => {
    if (!success || !routine || !active) return;
    const timer = setTimeout(() => {
      void (async () => {
        await confirm(routine.id, new Date());
        await cancelAlarmAlerts(routine.id);
        await deactivate();
      })();
      show({ payload: { title: lang.home.routineConfirmed, tone: 'success' }, duration: 3000 });
      setTicked({});
      setSuccess(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [success, routine, active, confirm, deactivate, show, lang]);

  const onConfirm = () => {
    if (routine) setSuccess(true);
  };

  const onSnooze = () => {
    void snooze(SNOOZE_MINUTES);
    show({ payload: { title: lang.home.snoozed }, duration: 2000 });
  };

  const renderMissed = () => {
    if (!missed) return null;
    return (
      <View style={[styles.missedCard, { backgroundColor: theme.warning, borderColor: theme.warning }]}>
        <Text style={[styles.missedTitle, { color: '#fff' }]}>
          {lang.home.missedTitle}: {missed.label} ({missed.time})
        </Text>
        {missed.items.length > 0 && (
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {lang.home.missedItems}: {missed.items.join(', ')}
          </Text>
        )}
      </View>
    );
  };

  const renderProposal = (alarm: Alarm, due: Date) => {
    const alreadyConfirmed = isConfirmedAfter(confirmations, alarm.id, due);
    return (
      <View key={alarm.id} style={[styles.proposalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.proposalInfo}>
          <Text style={[styles.proposalTitle, { color: theme.color }]}>{alarm.label}</Text>
          <Text style={{ color: theme.muted }}>{alarm.time}</Text>
        </View>
        <AppButton
          style={styles.activateButton}
          disabled={alreadyConfirmed}
          onPress={() => void activateAlarm(alarm)}
        >
          <Text style={[styles.activateLabel, { color: alreadyConfirmed ? theme.muted : theme.success }]}>
            {lang.home.activate}
          </Text>
        </AppButton>
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
            <Text style={{ color: theme.muted }}>{routine.time}</Text>
          </View>
          {success ? (
            <View style={styles.tickBox}>
              <AlambreIcons.Tick
                key={`ok-${routine.id}`}
                drawIt={success}
                iconAnimation={iconAnimation}
                color={theme.success}
                lineWidth={5}
              />
            </View>
          ) : (
            <Text style={{ color: theme.warning, fontWeight: '800' }}>
              {lang.home.expiresIn} {formatCountdown(remaining)}
            </Text>
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

        {!success && (
          <View style={styles.routineActions}>
            <Pressable onPress={onSnooze} style={styles.routineAction}>
              <Text style={{ color: theme.primary }}>{lang.home.snooze}</Text>
            </Pressable>
            <Pressable onPress={closeRoutine} style={styles.routineAction}>
              <Text style={{ color: theme.muted }}>{lang.common.cancel}</Text>
            </Pressable>
          </View>
        )}
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

      {renderMissed()}

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

          {proposals.length === 0 ? (
            <View style={[styles.proposalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.proposalTitle, { color: theme.color }]}>{lang.home.noProposals}</Text>
            </View>
          ) : (
            proposals.map(({ alarm, due }) => renderProposal(alarm, due))
          )}

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
  missedCard: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    borderWidth: 1,
  },
  missedTitle: {
    fontWeight: '800',
  },
  proposalCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proposalInfo: {
    flex: 1,
    gap: 2,
  },
  proposalTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  activateButton: {
    paddingHorizontal: 18,
  },
  activateLabel: {
    fontWeight: '800',
    fontSize: 15,
  },
  guideRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ghost: {
    flexGrow: 1,
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
  routineActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  routineAction: {
    paddingVertical: 6,
  },
});
