import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useToast } from 'alambre';
import { useActivation } from './activation-context';
import { useConfirmations } from './confirmations-context';
import { isExpired, missingItemNames, remainingMs } from './activation-model';
import type { Ticks } from './activation-model';
import { useAlarms } from '../alarms/alarms-context';
import { useItems } from '../items/items-context';
import { useLang } from '../providers/lang';
import { useRouteIntent } from '../navigator/RouteIntent';
import {
  cancelAlarmAlerts,
  cancelExpiryReminder,
  cancelSuccessReminder,
  scheduleExpiryReminder,
  scheduleSuccessReminder,
  SNOOZE_MINUTES,
} from '../notifications/expiry';

const MISSING_ITEMS_BODY = /\{items\}/g;
/** Time the success state stays on screen before the routine is closed. */
const SUCCESS_HOLD_MS = 1500;

export type MissedRoutine = {
  alarmId: string;
  label: string;
  time: string;
  items: string[];
};

/**
 * Departure-routine controller: owns the checklist ticks, the expiry countdown,
 * the "you forgot X" / success reminders and the missed-routine report coming
 * from expiry notifications. Views stay presentational.
 */
export function useActiveRoutine() {
  const { lang } = useLang();
  const { alarms } = useAlarms();
  const { items } = useItems();
  const { confirm } = useConfirmations();
  const { active, deactivate, snooze } = useActivation();
  const { intent, setIntent } = useRouteIntent();
  const { show } = useToast();

  const [ticked, setTicked] = useState<Ticks>({});
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

  const checkedCount = routineItems.filter((item) => ticked[item.id]).length;
  const allChecked = routineItems.length > 0 && checkedCount === routineItems.length;
  const remaining = active ? remainingMs(active, new Date(now)) : 0;

  const reset = useCallback(() => {
    setTicked({});
    setSuccess(false);
  }, []);

  // A new activation always starts with a clean checklist.
  useEffect(() => {
    reset();
  }, [active?.alarmId, active?.activatedAt, reset]);

  // Countdown clock: ticks only while a routine is active; resyncs on foreground.
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [active]);

  // Missed report from a tapped expiry notification (set by NotificationsWatcher).
  useEffect(() => {
    if (!intent.missing || !intent.alarmId) return;
    const alarm = alarms.find((current) => current.id === intent.alarmId);
    setMissed({
      alarmId: intent.alarmId,
      label: alarm?.label ?? '',
      time: alarm?.time ?? '',
      items: intent.missing,
    });
    void deactivate();
    setIntent({});
  }, [intent.alarmId, intent.missing, alarms, setIntent, deactivate]);

  // Window elapsed while the app was open.
  useEffect(() => {
    if (!active || success) return;
    if (!isExpired(active, new Date(now))) return;
    const alarm = alarms.find((current) => current.id === active.alarmId);
    void cancelAlarmAlerts(active.alarmId);
    setMissed({
      alarmId: active.alarmId,
      label: alarm?.label ?? '',
      time: alarm?.time ?? '',
      items: alarm ? missingItemNames(alarm.itemIds, items, ticked) : [],
    });
    reset();
    void deactivate();
  }, [active, success, now, alarms, items, ticked, reset, deactivate]);

  // Keep the background reminder in sync with what is still unticked.
  useEffect(() => {
    if (!active || !routine) return;
    const unchecked = missingItemNames(routine.itemIds, items, ticked);
    const at = new Date(active.expiresAt);
    if (unchecked.length === 0) {
      void cancelExpiryReminder(active.alarmId);
      void scheduleSuccessReminder(active.alarmId, at, lang.home.successTitle, lang.home.successBody);
      return;
    }
    void cancelSuccessReminder(active.alarmId);
    const body = lang.home.missingBody.replace(MISSING_ITEMS_BODY, unchecked.join(', '));
    void scheduleExpiryReminder(active.alarmId, at, lang.home.missingTitle, body, unchecked);
  }, [active, routine, items, ticked, lang]);

  // Success: hold the confirmation on screen, then close the routine.
  useEffect(() => {
    if (!success || !routine) return;
    const timer = setTimeout(() => {
      void (async () => {
        await confirm(routine.id, new Date());
        await cancelAlarmAlerts(routine.id);
        await deactivate();
      })();
      show({ payload: { title: lang.home.routineConfirmed, tone: 'success' }, duration: 3000 });
    }, SUCCESS_HOLD_MS);
    return () => clearTimeout(timer);
  }, [success, routine, confirm, deactivate, show, lang]);

  const toggle = useCallback((id: string) => {
    setTicked((current) => ({ ...current, [id]: !current[id] }));
  }, []);

  const complete = useCallback(() => {
    if (routine) setSuccess(true);
  }, [routine]);

  const postpone = useCallback(() => {
    void snooze(SNOOZE_MINUTES);
    show({ payload: { title: lang.home.snoozed }, duration: 2000 });
  }, [snooze, show, lang]);

  const dismiss = useCallback(() => {
    if (active) void cancelAlarmAlerts(active.alarmId);
    reset();
    void deactivate();
  }, [active, reset, deactivate]);

  const confirmAndClose = useCallback(async () => {
    if (!routine) return;
    await confirm(routine.id, new Date());
    await cancelAlarmAlerts(routine.id);
    await deactivate();
    show({ payload: { title: lang.home.routineConfirmed, tone: 'success' }, duration: 3000 });
  }, [routine, confirm, deactivate, show, lang]);

  const acknowledgeMissed = useCallback(() => setMissed(null), []);

  return {
    routine,
    routineItems,
    ticked,
    checkedCount,
    allChecked,
    remaining,
    success,
    missed,
    toggle,
    complete,
    postpone,
    dismiss,
    confirmAndClose,
    acknowledgeMissed,
  };
}
