import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigator, useToast } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useItems } from '../../items/items-context';
import { ItemIcon, catalogDrawAnimation } from '../../items/icon-catalog';
import { itemColors } from '../../items/items-model';
import { itemIconKeys, type ItemIconKey } from '../../items/item-types';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppTextInput from '../../components/AppTextInput';
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
      <AppTextInput
        label={lang.items.nameLabel}
        required
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (nameError && value.trim()) setNameError(false);
        }}
        placeholder={lang.items.namePlaceholder}
        clearable
        errorMessage={nameError ? lang.items.nameRequired : undefined}
      />

      <AppCard
        variant="outlined"
        title={lang.items.colorLabel}
        style={styles.sectionCard}
      >
        <View style={styles.colorRow}>
          {itemColors.map((c) => {
            const active = color === c;
            return (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={({ pressed }) => [
                  styles.colorDot,
                  {
                    backgroundColor: c,
                    borderColor: active ? theme.color : 'transparent',
                    borderWidth: active ? 3 : 1,
                  },
                  active && styles.colorDotActive,
                  pressed && styles.selectionPressed,
                ]}
              />
            );
          })}
        </View>
      </AppCard>

      <AppCard
        variant="outlined"
        title={lang.items.iconLabel}
        style={styles.sectionCard}
      >
        <View style={styles.iconGrid}>
          {itemIconKeys.map((key, index) => {
            const active = icon === key;
            return (
              <Pressable
                key={key}
                onPress={() => setIcon(key)}
                style={({ pressed }) => [
                  styles.iconCell,
                  {
                    borderColor: active ? theme.primary : theme.border,
                    backgroundColor: active ? theme.primarySoft : theme.surfaceAlt,
                    borderWidth: active ? 2 : 1.5,
                  },
                  pressed && styles.selectionPressed,
                ]}
              >
                <ItemIcon
                  icon={key}
                  color={color}
                  lineWidth={2}
                  style={styles.cellIcon}
                  delay={100 + index * 40}
                  iconAnimation={catalogDrawAnimation}
                />
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          variant="outline"
          tone="neutral"
          style={styles.actionBtn}
          label={lang.common.cancel}
          onPress={close}
        />
        <AppButton
          variant="solid"
          tone="primary"
          style={styles.actionBtn}
          label={lang.common.save}
          onPress={save}
        />
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
  sectionCard: {
    borderWidth: 1.5,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 6,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 999,
  },
  colorDotActive: {
    transform: [{ scale: 1.1 }],
  },
  selectionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 6,
  },
  iconCell: {
    width: 48,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cellIcon: {
    width: 28,
    height: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
});

