import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useConfirm, useNavigator, useToast } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useItems } from '../../items/items-context';
import { useAlarms } from '../../alarms/alarms-context';
import { ItemIcon, catalogDrawAnimation } from '../../items/icon-catalog';
import type { Item } from '../../items/item-types';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import SwipeableItemRow from '../../components/SwipeableItemRow';
import { useRouteIntent } from '../../navigator/RouteIntent';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { items, removeItem, reorderItems } = useItems();
  const { alarms, updateAlarm } = useAlarms();
  const { navigate } = useNavigator();
  const { show } = useToast();
  const { confirm } = useConfirm();
  const { setIntent } = useRouteIntent();

  const openForm = (item?: Item) => {
    setIntent({ itemId: item?.id });
    navigate('items', { subpage: 'item-form' });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    void reorderItems(reordered);
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
              <SwipeableItemRow
                key={item.id}
                onDelete={() => void tryDelete(item)}
                onPress={() => openForm(item)}
              >
                <AppCard
                  variant="outlined"
                  padding="sm"
                  style={styles.card}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardIcon}>
                      <ItemIcon
                        icon={item.icon}
                        color={item.color}
                        lineWidth={2}
                        delay={150 + index * 60}
                        iconAnimation={catalogDrawAnimation}
                      />
                    </View>
                    <Text style={[styles.cardName, { color: theme.color }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.cardActions}>
                      {items.length > 1 && (
                        <View style={styles.reorderGroup}>
                          <Pressable
                            disabled={index === 0}
                            onPress={(e) => {
                              e.stopPropagation();
                              moveItem(index, 'up');
                            }}
                            accessibilityLabel={`Subir ${item.name}`}
                            accessibilityRole="button"
                            style={({ pressed }) => [
                              styles.stepperBtn,
                              {
                                backgroundColor: theme.surfaceAlt,
                                borderColor: theme.borderSoft,
                                opacity: index === 0 ? 0.3 : 1,
                              },
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text style={[styles.stepperArrow, { color: theme.color }]}>▲</Text>
                          </Pressable>
                          <Pressable
                            disabled={index === items.length - 1}
                            onPress={(e) => {
                              e.stopPropagation();
                              moveItem(index, 'down');
                            }}
                            accessibilityLabel={`Bajar ${item.name}`}
                            accessibilityRole="button"
                            style={({ pressed }) => [
                              styles.stepperBtn,
                              {
                                backgroundColor: theme.surfaceAlt,
                                borderColor: theme.borderSoft,
                                opacity: index === items.length - 1 ? 0.3 : 1,
                              },
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text style={[styles.stepperArrow, { color: theme.color }]}>▼</Text>
                          </Pressable>
                        </View>
                      )}
                      <Text style={[styles.swipeHint, { color: theme.muted }]}>‹ Deslizar</Text>
                    </View>
                  </View>
                </AppCard>
              </SwipeableItemRow>
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
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperArrow: {
    fontSize: 11,
    fontWeight: '800',
  },
  swipeHint: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
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

