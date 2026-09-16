import { useState } from 'react';
import { Text, TextInput, View, StyleSheet, Pressable, Switch, ScrollView } from 'react-native';
import { useNavigator, useToast, TimePicker } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useAlarms } from '../../alarms/alarms-context';
import { useItems } from '../../items/items-context';
import { ItemIcon, catalogDrawAnimation } from '../../items/icon-catalog';
import { useRouteIntent } from '../../navigator/RouteIntent';
import AppButton from '../../components/AppButton';
import { clampActiveWindowMinutes, withActiveWindowDefault } from '../../alarms/alarms-model';
import type { Weekday } from '../../alarms/alarm-types';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { alarms, addAlarm, updateAlarm } = useAlarms();
  const { items } = useItems();
  const { previous } = useNavigator();
  const { show } = useToast();
  const { intent, setIntent } = useRouteIntent();

  const editing = alarms.find((a) => a.id === intent.alarmId);

  const [label, setLabel] = useState(editing?.label ?? '');
  const [labelError, setLabelError] = useState(false);
  const [time, setTime] = useState(editing?.time ?? '08:00');
  const [weekdays, setWeekdays] = useState<Weekday[]>(editing?.weekdays ?? [1, 2, 3, 4, 5]);
  const [itemIds, setItemIds] = useState<string[]>(editing?.itemIds ?? []);
  const [enabled, setEnabled] = useState(editing?.enabled ?? true);
  const [activeWindowMinutes, setActiveWindowMinutes] = useState(
    withActiveWindowDefault(editing?.activeWindowMinutes),
  );

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
        <Text style={[styles.fieldLabel, { color: theme.color }]}>{lang.alarms.labelLabel}</Text>
        <TextInput
          value={label}
          onChangeText={(value) => {
            setLabel(value);
            if (labelError && value.trim()) setLabelError(false);
          }}
          placeholder={lang.alarms.labelPlaceholder}
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.color, borderColor: labelError ? theme.danger : theme.border }]}
        />
        {labelError && <Text style={[styles.errorText, { color: theme.danger }]}>{lang.alarms.labelRequired}</Text>}
        <Text style={[styles.fieldLabel, { color: theme.color }]}>{lang.alarms.timeLabel}</Text>
        <TimePicker value={time} onChange={setTime} accentColor={theme.primary} testID="alarm-time" />

        <Text style={[styles.fieldLabel, { color: theme.color }]}>{lang.alarms.weekdaysLabel}</Text>
        <View style={styles.weekdays}>
          {(lang.alarms.weekdays as readonly string[]).map((letter, index) => {
            const day = index as Weekday;
            const active = weekdays.includes(day);
            return (
              <Pressable
                key={day}
                onPress={() => toggleWeekday(day)}
                style={({ pressed }) => [
                  styles.dayChip,
                  {
                    borderColor: active ? theme.primary : theme.border,
                    backgroundColor: active ? theme.primary : 'transparent',
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={{ color: active ? theme.onPrimary : theme.color, fontWeight: '700' }}>{letter}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.color }]}>{lang.alarms.itemsLabel}</Text>
        {items.length === 0 ? (
          <Text style={{ color: theme.muted, fontSize: 13 }}>{lang.items.empty}</Text>
        ) : (
          <View style={styles.itemsList}>
            {items.map((item, index) => {
              const active = itemIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  style={({ pressed }) => [
                    styles.itemCell,
                    {
                      borderColor: active ? theme.primary : theme.border,
                      backgroundColor: active ? theme.primarySoft : 'transparent',
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.itemIcon}>
                    <ItemIcon icon={item.icon} color={active ? theme.primary : theme.muted} lineWidth={2} delay={350 + index * 80} iconAnimation={catalogDrawAnimation} />
                  </View>
                  <Text style={[styles.itemName, { color: active ? theme.primary : theme.color }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={[styles.itemCheck, { borderColor: active ? theme.primary : theme.border }]}>
                    {active && <Text style={[styles.itemCheckMark, { color: theme.primary }]}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={[styles.fieldLabel, { color: theme.color }]}>{lang.alarms.windowLabel}</Text>
        <View style={styles.windowRow}>
          <Pressable
            onPress={() => setActiveWindowMinutes((minutes) => clampActiveWindowMinutes(minutes - 1))}
            style={[styles.windowButton, { borderColor: theme.border }]}
            hitSlop={8}
          >
            <Text style={{ color: theme.color, fontSize: 18, fontWeight: '800', lineHeight: 22 }}>−</Text>
          </Pressable>
          <Text style={{ color: theme.color, fontWeight: '700' }}>
            {activeWindowMinutes} {lang.alarms.minutes}
          </Text>
          <Pressable
            onPress={() => setActiveWindowMinutes((minutes) => clampActiveWindowMinutes(minutes + 1))}
            style={[styles.windowButton, { borderColor: theme.border }]}
            hitSlop={8}
          >
            <Text style={{ color: theme.color, fontSize: 18, fontWeight: '800', lineHeight: 22 }}>+</Text>
          </Pressable>
        </View>

        <View style={styles.enabledRow}>
          <Text style={{ color: theme.color }}>{lang.alarms.enabledLabel}</Text>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ true: theme.success, false: theme.border }}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton style={styles.footerButton} onPress={close}>
          <Text style={{ color: theme.muted, fontWeight: '700' }}>{lang.common.cancel}</Text>
        </AppButton>
        <AppButton style={styles.footerButton} onPress={onSave}>
          <Text style={{ color: theme.success, fontWeight: '700' }}>{lang.common.save}</Text>
        </AppButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  body: {
    gap: 10,
    paddingBottom: 20,
  },
  fieldLabel: {
    fontWeight: '700',
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: -2,
  },
  weekdays: {
    flexDirection: 'row',
    gap: 8,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  itemsList: {
    flexDirection: 'column',
    gap: 8,
  },
  itemCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemIcon: {
    width: 40,
    height: 26,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  itemCheck: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCheckMark: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  windowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  windowButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  enabledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
  },
});
