import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Text, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigator, useToast, AlambreIcons, kinetics } from 'alambre';
import Animated, {
  FadeIn,
  runOnJS,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useAlarms } from '../../alarms/alarms-context';
import { useItems } from '../../items/items-context';
import { useConfirmations } from '../../checklist/confirmations-context';
import { useActivation } from '../../checklist/activation-context';
import { isExpired, missingItemNames, remainingMs } from '../../checklist/activation-model';
import { dayMatches, nextOccurrence } from '../../alarms/alarms-model';
import { isConfirmedAfter } from '../../checklist/checklist-model';
import { cancelAlarmAlerts, cancelExpiryReminder, cancelSuccessReminder, scheduleExpiryReminder, scheduleSuccessReminder, SNOOZE_MINUTES } from '../../notifications/expiry';
import { useRouteIntent } from '../../navigator/RouteIntent';
import type { Alarm } from '../../alarms/alarm-types';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppBadge from '../../components/AppBadge';
import HangingTitle from '../../components/HangingTitle';
import SupportModal from '../../components/SupportModal';
import TypewriterText from '../../components/TypewriterText';
import { ItemIcon, catalogDrawAnimation } from '../../items/icon-catalog';
import { weekdayNames } from '../../utils/weekday-names';

const WEEKDAY_KEYS = [0, 1, 2, 3, 4, 5, 6] as const;
const WEEKDAY_LABELS: Record<'es' | 'en', Record<number, string>> = {
  es: { 0: 'D', 1: 'L', 2: 'M', 3: 'Mi', 4: 'J', 5: 'V', 6: 'S' },
  en: { 0: 'S', 1: 'M', 2: 'T', 3: 'W', 4: 'Th', 5: 'F', 6: 'S' },
};

const MISSING_ITEMS_BODY = /\{items\}/g;

const iconAnimation = {
  drawAnimation: (value: number) => withTiming(value, kinetics.timing.slow),
  resetAnimation: (value: number) => withTiming(value, kinetics.timing.fast),
};


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

  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);
  const [missed, setMissed] = useState<MissedRoutine | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [supportOpen, setSupportOpen] = useState(false);
  const [alarmCarouselIndex, setAlarmCarouselIndex] = useState(0);
  const [itemCarouselIndex, setItemCarouselIndex] = useState(0);

  const routine = useMemo(
    () => (active ? alarms.find((alarm) => alarm.id === active.alarmId) ?? null : null),
    [active, alarms],
  );

  const routineItems = useMemo(
    () => (routine ? items.filter((item) => routine.itemIds.includes(item.id)) : []),
    [routine, items],
  );

  const remaining = active ? remainingMs(active, new Date(now)) : 0;

  const sortedRoutines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...alarms].sort((a, b) => {
      const aToday = a.enabled && dayMatches(a.weekdays, today);
      const bToday = b.enabled && dayMatches(b.weekdays, today);
      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;
      return a.time.localeCompare(b.time);
    });
  }, [alarms]);

  const activeAlarms = useMemo(
    () => sortedRoutines.filter((alarm) => alarm.enabled),
    [sortedRoutines],
  );

  useEffect(() => {
    if (activeAlarms.length <= 1) return;
    const timer = setTimeout(() => {
      setAlarmCarouselIndex((prev) => (prev + 1) % activeAlarms.length);
    }, 4000);
    return () => clearTimeout(timer);
  }, [activeAlarms.length, alarmCarouselIndex]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setTimeout(() => {
      setItemCarouselIndex((prev) => (prev + 1) % items.length);
    }, 3500);
    return () => clearTimeout(timer);
  }, [items.length, itemCarouselIndex]);

  const safeItemIndex = items.length > 0 ? itemCarouselIndex % items.length : 0;
  const safeAlarmIndex = activeAlarms.length > 0 ? alarmCarouselIndex % activeAlarms.length : 0;

  const nextAlarm = useCallback(() => {
    if (activeAlarms.length <= 1) return;
    setAlarmCarouselIndex((prev) => (prev + 1) % activeAlarms.length);
  }, [activeAlarms.length]);

  const prevAlarm = useCallback(() => {
    if (activeAlarms.length <= 1) return;
    setAlarmCarouselIndex((prev) => (prev - 1 + activeAlarms.length) % activeAlarms.length);
  }, [activeAlarms.length]);

  const alarmPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-12, 12])
        .onEnd((e) => {
          'worklet';
          if (e.translationX < -25 || e.velocityX < -350) {
            runOnJS(nextAlarm)();
          } else if (e.translationX > 25 || e.velocityX > 350) {
            runOnJS(prevAlarm)();
          }
        }),
    [nextAlarm, prevAlarm],
  );

  const nextItem = useCallback(() => {
    if (items.length <= 1) return;
    setItemCarouselIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prevItem = useCallback(() => {
    if (items.length <= 1) return;
    setItemCarouselIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const itemPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-12, 12])
        .onEnd((e) => {
          'worklet';
          if (e.translationX < -25 || e.velocityX < -350) {
            runOnJS(nextItem)();
          } else if (e.translationX > 25 || e.velocityX > 350) {
            runOnJS(prevItem)();
          }
        }),
    [nextItem, prevItem],
  );

  const openAlarms = useCallback(() => {
    navigate('alarms');
  }, [navigate]);

  const openItems = useCallback(() => {
    navigate('items');
  }, [navigate]);

  const isAlarmToday = useCallback((alarm: Alarm) => {
    const today = new Date();
    return alarm.enabled && dayMatches(alarm.weekdays, today);
  }, []);

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(Date.now());
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!intent.alarmId) return;
    if (intent.missing) {
      const alarm = alarms.find((current) => current.id === intent.alarmId);
      setMissed({
        alarmId: intent.alarmId,
        label: alarm?.label ?? '',
        time: alarm?.time ?? '',
        items: intent.missing,
      });
      void deactivate();
    }
    setIntent({});
  }, [intent.alarmId, intent.missing, alarms, setIntent, deactivate]);

  useEffect(() => {
    if (!active) return;
    const currentNow = new Date(now);
    if (!isExpired(active, currentNow)) return;
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
  }, [active, now, alarms, items, ticked, deactivate]);

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


  const renderRoutine = () => {
    if (!routine) return null;
    const allItems = routineItems.length;
    const checkedCount = routineItems.filter((item) => ticked[item.id]).length;
    const allChecked = allItems > 0 && checkedCount === allItems;
    const progressPercent = allItems > 0 ? Math.round((checkedCount / allItems) * 100) : 0;

    return (
      <AppCard
        variant="outlined"
        style={[
          styles.departureHeroCard,
          {
            backgroundColor: theme.surface,
            borderColor: success ? theme.success : allChecked ? theme.primary : theme.borderSoft,
          },
        ]}
      >
        <View style={styles.departureTopRow}>
          <View style={styles.departureLiveTag}>
            <View
              style={[
                styles.livePulseDot,
                { backgroundColor: success ? theme.success : theme.primary },
              ]}
            />
            <Text
              style={[
                styles.livePulseText,
                { color: success ? theme.success : theme.primary },
              ]}
            >
              {success ? lang.home.routineConfirmed : lang.home.activeRoutineBadge}
            </Text>
          </View>
          {success ? (
            <View style={styles.heroTickBox}>
              <AlambreIcons.Tick
                key={`ok-${routine.id}`}
                drawIt={success}
                iconAnimation={iconAnimation}
                color={theme.success}
                lineWidth={3.5}
              />
            </View>
          ) : (
            <AppBadge
              label={`${lang.home.expiresIn} ${formatCountdown(remaining)}`}
              tone={remaining < 180000 ? 'danger' : 'warning'}
              variant="solid"
              size="sm"
            />
          )}
        </View>

        <View style={styles.departureTitleRow}>
          <Text
            numberOfLines={1}
            style={[styles.departureTitle, { color: theme.color }]}
          >
            {routine.label}
          </Text>
          <AppBadge
            label={routine.time}
            tone="primary"
            variant="soft"
            size="md"
          />
        </View>

        {allItems > 0 && (
          <View style={styles.departureProgressSection}>
            <View style={styles.departureProgressMeta}>
              <Text style={[styles.departureProgressLabel, { color: theme.muted }]}>
                {lang.home.itemsReady
                  .replace('{checked}', String(checkedCount))
                  .replace('{total}', String(allItems))}
              </Text>
              <Text
                style={[
                  styles.departureProgressPercent,
                  { color: allChecked ? theme.success : theme.primary },
                ]}
              >
                {allChecked ? '✓ ¡Todo listo!' : `${progressPercent}%`}
              </Text>
            </View>
            <View
              style={[
                styles.departureProgressTrack,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.borderSoft },
              ]}
            >
              <View
                style={[
                  styles.departureProgressBar,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: allChecked ? theme.success : theme.primary,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {allItems === 0 ? (
          <Text style={[styles.emptyRoutineText, { color: theme.muted }]}>
            {lang.home.routineNoItems}
          </Text>
        ) : (
          <View style={styles.routineItemsContainer}>
            {routineItems.map((item, index) => {
              const checked = ticked[item.id];
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  style={({ pressed }) => [
                    styles.departureItemRow,
                    {
                      borderColor: checked ? theme.primary : theme.borderSoft,
                      backgroundColor: checked ? theme.primarySoft : theme.surfaceAlt,
                      borderWidth: checked ? 2 : 1,
                    },
                    pressed && styles.itemRowPressed,
                  ]}
                >
                  <View style={styles.departureItemIcon}>
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
                      styles.departureItemName,
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
                      styles.departureCheckbox,
                      {
                        borderColor: checked ? theme.primary : theme.border,
                        backgroundColor: checked ? theme.primary : 'transparent',
                      },
                    ]}
                  >
                    {checked && (
                      <Text style={{ color: theme.onPrimary, fontWeight: '800', fontSize: 13 }}>
                        ✓
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <AppButton
          variant="solid"
          tone={allChecked ? 'success' : 'primary'}
          size="lg"
          fullWidth
          label={lang.home.routineCta}
          onPress={onConfirm}
          disabled={success}
          style={styles.departureCta}
        />

        {!success && (
          <View style={styles.departureSecondaryActions}>
            <AppButton
              variant="ghost"
              tone="secondary"
              size="sm"
              label={lang.home.snoozeCta ?? lang.home.snooze}
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

  const upcomingRoutines = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    return sortedRoutines.filter((alarm) => {
      if (!alarm.enabled) return false;
      const due = nextOccurrence(alarm, startOfToday);
      if (!due) return false;

      // An alarm is considered "próxima" if it's scheduled for today
      // (or within the next 4 hours)
      const isToday = dayMatches(alarm.weekdays, today);
      const diffMs = due.getTime() - today.getTime();
      const isUpcoming =
        (isToday && diffMs >= -30 * 60 * 1000) ||
        (diffMs >= 0 && diffMs <= 4 * 60 * 60 * 1000);
      if (!isUpcoming) return false;

      // And it has NOT been confirmed recently for this occurrence
      const alreadyConfirmed = isConfirmedAfter(confirmations, alarm.id, due);
      return !alreadyConfirmed;
    });
  }, [sortedRoutines, confirmations]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header superior: Título y caption a la izquierda, Donaciones y Ajustes a la derecha */}
      <View style={styles.topBar}>
        <View style={styles.titleCol}>
          <HangingTitle
            title="Colguetti"
            subtitle={lang.home.subtitle}
          />
        </View>
        <View style={styles.headerActions}>
          <Pressable
            testID="support-button"
            onPress={() => setSupportOpen(true)}
            accessibilityLabel="Apoyar a Colguetti"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.borderSoft },
              pressed && styles.pressed,
            ]}
          >
            <AlambreIcons.Heart color={theme.primary} lineWidth={2} style={styles.actionIcon} />
          </Pressable>
          <Pressable
            testID="settings-button"
            onPress={() => navigate('settings')}
            accessibilityLabel={lang.home.guideSettings}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.borderSoft },
              pressed && styles.pressed,
            ]}
          >
            <AlambreIcons.Gear color={theme.color} lineWidth={2} style={styles.actionIcon} />
          </Pressable>
        </View>
      </View>

      {renderMissed()}

      {routine ? renderRoutine() : (
        <>
          {/* Rutinas de salida: SOLO se muestran si hay una alarma próxima y no confirmada */}
          {upcomingRoutines.length > 0 && (
            <View style={styles.routinesSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <AlambreIcons.Play color={theme.primary} lineWidth={2} style={styles.sectionIcon} />
                  <Text style={[styles.sectionTitle, { color: theme.color }]}>
                    {lang.home.quickRoutines}
                  </Text>
                </View>
                <AppBadge
                  label={`${upcomingRoutines.length} ${upcomingRoutines.length === 1 ? 'rutina' : 'rutinas'}`}
                  tone="primary"
                  variant="soft"
                  size="sm"
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContainer}
              >
                {upcomingRoutines.map((alarm) => {
                  const today = new Date();
                  const isToday = alarm.enabled && dayMatches(alarm.weekdays, today);
                  const routineItemList = items.filter((it) => alarm.itemIds.includes(it.id));

                  return (
                    <View
                      key={alarm.id}
                      style={[
                        styles.routineQuickCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: isToday ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <View style={styles.routineQuickHeader}>
                        <Text
                          numberOfLines={1}
                          style={[styles.routineQuickTitle, { color: theme.color }]}
                        >
                          {alarm.label}
                        </Text>
                        <AppBadge
                          label={alarm.time}
                          tone={isToday ? 'primary' : 'neutral'}
                          variant="soft"
                          size="sm"
                        />
                      </View>

                      <View style={styles.routineQuickMeta}>
                        <Text style={[styles.routineQuickDays, { color: theme.muted }]}>
                          {weekdayNames(alarm.weekdays, currentLang)}
                        </Text>
                      </View>

                      {routineItemList.length > 0 ? (
                        <View style={styles.routineQuickItems}>
                          {routineItemList.slice(0, 3).map((it) => (
                            <View
                              key={it.id}
                              style={[
                                styles.routineQuickItemBubble,
                                { borderColor: theme.borderSoft, backgroundColor: theme.surfaceAlt },
                              ]}
                            >
                              <ItemIcon icon={it.icon} color={it.color} lineWidth={1.8} />
                            </View>
                          ))}
                          {routineItemList.length > 3 ? (
                            <Text style={[styles.routineQuickMore, { color: theme.muted }]}>
                              +{routineItemList.length - 3}
                            </Text>
                          ) : null}
                        </View>
                      ) : (
                        <Text style={[styles.routineQuickNoItems, { color: theme.muted }]}>
                          {lang.home.routineNoItems}
                        </Text>
                      )}

                      <AppButton
                        variant="solid"
                        tone="primary"
                        size="sm"
                        fullWidth
                        label={lang.home.goNow ?? '¡Salgo ahora!'}
                        onPress={() => void activateAlarm(alarm)}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Card Hub de Mis Ítems: Carrusel rotativo con dots */}
          <AppCard
            variant="outlined"
            style={styles.hubCard}
            bodyStyle={styles.hubBody}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={lang.home.guideItems}
              onPress={openItems}
              style={styles.hubHeader}
            >
              <View style={styles.hubTitleRow}>
                <AlambreIcons.Backpack color={theme.primary} lineWidth={2} style={styles.hubIcon} />
                <Text style={[styles.hubTitle, { color: theme.color }]}>{lang.home.guideItems}</Text>
              </View>
              <View style={styles.hubHeaderRight}>
                <AppBadge
                  label={`${items.length} ${items.length === 1 ? 'ítem' : 'ítems'}`}
                  tone={items.length > 0 ? 'primary' : 'neutral'}
                  variant="soft"
                  size="sm"
                />
              </View>
            </Pressable>

            {items.length === 0 ? (
              <Text style={[styles.hubEmptyText, { color: theme.muted }]}>
                {lang.items.empty}
              </Text>
            ) : (
              (() => {
                const currentItem = items[safeItemIndex];
                if (!currentItem) return null;
                const linkedAlarms = alarms.filter((a) => a.itemIds.includes(currentItem.id));
                const linkedText =
                  linkedAlarms.length > 0
                    ? lang.home.inRoutines.replace(
                      '{routines}',
                      linkedAlarms.map((a) => a.label).join(', '),
                    )
                    : lang.home.noRoutinesAssigned;

                return (
                  <View style={styles.carouselSlideContainer}>
                    <GestureDetector gesture={itemPanGesture}>
                      <Pressable
                        style={[styles.itemSlideContent, { backgroundColor: theme.surface }]}
                        onPress={openItems}
                        accessibilityRole="button"
                        accessibilityLabel={currentItem.name}
                      >
                        <View
                          style={[
                            styles.itemSlideBubble,
                            {
                              borderColor: currentItem.color || theme.primary,
                              backgroundColor: theme.surfaceAlt,
                            },
                          ]}
                        >
                          <ItemIcon
                            key={currentItem.id}
                            icon={currentItem.icon}
                            color={currentItem.color}
                            lineWidth={2}
                            iconAnimation={catalogDrawAnimation}
                          />
                        </View>
                        <View style={styles.itemSlideInfo}>
                          <TypewriterText
                            key={currentItem.id}
                            text={currentItem.name}
                            speed={24}
                            initialDelay={340}
                            cursor={false}
                            numberOfLines={1}
                            textStyle={[styles.itemSlideName, { color: theme.color }]}
                          />
                          <Animated.View key={`${currentItem.id}-meta`} entering={FadeIn.duration(200)}>
                            <Text
                              numberOfLines={1}
                              style={[styles.itemSlideMeta, { color: theme.muted }]}
                            >
                              {linkedText}
                            </Text>
                          </Animated.View>
                        </View>
                      </Pressable>
                    </GestureDetector>

                    {items.length > 1 && (
                      <View style={styles.carouselDotsRow}>
                        {items.map((it, idx) => (
                          <Pressable
                            key={it.id}
                            hitSlop={6}
                            onPress={(e) => {
                              e.stopPropagation();
                              setItemCarouselIndex(idx);
                            }}
                            style={[
                              styles.carouselDot,
                              {
                                backgroundColor:
                                  idx === safeItemIndex ? theme.primary : theme.borderSoft,
                                width: idx === safeItemIndex ? 16 : 6,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()
            )}
          </AppCard>

          {/* Card Hub de Alarmas: Carrusel rotativo con borde, sólo activas, play shortcut y dots */}
          <AppCard
            variant="outlined"
            style={styles.hubCard}
            bodyStyle={styles.hubBody}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={lang.home.guideAlarms}
              onPress={openAlarms}
              style={styles.hubHeader}
            >
              <View style={styles.hubTitleRow}>
                <AlambreIcons.Watch color={theme.secondary} lineWidth={2} style={styles.hubIcon} />
                <Text style={[styles.hubTitle, { color: theme.color }]}>{lang.home.guideAlarms}</Text>
              </View>
              <View style={styles.hubHeaderRight}>
                <AppBadge
                  label={`${activeAlarms.length} ${activeAlarms.length === 1 ? 'activa' : 'activas'}`}
                  tone={activeAlarms.length > 0 ? 'primary' : 'neutral'}
                  variant="soft"
                  size="sm"
                />
              </View>
            </Pressable>

            {activeAlarms.length === 0 ? (
              <Text style={[styles.hubEmptyText, { color: theme.muted }]}>
                {alarms.length === 0 ? lang.alarms.empty : 'No hay alarmas activadas'}
              </Text>
            ) : (
              (() => {
                const currentAlarm = activeAlarms[safeAlarmIndex];
                if (!currentAlarm) return null;
                const isToday = isAlarmToday(currentAlarm);
                const todayDayIndex = new Date().getDay();

                return (
                  <View style={styles.carouselSlideContainer}>
                    <GestureDetector gesture={alarmPanGesture}>
                      <View
                        style={[
                          styles.alarmPreviewBox,
                          {
                            borderColor: isToday ? theme.primary : theme.borderSoft,
                            backgroundColor: theme.surfaceAlt,
                          },
                        ]}
                      >
                        {/* Fila superior: Título de la rutina a la izquierda, Botón Play a la derecha */}
                        <View style={styles.alarmSlideTopRow}>
                          <Pressable
                            style={styles.alarmTitleLockup}
                            onPress={openAlarms}
                            accessibilityRole="button"
                            accessibilityLabel={currentAlarm.label}
                          >
                            <TypewriterText
                              key={currentAlarm.id}
                              text={currentAlarm.label}
                              speed={28}
                              initialDelay={360}
                              cursor={false}
                              numberOfLines={1}
                              textStyle={[styles.alarmSlideTitle, { color: theme.color }]}
                            />
                          </Pressable>

                          <Pressable
                            accessibilityLabel={`Activar alarma ${currentAlarm.label}`}
                            accessibilityRole="button"
                            onPress={() => {
                              void activateAlarm(currentAlarm);
                            }}
                            style={({ pressed }) => [
                              styles.alarmPlayBtn,
                              { backgroundColor: theme.primary },
                              pressed && styles.pressed,
                            ]}
                          >
                            <AlambreIcons.Play color={theme.onPrimary} lineWidth={2.5} style={styles.playIcon} />
                          </Pressable>
                        </View>

                        {/* Fila inferior: Hora en pill/badge + fila de 7 días D L M Mi J V S */}
                        <Pressable
                          style={styles.alarmSlideMetaRow}
                          onPress={openAlarms}
                          accessibilityRole="button"
                        >
                          <Animated.View key={currentAlarm.time} entering={FadeIn.duration(200)}>
                            <AppBadge
                              label={currentAlarm.time}
                              tone={isToday ? 'primary' : 'neutral'}
                              variant="soft"
                              size="md"
                            />
                          </Animated.View>
                          <View style={styles.weekdayPillsRow}>
                            {WEEKDAY_KEYS.map((day) => {
                              const isSelected = currentAlarm.weekdays.includes(day);
                              const isScheduledToday = isSelected && day === todayDayIndex;
                              const label = (WEEKDAY_LABELS[currentLang as 'es' | 'en'] ?? WEEKDAY_LABELS.es)[day];
                              return (
                                <Animated.View
                                  key={`${currentAlarm.id}-${day}`}
                                  entering={FadeIn.duration(160).delay(day * 22)}
                                  style={[
                                    styles.weekdayPill,
                                    {
                                      backgroundColor: isScheduledToday
                                        ? theme.warning
                                        : isSelected
                                          ? theme.primary
                                          : theme.surface,
                                      borderColor: isScheduledToday
                                        ? theme.warning
                                        : isSelected
                                          ? theme.primary
                                          : theme.borderSoft,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.weekdayPillText,
                                      {
                                        color: isScheduledToday
                                          ? '#1e1e1e'
                                          : isSelected
                                            ? theme.onPrimary
                                            : theme.muted,
                                        fontWeight: isSelected ? '800' : '600',
                                      },
                                    ]}
                                  >
                                    {label}
                                  </Text>
                                </Animated.View>
                              );
                            })}
                          </View>
                        </Pressable>
                      </View>
                    </GestureDetector>

                    {activeAlarms.length > 1 && (
                      <View style={styles.carouselDotsRow}>
                        {activeAlarms.map((al, idx) => (
                          <Pressable
                            key={al.id}
                            hitSlop={6}
                            onPress={() => {
                              setAlarmCarouselIndex(idx);
                            }}
                            style={[
                              styles.carouselDot,
                              {
                                backgroundColor:
                                  idx === safeAlarmIndex ? theme.primary : theme.borderSoft,
                                width: idx === safeAlarmIndex ? 16 : 6,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()
            )}
          </AppCard>
        </>
      )}

      {/* Modal de Donaciones y Soporte al Proyecto */}
      <SupportModal visible={supportOpen} onClose={() => setSupportOpen(false)} />
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
  },
  titleCol: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 20,
    height: 20,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
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
  // Departure Hero Card
  departureHeroCard: {
    borderWidth: 2,
    borderRadius: 22,
    gap: 20,
    padding: 20,
  },
  departureTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  departureLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  livePulseText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTickBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  departureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  departureTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    flex: 1,
  },
  departureProgressSection: {
    gap: 8,
    marginVertical: 4,
  },
  departureProgressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  departureProgressLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  departureProgressPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  departureProgressTrack: {
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    overflow: 'hidden',
  },
  departureProgressBar: {
    height: '100%',
    borderRadius: 5,
  },
  emptyRoutineText: {
    fontSize: 14,
    paddingVertical: 8,
  },
  routineItemsContainer: {
    gap: 10,
    marginVertical: 4,
  },
  departureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  itemRowPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  departureItemIcon: {
    width: 36,
    height: 32,
  },
  departureItemName: {
    flex: 1,
    fontSize: 16,
  },
  departureCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  departureCta: {
    marginTop: 8,
  },
  departureSecondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 6,
  },
  // Routines Section (quick list when next alarm is upcoming)
  routinesSection: {
    gap: 12,
    marginVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    width: 20,
    height: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  carouselContainer: {
    gap: 12,
    paddingVertical: 4,
  },
  routineQuickCard: {
    width: 220,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
  },
  routineQuickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  routineQuickTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  routineQuickMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  routineQuickDays: {
    fontSize: 12,
    fontWeight: '600',
  },
  routineQuickItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  routineQuickItemBubble: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  routineQuickMore: {
    fontSize: 11,
    fontWeight: '700',
  },
  routineQuickNoItems: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  // Hub Cards (Mis Ítems & Alarmas)
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
  hubHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  // Hub Carousel & Slides
  carouselSlideContainer: {
    gap: 10,
    paddingTop: 4,
    overflow: 'hidden',
  },
  itemSlideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 48,
  },
  itemSlideBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  itemSlideInfo: {
    flex: 1,
    gap: 3,
  },
  itemSlideName: {
    fontSize: 16,
    fontWeight: '800',
  },
  itemSlideMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  alarmPreviewBox: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  alarmSlideTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  alarmTitleLockup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alarmSlideTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    flexShrink: 1,
    includeFontPadding: false,
  },
  alarmPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: 20,
    height: 20,
    marginLeft: 2,
  },
  alarmSlideMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  weekdayPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weekdayPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  weekdayPillText: {
    fontSize: 11,
    textAlign: 'center',
  },
  carouselDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  carouselDot: {
    height: 6,
    borderRadius: 3,
  },
});

