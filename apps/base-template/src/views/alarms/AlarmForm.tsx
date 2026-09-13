import { useState } from 'react';
import { Text, View, StyleSheet, TextInput, Pressable, Switch, ScrollView } from 'react-native';
import { useNavigator } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useAlarms } from '../../alarms/alarms-context';
import { useItems } from '../../items/items-context';
import { useRouteIntent } from '../../navigator/RouteIntent';
import AppTitle from '../../components/AppTitle';
import AppButton from '../../components/AppButton';
import type { Weekday } from '../../alarms/alarm-types';

const timeRe = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { alarms, addAlarm, updateAlarm } = useAlarms();
  const { items } = useItems();
  const { navigate } = useNavigator();
  const { intent } = useRouteIntent();

  const editing = alarms.find((a) => a.id === intent.alarmId);

  const [label, setLabel] = useState(editing?.label ?? '');
  const [time, setTime] = useState(editing?.time ?? '08:00');
  const [weekdays, setWeekdays] = useState<Weekday[]>(editing?.weekdays ?? [1, 2, 3, 4, 5]);
  const [itemIds, setItemIds] = useState<string[]>(editing?.itemIds ?? []);
  const [enabled, setEnabled] = useState(editing?.enabled ?? true);
  const [timeError, setTimeError] = useState(false);

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
    if (!timeRe.test(time)) {
      setTimeError(true);
      return;
    }
    setTimeError(false);
    const input = { label: label.trim() || lang.alarms.labelPlaceholder, time, weekdays, itemIds, enabled };
    if (editing) {
      await updateAlarm(editing.id, input);
    } else {
      await addAlarm(input);
    }
    navigate('alarms');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppTitle style={{ color: theme.color }}>
        {editing ? lang.alarms.editTitle : lang.alarms.addTitle}
      </AppTitle>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={[styles.fieldLabel, { color: theme.color }]}>{lang.alarms.labelLabel}</Text>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder={lang.alarms.labelPlaceholder}
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.color, borderColor: theme.border }]}
        />

        <Text style={[styles.fieldLabel, { color: theme.color }]}>{lang.alarms.timeLabel}</Text>
        <TextInput
          value={time}
          onChangeText={setTime}
          placeholder={lang.alarms.timePlaceholder}
          placeholderTextColor={theme.muted}
          autoCapitalize="none"
          style={[styles.input, { color: theme.color, borderColor: timeError ? theme.danger : theme.border }]}
        />
        {timeError && <Text style={{ color: theme.danger, fontSize: 12 }}>{lang.alarms.timeInvalid}</Text>}

        <Text style={[styles.fieldLabel, { color: theme.color }]}>{lang.alarms.weekdaysLabel}</Text>
        <View style={styles.weekdays}>
          {(lang.alarms.weekdays as readonly string[]).map((letter, index) => {
            const day = index as Weekday;
            const active = weekdays.includes(day);
            return (
              <Pressable
                key={day}
                onPress={() => toggleWeekday(day)}
                style={[styles.dayChip, {
                  borderColor: theme.border,
                  backgroundColor: active ? theme.success : 'transparent',
                }]}
              >
                <Text style={{ color: active ? '#fff' : theme.color, fontWeight: '700' }}>{letter}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.color }]}>{lang.alarms.itemsLabel}</Text>
        {items.length === 0 ? (
          <Text style={{ color: theme.muted, fontSize: 13 }}>{lang.items.empty}</Text>
        ) : (
          items.map((item) => {
            const active = itemIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => toggleItem(item.id)}
                style={[styles.itemRow, { borderColor: theme.border, backgroundColor: active ? theme.surfaceAlt : 'transparent' }]}
              >
                <View style={[styles.itemDot, { backgroundColor: item.color }]} />
                <Text style={{ color: theme.color }}>{item.name}</Text>
              </Pressable>
            );
          })
        )}

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
        <AppButton style={styles.footerButton} onPress={() => navigate('alarms')}>
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
    padding: 20,
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
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
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
  },
});
