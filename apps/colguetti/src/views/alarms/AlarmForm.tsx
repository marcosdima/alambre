import { useMemo, useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stepper, useNavigator, useToast } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useConfig } from '../../providers/config';
import { useAlarms } from '../../alarms/alarms-context';
import { useItems } from '../../items/items-context';
import { ItemIcon, catalogDrawAnimation } from '../../items/icon-catalog';
import { useRouteIntent } from '../../navigator/RouteIntent';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppTextInput from '../../components/AppTextInput';
import AppSwitch from '../../components/AppSwitch';
import SwipeableTimePicker from '../../components/SwipeableTimePicker';
import AnimatedCounter from '../../components/AnimatedCounter';
import { clampActiveWindowMinutes, withActiveWindowDefault } from '../../alarms/alarms-model';
import type { Weekday } from '../../alarms/alarm-types';
import AppText from '../../components/AppText';
import DropInTitle from '../../components/DropInTitle';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { config } = useConfig();
  const { alarms, addAlarm, updateAlarm } = useAlarms();
  const { items } = useItems();
  const { previous } = useNavigator();
  const { show } = useToast();
  const { intent, setIntent } = useRouteIntent();

  const editing = alarms.find((a) => a.id === intent.alarmId);
  const defaultGraceMinutes = parseInt(config.leaveGraceMinutes, 10) || 10;

  const [label, setLabel] = useState(editing?.label ?? '');
  const [labelError, setLabelError] = useState(false);
  const [time, setTime] = useState(editing?.time ?? '08:00');
  const [weekdays, setWeekdays] = useState<Weekday[]>(editing?.weekdays ?? [1, 2, 3, 4, 5]);
  const [itemIds, setItemIds] = useState<string[]>(editing?.itemIds ?? []);
  const [enabled, setEnabled] = useState(editing?.enabled ?? true);
  const [activeWindowMinutes, setActiveWindowMinutes] = useState(
    withActiveWindowDefault(editing?.activeWindowMinutes, defaultGraceMinutes),
  );

  const [isTransitioning, setIsTransitioning] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsTransitioning(false), 150);
    return () => clearTimeout(t);
  }, []);

  const orderedItems = useMemo(() => {
    if (isTransitioning) return [];
    const included = itemIds
      .map((id) => items.find((it) => it.id === id))
      .filter((it): it is (typeof items)[number] => it !== undefined);
    const unselected = items.filter((it) => !itemIds.includes(it.id));
    return [...included, ...unselected];
  }, [items, itemIds, isTransitioning]);

  const close = () => {
    setIntent({});
    previous();
  };

  const toggleWeekday = (day: Weekday) => {
    setWeekdays((current) => (
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    ));
  };

  const toggleItem = (id: string) => {
    setItemIds((current) => (
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
    ));
  };

  const moveIncludedItem = (id: string, direction: 'up' | 'down') => {
    const currentIndex = itemIds.indexOf(id);
    if (currentIndex < 0) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= itemIds.length) return;
    const next = [...itemIds];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    setItemIds(next);
  };

  const onSave = async () => {
    const labelValue = label.trim();
    if (!labelValue) {
      setLabelError(true);
      return;
    }
    setLabelError(false);
    const input = {
      label: labelValue,
      time,
      weekdays,
      itemIds,
      enabled,
      activeWindowMinutes: clampActiveWindowMinutes(activeWindowMinutes),
    };
    const content = `${labelValue} · ${time}`;
    if (editing) {
      await updateAlarm(editing.id, input);
      show({ payload: { title: lang.alarms.updated, content, tone: 'success' }, duration: 3000 });
    } else {
      await addAlarm(input);
      show({ payload: { title: lang.alarms.created, content, tone: 'success' }, duration: 3000 });
    }
    close();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <DropInTitle text={editing ? lang.alarms.editTitle : lang.alarms.addTitle} textStyle={{ color: theme.color, fontSize: 32, fontFamily: 'Kranky', marginBottom: 12 }} />
        <AppTextInput
          testID="alarm-label-input"
          label={lang.alarms.labelLabel}
          required
          value={label}
          onChangeText={(value) => {
            setLabel(value);
            if (labelError && value.trim()) setLabelError(false);
          }}
          placeholder={lang.alarms.labelPlaceholder}
          clearable
          errorMessage={labelError ? lang.alarms.labelRequired : undefined}
          shellStyle={{ backgroundColor: theme.primarySoft, borderColor: theme.primary }}
        />

        <AppCard
          variant="soft"
          selected
          title={lang.alarms.timeLabel}
          style={styles.card}
        >
          <View style={styles.timePickerContainer}>
            <SwipeableTimePicker
              value={time}
              onChange={setTime}
              accentColor={theme.primary}
              testID="alarm-time"
            />
          </View>
        </AppCard>

        <AppCard
          variant="soft"
          selected
          title={lang.alarms.weekdaysLabel}
          style={styles.card}
        >
          <View style={styles.weekdaysRow}>
            {(lang.alarms.weekdays as readonly string[]).map((letter, index) => {
              const day = index as Weekday;
              const active = weekdays.includes(day);
              return (
                <Pressable
                  key={day}
                  accessibilityLabel={`Día ${letter}`}
                  accessibilityRole="button"
                  onPress={() => toggleWeekday(day)}
                  style={({ pressed }) => [
                    styles.daySquare,
                    {
                      backgroundColor: active ? theme.primary : theme.surface,
                      borderColor: active ? theme.primary : theme.borderSoft,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText
                    style={[
                      styles.dayText,
                      { color: active ? theme.onPrimary : theme.muted },
                    ]}
                  >
                    {letter}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </AppCard>

        <AppCard
          variant="soft"
          selected
          title={lang.alarms.itemsLabel}
          subtitle={
            itemIds.length > 0
              ? lang.alarms.count.replace('{count}', String(itemIds.length))
              : undefined
          }
          style={styles.card}
        >
          {items.length === 0 ? (
            <AppText style={{ color: theme.muted, fontSize: 13 }}>{lang.items.empty}</AppText>
          ) : isTransitioning ? (
            <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
              <AppText style={{ color: theme.muted, fontSize: 13 }}>Cargando ítems...</AppText>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {orderedItems.map((item, index) => {
                const active = itemIds.includes(item.id);
                const orderIndex = itemIds.indexOf(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleItem(item.id)}
                    style={({ pressed }) => [
                      styles.itemCell,
                      {
                        borderColor: active ? theme.primary : theme.borderSoft,
                        backgroundColor: active ? theme.primary : theme.surface,
                        borderWidth: active ? 2 : 1,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.itemIcon}>
                      <ItemIcon
                        icon={item.icon}
                        color={item.color}
                        lineWidth={2}
                        delay={350 + index * 80}
                        iconAnimation={catalogDrawAnimation}
                      />
                    </View>
                    <AppText
                      style={[
                        styles.itemName,
                        { color: active ? theme.onPrimary : theme.color, fontWeight: active ? '700' : '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </AppText>

                    {active && itemIds.length > 1 && (
                      <View style={styles.itemOrderControls}>
                        <Pressable
                          disabled={orderIndex === 0}
                          onPress={(e) => {
                            e.stopPropagation();
                            moveIncludedItem(item.id, 'up');
                          }}
                          accessibilityLabel="Subir prioridad"
                          style={({ pressed }) => [
                            styles.orderBtn,
                            { backgroundColor: theme.surface, opacity: orderIndex === 0 ? 0.3 : 1 },
                            pressed && styles.pressed,
                          ]}
                        >
                          <AppText style={[styles.orderArrow, { color: theme.color }]}>▲</AppText>
                        </Pressable>
                        <Pressable
                          disabled={orderIndex === itemIds.length - 1}
                          onPress={(e) => {
                            e.stopPropagation();
                            moveIncludedItem(item.id, 'down');
                          }}
                          accessibilityLabel="Bajar prioridad"
                          style={({ pressed }) => [
                            styles.orderBtn,
                            { backgroundColor: theme.surface, opacity: orderIndex === itemIds.length - 1 ? 0.3 : 1 },
                            pressed && styles.pressed,
                          ]}
                        >
                          <AppText style={[styles.orderArrow, { color: theme.color }]}>▼</AppText>
                        </Pressable>
                      </View>
                    )}

                    <View
                      style={[
                        styles.itemCheck,
                        {
                          borderColor: active ? theme.onPrimary : theme.border,
                          backgroundColor: active ? theme.onPrimary : 'transparent',
                        },
                      ]}
                    >
                      {active && (
                        <AppText style={[styles.itemCheckMark, { color: theme.primary }]}>✓</AppText>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </AppCard>

        <AppCard
          variant="soft"
          selected
          title={lang.alarms.windowLabel}
          style={styles.card}
        >
          <View style={styles.stepperContainer}>
            <Stepper
              value={activeWindowMinutes}
              onChange={setActiveWindowMinutes}
              min={1}
              max={60}
              step={1}
            >
              {({ value: currentVal, increment, decrement, canIncrement, canDecrement }) => (
                <View style={styles.windowRow}>
                  <AppButton
                    variant="outline"
                    tone="neutral"
                    size="sm"
                    iconOnly
                    disabled={!canDecrement}
                    onPress={decrement}
                    label="−"
                    style={styles.windowBtn}
                  />
                  <AnimatedCounter
                    value={currentVal}
                    suffix={lang.alarms.minutes}
                    color={theme.color}
                    fontSize={20}
                  />
                  <AppButton
                    variant="outline"
                    tone="neutral"
                    size="sm"
                    iconOnly
                    disabled={!canIncrement}
                    onPress={increment}
                    label="+"
                    style={styles.windowBtn}
                  />
                </View>
              )}
            </Stepper>
          </View>
        </AppCard>


        <AppCard
          variant="soft"
          selected
          style={styles.card}
        >
          <AppSwitch
            checked={enabled}
            onChange={setEnabled}
            label={lang.alarms.enabledLabel}
            activeTone="primary"
          />
        </AppCard>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <AppButton
          variant="outline"
          tone="neutral"
          style={styles.footerBtn}
          label={lang.common.cancel}
          onPress={close}
        />
        <AppButton
          variant="solid"
          tone="primary"
          style={styles.footerBtn}
          label={lang.common.save}
          onPress={onSave}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    padding: 20,
    gap: 16,
    paddingBottom: 90,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 24,
  },
  timePickerContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    gap: 6,
  },
  daySquare: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,

  },
  itemsList: {
    flexDirection: 'column',
    gap: 8,
    paddingTop: 6,
  },
  itemCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  itemIcon: {
    width: 40,
    height: 26,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
  },
  itemOrderControls: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  orderBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderArrow: {
    fontSize: 10,

  },
  itemCheck: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCheckMark: {
    fontSize: 13,

    lineHeight: 16,
  },
  stepperContainer: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  windowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  windowBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 12,
  },
  footerBtn: {
    flex: 1,
  },
});

