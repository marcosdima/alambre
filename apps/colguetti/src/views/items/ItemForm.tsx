import { useState } from 'react';
import { ScrollView, Text, TextInput, View, StyleSheet, Pressable } from 'react-native';
import { useNavigator, useToast } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useItems } from '../../items/items-context';
import { ItemIcon } from '../../items/icon-catalog';
import { itemColors } from '../../items/items-model';
import { itemIconKeys, type ItemIconKey } from '../../items/item-types';
import AppButton from '../../components/AppButton';
import { useRouteIntent } from '../../navigator/RouteIntent';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { items, addItem, updateItem } = useItems();
  const { intent, setIntent } = useRouteIntent();
  const { previous } = useNavigator();
  const { show } = useToast();

  const editing = items.find((item) => item.id === intent.itemId);

  const [name, setName] = useState(editing?.name ?? '');
  const [nameError, setNameError] = useState(false);
  const [color, setColor] = useState(editing?.color ?? itemColors[0]);
  const [icon, setIcon] = useState<ItemIconKey>(editing?.icon ?? 'keys');

  const close = () => {
    setIntent({});
    previous();
  };

  const save = async () => {
    const value = name.trim();
    if (!value) {
      setNameError(true);
      return;
    }
    setNameError(false);
    if (editing) {
      await updateItem(editing.id, { name: value, color, icon });
      show({ payload: { title: lang.items.updated, content: value, tone: 'success' }, duration: 3000 });
    } else {
      await addItem({ name: value, color, icon });
      show({ payload: { title: lang.items.created, content: value, tone: 'success' }, duration: 3000 });
    }
    close();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.field, { backgroundColor: theme.surface, borderColor: nameError ? theme.danger : theme.border }]}>
        <Text style={[styles.label, { color: theme.muted }]}>{lang.items.nameLabel}</Text>
        <TextInput
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (nameError && value.trim()) setNameError(false);
          }}
          placeholder={lang.items.namePlaceholder}
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.color }]}
        />
        {nameError && <Text style={[styles.error, { color: theme.danger }]}>{lang.items.nameRequired}</Text>}
      </View>

      <View style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.muted }]}>{lang.items.colorLabel}</Text>
        <View style={styles.colorRow}>
          {itemColors.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={({ pressed }) => [
                styles.colorDot,
                { backgroundColor: c, borderColor: color === c ? theme.primary : theme.border },
                color === c && styles.colorDotActive,
                pressed && styles.selectionPressed,
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
              style={({ pressed }) => [
                styles.iconCell,
                { borderColor: icon === key ? theme.primary : theme.border, backgroundColor: icon === key ? theme.primarySoft : theme.surfaceAlt },
                pressed && styles.selectionPressed,
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
  error: {
    fontSize: 13,
    fontWeight: '600',
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
  selectionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
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
    borderWidth: 2,
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
