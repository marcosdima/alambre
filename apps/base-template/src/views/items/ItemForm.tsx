import { useState } from 'react';
import { ScrollView, Text, TextInput, View, StyleSheet, Pressable } from 'react-native';
import { useNavigator } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useItems } from '../../items/items-context';
import { ItemIcon } from '../../items/icon-catalog';
import { itemColors } from '../../items/items-model';
import { itemIconKeys, type ItemIconKey } from '../../items/item-types';
import AppTitle from '../../components/AppTitle';
import AppButton from '../../components/AppButton';
import { useRouteIntent } from '../../navigator/RouteIntent';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { items, addItem, updateItem } = useItems();
  const { intent, setIntent } = useRouteIntent();
  const { previous } = useNavigator();

  const editing = items.find((item) => item.id === intent.itemId);

  const [name, setName] = useState(editing?.name ?? '');
  const [color, setColor] = useState(editing?.color ?? itemColors[0]);
  const [icon, setIcon] = useState<ItemIconKey>(editing?.icon ?? 'keys');

  const close = () => {
    setIntent({});
    previous();
  };

  const save = async () => {
    if (!name.trim()) return;
    if (editing) {
      await updateItem(editing.id, { name: name.trim(), color, icon });
    } else {
      await addItem({ name: name.trim(), color, icon });
    }
    close();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <AppTitle style={{ color: theme.color }}>
        {editing ? lang.items.editTitle : lang.items.addTitle}
      </AppTitle>

      <View style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.muted }]}>{lang.items.nameLabel}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={lang.items.namePlaceholder}
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.color }]}
        />
      </View>

      <View style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.muted }]}>{lang.items.colorLabel}</Text>
        <View style={styles.colorRow}>
          {itemColors.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.colorDot,
                { backgroundColor: c, borderColor: theme.border },
                color === c && styles.colorDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.muted }]}>{lang.items.iconLabel}</Text>
        <View style={styles.iconGrid}>
          {itemIconKeys.map((key) => (
            <Pressable
              key={key}
              onPress={() => setIcon(key)}
              style={[
                styles.iconCell,
                { borderColor: theme.border, backgroundColor: theme.surfaceAlt },
                icon === key && { borderColor: theme.primary, backgroundColor: theme.primarySoft },
              ]}
            >
              <ItemIcon icon={key} color={color} lineWidth={5} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton style={styles.actionGhost} onPress={close}>
          <Text style={{ color: theme.warning, fontWeight: '700' }}>{lang.common.cancel}</Text>
        </AppButton>
        <AppButton style={styles.actionPrimary} onPress={save}>
          <Text style={{ color: theme.success, fontWeight: '700' }}>{lang.common.save}</Text>
        </AppButton>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  field: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    fontSize: 16,
    paddingVertical: 4,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 2,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconCell: {
    width: 44,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionGhost: {
    flex: 1,
  },
  actionPrimary: {
    flex: 1,
  },
});
