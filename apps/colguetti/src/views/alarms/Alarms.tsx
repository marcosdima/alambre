import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useConfirm, useNavigator, useToast } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useAlarms } from '../../alarms/alarms-context';
import { useItems } from '../../items/items-context';
import { ItemIcon } from '../../items/icon-catalog';
import type { Item } from '../../items/item-types';
import { nextOccurrence } from '../../alarms/alarms-model';
import { cancelAlarmAlerts } from '../../notifications/expiry';
import type { Alarm } from '../../alarms/alarm-types';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppBadge from '../../components/AppBadge';
import AppSwitch from '../../components/AppSwitch';
import SwipeableItemRow from '../../components/SwipeableItemRow';
import { useRouteIntent } from '../../navigator/RouteIntent';

const MAX_VISIBLE_ITEMS = 3;

const AlarmItemsSummary = ({
  items,
  theme,
  emptyLabel,
}: {
  items: Item[];
  theme: {
    color: string;
    borderSoft: string;
    surfaceAlt: string;
    primary: string;
  };
  emptyLabel: string;
}) => {
  if (items.length === 0) {
    return (
      <View style={styles.itemSummaryRow}>
        <AppBadge label={emptyLabel} tone="neutral" variant="soft" size="sm" />
      </View>
    );
  }

  const visible = items.slice(0, MAX_VISIBLE_ITEMS);
  const remaining = items.length - MAX_VISIBLE_ITEMS;

  return (
    <View style={styles.itemSummaryRow}>
      {visible.map((item) => (
        <View
          key={item.id}
          style={[
            styles.itemChip,
            {
              borderColor: item.color || theme.borderSoft,
              backgroundColor: theme.surfaceAlt,
            },
          ]}
        >
          <View style={styles.itemIconBubble}>
            <ItemIcon
              icon={item.icon}
              color={item.color}
              lineWidth={1.8}
            />
          </View>
          <Text
            numberOfLines={1}
            style={[styles.itemChipName, { color: theme.color }]}
          >
            {item.name}
          </Text>
        </View>
      ))}

      {remaining > 0 && (
        <AppBadge
          label={`+${remaining}`}
          tone="neutral"
          variant="outline"
          size="sm"
        />
      )}
    </View>
  );
};

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { alarms, updateAlarm, removeAlarm } = useAlarms();
  const { items } = useItems();
  const { navigate } = useNavigator();
  const { show } = useToast();
  const { confirm } = useConfirm();
  const { setIntent } = useRouteIntent();
  const now = new Date();

  const openForm = (alarm?: Alarm) => {
    setIntent({ alarmId: alarm?.id });
    navigate('alarms', { subpage: 'alarm-form' });
  };

  const tryDelete = async (alarm: Alarm) => {
    const ok = await confirm({
      title: lang.common.confirmDeleteTitle,
      message: lang.alarms.confirmDeleteMessage.replace('{name}', alarm.label),
      confirmLabel: lang.common.confirm,
      cancelLabel: lang.common.cancel,
      tone: 'danger',
    });
    if (!ok) return;
    await removeAlarm(alarm.id);
    void cancelAlarmAlerts(alarm.id);
    show({ payload: { title: lang.alarms.deleted, content: alarm.label, tone: 'success' }, duration: 3000 });
  };

  const weekdayLabels = lang.alarms.weekdays;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {alarms.length === 0 ? (
          <AppCard variant="outlined" style={styles.emptyCard}>
            <Text style={[styles.empty, { color: theme.muted }]}>{lang.alarms.empty}</Text>
          </AppCard>
        ) : (
          <View style={styles.list}>
            {alarms.map((alarm, index) => {
              const next = nextOccurrence(alarm, now);
              const weekdaysString = alarm.weekdays
                .map((d) => weekdayLabels[d])
                .join(' · ');

              const alarmItems = items.filter((it) => alarm.itemIds.includes(it.id));

              return (
                <SwipeableItemRow
                  key={alarm.id}
                  onDelete={() => void tryDelete(alarm)}
                  onPress={() => openForm(alarm)}
                  peekIndex={index === 0 ? 0 : undefined}
                >
                  <AppCard
                    variant="outlined"
                    padding="md"
                    style={styles.card}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.headerLeft}>
                        <Text style={[styles.label, { color: theme.color }]} numberOfLines={1}>
                          {alarm.label}
                        </Text>
                        <AppBadge
                          label={alarm.time}
                          tone={alarm.enabled ? 'primary' : 'neutral'}
                          variant={alarm.enabled ? 'soft' : 'outline'}
                          size="md"
                        />
                      </View>
                      <AppSwitch
                        checked={alarm.enabled}
                        onChange={(enabled) => updateAlarm(alarm.id, { enabled })}
                        size="sm"
                      />
                    </View>

                    <View style={styles.metaRow}>
                      <Text style={[styles.metaText, { color: theme.muted }]}>
                        {weekdaysString}{next ? ` · Próx: ${next.toLocaleDateString()}` : ''}
                      </Text>
                    </View>

                    <View style={[styles.cardFooter, { borderTopColor: theme.borderSoft }]}>
                      <AlarmItemsSummary
                        items={alarmItems}
                        theme={theme}
                        emptyLabel={lang.alarms.itemsLabel}
                      />
                    </View>
                  </AppCard>
                </SwipeableItemRow>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <AppButton
          variant="solid"
          tone="primary"
          size="lg"
          fullWidth
          label={lang.alarms.add}
          onPress={() => openForm()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  list: {
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  metaRow: {
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  itemSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 28,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    borderWidth: 1.2,
    maxWidth: 110,
    flexShrink: 1,
  },
  itemIconBubble: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemChipName: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
});

