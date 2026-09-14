import { useState } from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useNavigator, useToast } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useItems } from '../../items/items-context';
import { ItemIcon } from '../../items/icon-catalog';
import type { Item } from '../../items/item-types';
import AppButton from '../../components/AppButton';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useRouteIntent } from '../../navigator/RouteIntent';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { items, removeItem } = useItems();
  const { navigate } = useNavigator();
  const { show } = useToast();
  const { setIntent } = useRouteIntent();
  const [toBeDeleted, setToBeDeleted] = useState<Item | null>(null);

  const openForm = (item?: Item) => {
    setIntent({ itemId: item?.id });
    navigate('items', { subpage: 'item-form' });
  };

  const confirmDelete = async () => {
    if (!toBeDeleted) return;
    await removeItem(toBeDeleted.id);
    show({ payload: { title: lang.items.deleted, tone: 'success' }, duration: 3000 });
    setToBeDeleted(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {items.length === 0 ? (
        <Text style={[styles.empty, { color: theme.muted }]}>{lang.items.empty}</Text>
      ) : (
        <View style={styles.grid}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => openForm(item)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardIcon}>
                <ItemIcon icon={item.icon} color={item.color} lineWidth={5} />
              </View>
              <Text style={[styles.cardName, { color: theme.color }]} numberOfLines={1}>{item.name}</Text>
              <Pressable
                onPress={() => setToBeDeleted(item)}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.delete,
                  { borderColor: theme.border },
                  pressed && styles.cardPressed,
                ]}
              >
                <Text style={{ color: theme.danger, fontWeight: '700' }}>×</Text>
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <AppButton style={styles.addButton} onPress={() => openForm()}>
          <Text style={{ color: theme.success, fontWeight: '700' }}>{lang.items.add}</Text>
        </AppButton>
      </View>

      <ConfirmDialog
        visible={toBeDeleted !== null}
        title={lang.common.confirmDeleteTitle}
        message={lang.items.confirmDeleteMessage.replace('{name}', toBeDeleted?.name ?? '')}
        confirmLabel={lang.common.confirm}
        cancelLabel={lang.common.cancel}
        onConfirm={confirmDelete}
        onCancel={() => setToBeDeleted(null)}
      />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  cardIcon: {
    width: 56,
    height: 36,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  delete: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto',
  },
  addButton: {
    minWidth: 160,
    alignItems: 'center',
  },
});
