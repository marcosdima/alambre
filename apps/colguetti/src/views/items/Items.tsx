import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useNavigator } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useItems } from '../../items/items-context';
import { ItemIcon } from '../../items/icon-catalog';
import type { Item } from '../../items/item-types';
import AppTitle from '../../components/AppTitle';
import AppButton from '../../components/AppButton';
import { useRouteIntent } from '../../navigator/RouteIntent';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { items, removeItem } = useItems();
  const { navigate } = useNavigator();
  const { setIntent } = useRouteIntent();

  const openForm = (item?: Item) => {
    setIntent({ itemId: item?.id });
    navigate('items', { subpage: 'item-form' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppTitle style={{ color: theme.color }}>{lang.items.title}</AppTitle>

      {items.length === 0 ? (
        <Text style={[styles.empty, { color: theme.muted }]}>{lang.items.empty}</Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => openForm(item)}
            style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.iconBox}>
              <ItemIcon icon={item.icon} color={item.color} lineWidth={5} />
            </View>
            <Text style={[styles.name, { color: theme.color }]}>{item.name}</Text>
            <Pressable
              onPress={() => removeItem(item.id)}
              hitSlop={10}
              style={[styles.delete, { borderColor: theme.border }]}
            >
              <Text style={{ color: theme.danger, fontWeight: '700' }}>{lang.items.delete}</Text>
            </Pressable>
          </Pressable>
        ))
      )}

      <View style={styles.footer}>
        <AppButton style={styles.addButton} onPress={() => openForm()}>
          <Text style={{ color: theme.success, fontWeight: '700' }}>{lang.items.add}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  iconBox: {
    width: 40,
    height: 28,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  delete: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  footer: {
    marginTop: 'auto',
  },
  addButton: {
    minWidth: 160,
    alignItems: 'center',
  },
});
