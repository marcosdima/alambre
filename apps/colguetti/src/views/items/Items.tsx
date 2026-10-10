import AppText from '../../components/AppText';
import { Pressable, ScrollView, StyleSheet,  View } from 'react-native';
import { useConfirm, useNavigator, useToast, Typewriter, DropInTitle } from 'alambre';
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
import { ItemsGlyph } from '../../components/illustrations/SkiaArt';

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
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screenHeader}>
          <DropInTitle text={lang.items.title} textStyle={[styles.screenTitle, { color: theme.color }]} />
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ItemsGlyph line={theme.color} size={140} />
            <Typewriter
              text={lang.items.empty}
              textStyle={[styles.empty, { color: theme.color, opacity: 0.6 }]}
              initialDelay={300}
              cursorColor={theme.primary}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => (
              <SwipeableItemRow
                key={item.id}
                onDelete={() => void tryDelete(item)}
                onPress={() => openForm(item)}
                peekIndex={index === 0 ? 0 : undefined}
              >
                <AppCard
                  variant="soft"
                  padding="sm"
                  style={styles.card}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardIcon}>
                      <ItemIcon
                        icon={item.icon}
                        color={item.color}
                        lineWidth={2}
                        delay={340 + index * 40}
                        iconAnimation={catalogDrawAnimation}
                      />
                    </View>
                    <AppText style={[styles.cardName, { color: theme.color }]} numberOfLines={1}>
                      {item.name}
                    </AppText>
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
                            <AppText style={[styles.stepperArrow, { color: theme.color }]}>▲</AppText>
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
                            <AppText style={[styles.stepperArrow, { color: theme.color }]}>▼</AppText>
                          </Pressable>
                        </View>
                      )}
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
    paddingBottom: 20,
  },
  screenHeader: {
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  screenTitle: {

    fontSize: 42,
    letterSpacing: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 24,
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
    borderRadius: 24,
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

  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
});

