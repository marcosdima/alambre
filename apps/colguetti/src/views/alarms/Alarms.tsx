import { Text, View, StyleSheet, Pressable, Switch } from 'react-native';
import { useNavigator, useToast } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useAlarms } from '../../alarms/alarms-context';
import { nextOccurrence } from '../../alarms/alarms-model';
import { cancelReminder } from '../../notifications/sync';
import type { Alarm } from '../../alarms/alarm-types';
import AppButton from '../../components/AppButton';
import { useRouteIntent } from '../../navigator/RouteIntent';

const formatTime = (time: string) => time;

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { alarms, updateAlarm, removeAlarm } = useAlarms();
  const { navigate } = useNavigator();
  const { show, dismiss } = useToast();
  const { setIntent } = useRouteIntent();
  const now = new Date();

  const openForm = (alarm?: Alarm) => {
    setIntent({ alarmId: alarm?.id });
    navigate('alarms', { subpage: 'alarm-form' });
  };

  const performDelete = async (alarm: Alarm) => {
    await removeAlarm(alarm.id);
    void cancelReminder(alarm.id);
    show({ payload: { title: lang.alarms.deleted, tone: 'success' }, duration: 3000 });
  };

  const requestDelete = (alarm: Alarm) => {
    show({
      payload: {
        title: lang.common.confirmDeleteTitle,
        content: lang.alarms.confirmDeleteMessage.replace('{name}', alarm.label),
      },
      actions: [
        { label: lang.common.cancel, tone: 'primary', onPress: () => dismiss() },
        { label: lang.common.confirm, tone: 'danger', onPress: () => void performDelete(alarm) },
      ],
    });
  };

  const weekdayLabels = lang.alarms.weekdays;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {alarms.length === 0 ? (
        <Text style={[styles.empty, { color: theme.muted }]}>{lang.alarms.empty}</Text>
      ) : (
        alarms.map((alarm) => {
          const next = nextOccurrence(alarm, now);
          const display = next
            ? `${formatTime(alarm.time)} · ${next.toLocaleDateString()}`
            : formatTime(alarm.time);

          return (
            <View
              key={alarm.id}
              style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Pressable style={styles.rowBody} onPress={() => openForm(alarm)}>
                <Text style={[styles.label, { color: theme.color }]}>{alarm.label}</Text>
                <Text style={[styles.meta, { color: theme.muted }]}>
                  {display} · {alarm.weekdays.map((d) => weekdayLabels[d]).join(' ')}
                </Text>
                <Text style={[styles.meta, { color: theme.muted }]}>
                  {alarm.itemIds.length ? `${alarm.itemIds.length} ítems` : lang.alarms.itemsLabel}
                </Text>
              </Pressable>
              <View style={styles.rowActions}>
                <Switch
                  value={alarm.enabled}
                  onValueChange={(enabled) => updateAlarm(alarm.id, { enabled })}
                  trackColor={{ true: theme.success, false: theme.border }}
                />
                <Pressable
                  onPress={() => requestDelete(alarm)}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.delete,
                    { borderColor: theme.border },
                    pressed && styles.deletePressed,
                  ]}
                >
                  <Text style={{ color: theme.danger, fontWeight: '700' }}>{lang.items.delete}</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}

      <View style={styles.footer}>
        <AppButton style={styles.addButton} onPress={() => openForm()}>
          <Text style={{ color: theme.success, fontWeight: '700' }}>{lang.alarms.add}</Text>
        </AppButton>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  empty: {
    fontSize: 15,
    lineHeight: 20,
  },
  row: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowActions: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
  },
  delete: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deletePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  footer: {
    marginTop: 'auto',
  },
  addButton: {
    minWidth: 160,
    alignItems: 'center',
  },
});
