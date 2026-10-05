import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useActivation } from './activation-context';
import { useAlarms } from '../alarms/alarms-context';
import { useItems } from '../items/items-context';
import { useConfirmations } from './confirmations-context';
import { useLang } from '../providers/lang';
import { useLightDark } from '../providers/theme';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  withSpring,
  withSequence,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import { ItemIcon } from '../items/icon-catalog';
import { AlambreIcons, useToast } from 'alambre';
import { cancelAlarmAlerts } from '../notifications/expiry';

export default function ActivationOverlay() {
  const { active, deactivate, snooze } = useActivation();
  const { alarms } = useAlarms();
  const { items } = useItems();
  const { confirm } = useConfirmations();
  const { lang } = useLang();
  const { theme } = useLightDark();
  const { show } = useToast();

  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);

  const routine = useMemo(
    () => (active ? alarms.find((a) => a.id === active.alarmId) ?? null : null),
    [active, alarms]
  );
  const routineItems = useMemo(
    () => (routine ? items.filter((i) => routine.itemIds.includes(i.id)) : []),
    [routine, items]
  );

  useEffect(() => {
    if (active && !success) {
      if (routineItems.length > 0 && routineItems.every((i) => ticked[i.id])) {
        setSuccess(true);
      }
    }
  }, [ticked, routineItems, active, success]);

  // Success flow
  useEffect(() => {
    if (!success || !routine) return;
    const timer = setTimeout(() => {
      void (async () => {
        await confirm(routine.id, new Date());
        await cancelAlarmAlerts(routine.id);
        await deactivate();
      })();
      show({ payload: { title: 'Routine Completed!', tone: 'success' }, duration: 3000 });
      setTicked({});
      setSuccess(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [success, routine, confirm, deactivate, show]);

  const onSnooze = () => {
    void snooze(10);
    show({ payload: { title: 'Snoozed for 10m' }, duration: 2000 });
  };

  const onCancel = () => {
    if (routine) void cancelAlarmAlerts(routine.id);
    setTicked({});
    setSuccess(false);
    void deactivate();
  };

  if (!active || !routine) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.overlay]}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <Animated.View
        style={styles.container}
        entering={SlideInDown.springify().damping(18).stiffness(200)}
        exiting={SlideOutDown.duration(300)}
      >
        <AppCard
          variant="soft"
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.color }]}>{routine.label}</Text>
            <Text style={[styles.time, { color: theme.primary }]}>{routine.time}</Text>
          </View>

          {success ? (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.successContainer}
            >
              <View style={[styles.successBadge, { backgroundColor: theme.success }]}>
                <AlambreIcons.Tick color="#fff" lineWidth={3} style={styles.successIcon} />
              </View>
              <Text style={[styles.successText, { color: theme.color }]}>¡Listo!</Text>
            </Animated.View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {routineItems.map((item) => {
                const isTicked = !!ticked[item.id];
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setTicked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                  >
                    <Animated.View
                      style={[
                        styles.itemRow,
                        {
                          backgroundColor: isTicked ? theme.primarySoft : theme.surfaceAlt,
                          borderColor: isTicked ? theme.primary : 'transparent',
                        },
                      ]}
                    >
                      <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                        <ItemIcon
                          icon={item.icon}
                          color="#fff"
                          style={styles.itemIcon}
                          lineWidth={2}
                        />
                      </View>
                      <Text
                        style={[
                          styles.itemName,
                          {
                            color: isTicked ? theme.primary : theme.color,
                            textDecorationLine: isTicked ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: isTicked ? theme.primary : theme.muted,
                            backgroundColor: isTicked ? theme.primary : 'transparent',
                          },
                        ]}
                      >
                        {isTicked && <AlambreIcons.Tick color="#fff" lineWidth={2.5} style={styles.checkIcon} />}
                      </View>
                    </Animated.View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {!success && (
            <View style={styles.actions}>
              <AppButton
                variant="outline"
                tone="neutral"
                label="Dismiss"
                style={styles.actionBtn}
                onPress={onCancel}
              />
              <AppButton
                variant="solid"
                tone="warning"
                label="Snooze"
                style={styles.actionBtn}
                onPress={onSnooze}
              />
            </View>
          )}
        </AppCard>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 9999,
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1.5,
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  time: {
    fontSize: 22,
    fontWeight: '700',
  },
  scroll: {
    maxHeight: 300,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    width: 24,
    height: 24,
  },
  itemName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    width: 18,
    height: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIcon: {
    width: 40,
    height: 40,
  },
  successText: {
    fontSize: 24,
    fontWeight: '800',
  },
});
