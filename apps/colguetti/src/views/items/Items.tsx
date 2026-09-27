import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AlambreIcons, useConfirm, useNavigator, useToast } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useItems } from '../../items/items-context';
import { useAlarms } from '../../alarms/alarms-context';
import { ItemIcon, catalogDrawAnimation } from '../../items/icon-catalog';
import type { Item } from '../../items/item-types';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import { useRouteIntent } from '../../navigator/RouteIntent';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { items, removeItem } = useItems();
  const { alarms, updateAlarm } = useAlarms();
  const { navigate } = useNavigator();
  const { show } = useToast();
  const { confirm } = useConfirm();
  const { setIntent } = useRouteIntent();

  const openForm = (item?: Item) => {
    setIntent({ itemId: item?.id });
    navigate('items', { subpage: 'item-form' });
  };

  const tryDelete = async (item: Item) => {
    const affectedAlarms = alarms.filter((alarm) => alarm.itemIds.includes(item.id));
    const message = affectedAlarms.length > 0
      ? lang.items.confirmDeleteWithAlarms
        .replace('{name}', item.name)
        .replace('{alarms}', affectedAlarms.map((a) => a.label).join(', '))
      : lang.items.confirmDeleteMessage.replace('{name}', item.name);

    const ok = await confirm({
      title: lang.common.confirmDeleteTitle,
      message,
      confirmLabel: lang.common.confirm,
      cancelLabel: lang.common.cancel,
      tone: 'danger',
    });
    if (!ok) return;

    await Promise.all(
      alarms
        .filter((alarm) => alarm.itemIds.includes(item.id))
        .map((alarm) =>
          updateAlarm(alarm.id, {
            itemIds: alarm.itemIds.filter((id) => id !== item.id),
          }),
        ),
    );
    await removeItem(item.id);
    show({ payload: { title: lang.items.deleted, tone: 'success' }, duration: 3000 });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <AppCard variant="outlined" style={styles.emptyCard}>
            <Text style={[styles.empty, { color: theme.muted }]}>{lang.items.empty}</Text>
          </AppCard>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => (
              <AppCard
                key={item.id}
                variant="outlined"
                padding="sm"
                onPress={() => openForm(item)}
                style={styles.card}
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardIcon}>
                    <ItemIcon
                      icon={item.icon}
                      color={item.color}
                      lineWidth={2}
                      delay={350 + index * 80}
                      iconAnimation={catalogDrawAnimation}
                    />
                  </View>
                  <Text style={[styles.cardName, { color: theme.color }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <AppButton
                    variant="ghost"
                    tone="danger"
                    size="sm"
                    iconOnly
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      void tryDelete(item);
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
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <AppButton
          variant="solid"
          tone="primary"
          size="lg"
          fullWidth
          label={lang.items.add}
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
    gap: 10,
  },
  card: {
    borderWidth: 1.5,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 28,
  },
  cardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
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

