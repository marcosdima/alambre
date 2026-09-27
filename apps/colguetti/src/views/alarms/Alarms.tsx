import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AlambreIcons, useConfirm, useNavigator, useToast } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useAlarms } from '../../alarms/alarms-context';
import { nextOccurrence } from '../../alarms/alarms-model';
import { cancelAlarmAlerts } from '../../notifications/expiry';
import type { Alarm } from '../../alarms/alarm-types';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppBadge from '../../components/AppBadge';
import AppSwitch from '../../components/AppSwitch';
import { useRouteIntent } from '../../navigator/RouteIntent';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { alarms, updateAlarm, removeAlarm } = useAlarms();
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {alarms.length === 0 ? (
          <AppCard variant="outlined" style={styles.emptyCard}>
            <Text style={[styles.empty, { color: theme.muted }]}>{lang.alarms.empty}</Text>
          </AppCard>
        ) : (
          <View style={styles.list}>
            {alarms.map((alarm) => {
              const next = nextOccurrence(alarm, now);
              const display = next
                ? `${alarm.time} · ${next.toLocaleDateString()}`
                : alarm.time;

              const weekdaysString = alarm.weekdays
                .map((d) => weekdayLabels[d])
                .join(' · ');

              const itemsCountText = alarm.itemIds.length
                ? lang.alarms.count.replace('{count}', String(alarm.itemIds.length))
                : lang.alarms.itemsLabel;

              return (
                <AppCard
                  key={alarm.id}
                  variant="outlined"
                  padding="md"
                  onPress={() => openForm(alarm)}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                      <Text style={[styles.label, { color: theme.color }]} numberOfLines={1}>
                        {alarm.label}
                      </Text>
                      <AppBadge
                        label={display}
                        tone={alarm.enabled ? 'primary' : 'neutral'}
                        variant={alarm.enabled ? 'soft' : 'outline'}
                        size="sm"
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
                      {weekdaysString}
                    </Text>
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: theme.borderSoft }]}>
                    <AppBadge
                      label={itemsCountText}
                      tone="neutral"
                      variant="soft"
                      size="sm"
                    />
                    <AppButton
                      variant="ghost"
                      tone="danger"
                      size="sm"
                      iconOnly
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        void tryDelete(alarm);
                      }}
                      leftIcon={
                        <AlambreIcons.Cross
                          drawIt
                          color={theme.danger}
                          lineWidth={2}
                          style={styles.crossIcon}
                        />
                      }
                    />
                  </View>
                </AppCard>
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
    paddingBottom: 90,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaRow: {
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  crossIcon: {
    width: 14,
    height: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 12,
  },
});

