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
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppBadge from '../../components/AppBadge';
import HangingTitle from '../../components/HangingTitle';
import { ItemIcon, catalogDrawAnimation } from '../../items/icon-catalog';
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
    setNow(Date.now());
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
      <AppCard
        variant="outlined"
        style={[styles.missedCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.warning }]}
      >
        <View style={styles.missedHeader}>
          <AppBadge label={lang.home.missedTitle} tone="warning" variant="solid" size="sm" />
          <Text style={[styles.missedTitle, { color: theme.color }]}>
            {missed.label} ({missed.time})
          </Text>
        </View>
        {missed.items.length > 0 && (
          <Text style={[styles.missedItemsText, { color: theme.muted }]}>
            {lang.home.missedItems}: {missed.items.join(', ')}
          </Text>
        )}
      </AppCard>
    );
  };

  const renderProposal = (alarm: Alarm, due: Date) => {
    const alreadyConfirmed = isConfirmedAfter(confirmations, alarm.id, due);
    return (
      <AppCard
        key={alarm.id}
        variant="outlined"
        style={styles.proposalCard}
      >
        <View style={styles.proposalContent}>
          <View style={styles.proposalInfo}>
            <View style={styles.proposalTitleRow}>
              <Text style={[styles.proposalTitle, { color: theme.color }]}>{alarm.label}</Text>
              <AppBadge label={alarm.time} tone="primary" variant="soft" size="sm" />
            </View>
          </View>
          <AppButton
            variant={alreadyConfirmed ? 'outline' : 'solid'}
            tone="primary"
            size="sm"
            disabled={alreadyConfirmed}
            label={alreadyConfirmed ? lang.common.confirm : lang.home.activate}
            onPress={() => void activateAlarm(alarm)}
          />
        </View>
      </AppCard>
    );
  };

  const renderRoutine = () => {
    if (!routine) return null;
    const allItems = routineItems.length;
    const checkedCount = routineItems.filter((item) => ticked[item.id]).length;

    return (
      <AppCard variant="outlined" style={styles.routineCard}>
        <View style={styles.routineHeader}>
          <View style={styles.routineInfoCol}>
            <Text style={[styles.routineTitle, { color: theme.color }]}>{routine.label}</Text>
            <View style={styles.routineSubRow}>
              <AppBadge label={routine.time} tone="primary" variant="soft" size="sm" />
              <AppBadge
                label={`${checkedCount}/${allItems}`}
                tone={checkedCount === allItems && allItems > 0 ? 'success' : 'neutral'}
                variant="solid"
                size="sm"
              />
            </View>
          </View>
          {success ? (
            <View style={styles.tickBox}>
              <AlambreIcons.Tick
                key={`ok-${routine.id}`}
                drawIt={success}
                iconAnimation={iconAnimation}
                color={theme.success}
                lineWidth={4}
              />
            </View>
          ) : (
            <AppBadge
              label={`${lang.home.expiresIn} ${formatCountdown(remaining)}`}
              tone="warning"
              variant="soft"
              size="sm"
            />
          )}
        </View>

        {allItems === 0 ? (
          <Text style={[styles.emptyRoutineText, { color: theme.muted }]}>{lang.home.routineNoItems}</Text>
        ) : (
          <View style={styles.routineItemsContainer}>
            {routineItems.map((item, index) => {
              const checked = ticked[item.id];
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  style={({ pressed }) => [
                    styles.itemRow,
                    {
                      borderColor: checked ? theme.primary : theme.borderSoft,
                      backgroundColor: checked ? theme.primarySoft : theme.surfaceAlt,
                      borderWidth: checked ? 2 : 1,
                    },
                    pressed && styles.itemRowPressed,
                  ]}
                >
                  <View style={styles.itemIcon}>
                    <ItemIcon
                      icon={item.icon}
                      color={item.color}
                      lineWidth={2}
                      delay={index * 80}
                      iconAnimation={catalogDrawAnimation}
                    />
                  </View>
                  <Text
                    style={[
                      styles.itemName,
                      {
                        color: checked ? theme.primary : theme.color,
                        textDecorationLine: checked ? 'line-through' : 'none',
                        fontWeight: checked ? '700' : '600',
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: checked ? theme.primary : theme.border,
                        backgroundColor: checked ? theme.primary : 'transparent',
                      },
                    ]}
                  >
                    {checked && <Text style={{ color: theme.onPrimary, fontWeight: '800' }}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <AppButton
          variant="solid"
          tone="primary"
          size="lg"
          fullWidth
          label={lang.home.routineCta}
          onPress={onConfirm}
          disabled={success}
          style={styles.ctaButton}
        />

        {!success && (
          <View style={styles.routineActions}>
            <AppButton
              variant="ghost"
              tone="secondary"
              size="sm"
              label={lang.home.snooze}
              onPress={onSnooze}
            />
            <AppButton
              variant="ghost"
              tone="neutral"
              size="sm"
              label={lang.common.cancel}
              onPress={closeRoutine}
            />
          </View>
        )}
      </AppCard>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header superior con badge y acceso a Ajustes en su propia categoría */}
      <View style={styles.topBar}>
        <AppBadge label="COLGUETTI" tone="primary" variant="solid" size="sm" />
        <Pressable
          testID="settings-button"
          onPress={() => navigate('settings')}
          accessibilityLabel={lang.home.guideSettings}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.settingsBtn,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.borderSoft },
            pressed && styles.pressed,
          ]}
        >
          <AlambreIcons.Gear color={theme.color} lineWidth={2} style={styles.gearIcon} />
        </Pressable>
      </View>

      {/* Título animado standalone HangingTitle */}
      <HangingTitle
        title="Colguetti"
        subtitle={lang.home.subtitle}
      />

      {renderMissed()}

      {routine ? renderRoutine() : (
        <>
          {/* Card Hub de Mis Ítems */}
          <AppCard
            variant="outlined"
            style={styles.hubCard}
            bodyStyle={styles.hubBody}
            onPress={() => navigate('items')}
          >
            <View style={styles.hubHeader}>
              <View style={styles.hubTitleRow}>
                <AlambreIcons.Backpack color={theme.primary} lineWidth={2} style={styles.hubIcon} />
                <Text style={[styles.hubTitle, { color: theme.color }]}>{lang.home.guideItems}</Text>
              </View>
              <AppBadge
                label={`${items.length} ${items.length === 1 ? 'ítem' : 'ítems'}`}
                tone={items.length > 0 ? 'primary' : 'neutral'}
                variant="soft"
                size="sm"
              />
            </View>

            {items.length === 0 ? (
              <Text style={[styles.hubEmptyText, { color: theme.muted }]}>
                {lang.items.empty}
              </Text>
            ) : (
              <View style={styles.itemsPreviewRow}>
                {items.slice(0, 5).map((it) => (
                  <View
                    key={it.id}
                    style={[styles.itemMiniBubble, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceAlt }]}
                  >
                    <ItemIcon icon={it.icon} color={it.color} lineWidth={2} />
                  </View>
                ))}
                {items.length > 5 ? (
                  <Text style={[styles.moreItemsText, { color: theme.muted }]}>
                    +{items.length - 5}
                  </Text>
                ) : null}
              </View>
            )}

            <View style={styles.hubFooter}>
              <Text style={[styles.hubCtaText, { color: theme.primary }]}>
                Ver, ordenar y agregar ítems →
              </Text>
            </View>
          </AppCard>

          {/* Card Hub de Alarmas & Próxima Rutina */}
          <AppCard
            variant="outlined"
            style={styles.hubCard}
            bodyStyle={styles.hubBody}
            onPress={() => navigate('alarms')}
          >
            <View style={styles.hubHeader}>
              <View style={styles.hubTitleRow}>
                <AlambreIcons.Watch color={theme.secondary} lineWidth={2} style={styles.hubIcon} />
                <Text style={[styles.hubTitle, { color: theme.color }]}>{lang.home.guideAlarms}</Text>
              </View>
              <AppBadge
                label={`${alarms.length} ${alarms.length === 1 ? 'alarma' : 'alarmas'}`}
                tone={alarms.length > 0 ? 'primary' : 'neutral'}
                variant="soft"
                size="sm"
              />
            </View>

            <View style={styles.nextAlarmInfo}>
              <Text style={[styles.nextAlarmHeadline, { color: theme.color }]}>
                {upcoming ? upcoming.alarm.label : lang.home.noNextAlarms}
              </Text>
              {upcoming && (
                <View style={styles.nextTimeRow}>
                  <Text style={[styles.nextTimeDisplay, { color: theme.secondary }]}>
                    {upcoming.alarm.time}
                  </Text>
                  <Text style={[styles.nextDateDisplay, { color: theme.muted }]}>
                    {upcoming.date.toLocaleDateString()} · {weekdayNames(upcoming.alarm.weekdays, currentLang)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.hubFooter}>
              <Text style={[styles.hubCtaText, { color: theme.secondary }]}>
                Configurar alarmas y horarios →
              </Text>
              {upcoming && (
                <AppButton
                  variant="soft"
                  tone="primary"
                  size="sm"
                  label="¡Salgo ahora!"
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    activate(upcoming.alarm);
                  }}
                />
              )}
            </View>
          </AppCard>

          {/* Propuestas del día si las hay */}
          {proposals.length > 0 && (
            <View style={styles.proposalsSection}>
              {proposals.map(({ alarm, due }) => renderProposal(alarm, due))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    width: 22,
    height: 22,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  hubCard: {
    // Outer pressable container
  },
  hubBody: {
    gap: 12,
  },
  hubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hubIcon: {
    width: 22,
    height: 22,
  },
  hubTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  hubEmptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  itemsPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  itemMiniBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  moreItemsText: {
    fontSize: 12,
    fontWeight: '700',
    paddingLeft: 4,
  },
  hubFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  hubCtaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nextAlarmInfo: {
    gap: 4,
  },
  nextAlarmHeadline: {
    fontSize: 15,
    fontWeight: '700',
  },
  nextTimeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  nextTimeDisplay: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  nextDateDisplay: {
    fontSize: 12,
    fontWeight: '600',
  },
  nextWeekdays: {
    fontSize: 13,
    paddingLeft: 24,
  },
  missedCard: {
    borderWidth: 1.5,
  },
  missedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  missedTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  missedItemsText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  proposalsSection: {
    gap: 10,
  },
  proposalCard: {
    borderWidth: 1.5,
  },
  proposalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  proposalInfo: {
    flex: 1,
  },
  proposalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proposalTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  emptyProposalCard: {
    alignItems: 'center',
    paddingVertical: 20,
    borderWidth: 1.5,
  },
  emptyProposalTitle: {
    fontSize: 14,
  },
  routineCard: {
    borderWidth: 1.5,
    gap: 14,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  routineInfoCol: {
    flex: 1,
    gap: 6,
  },
  routineTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  routineSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tickBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRoutineText: {
    fontSize: 14,
    paddingVertical: 8,
  },
  routineItemsContainer: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  itemRowPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  itemIcon: {
    width: 44,
    height: 30,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButton: {
    marginTop: 6,
  },
  routineActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 4,
  },
  guideRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  guideBtn: {
    flex: 1,
  },
});

