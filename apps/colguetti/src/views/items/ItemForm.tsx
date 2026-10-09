import { useState, useMemo, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigator, useToast } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useItems } from '../../items/items-context';
import { ItemIcon, catalogDrawAnimation } from '../../items/icon-catalog';
import { itemColors } from '../../items/items-model';
import { itemIconKeys, type ItemIconKey } from '../../items/item-types';
import { searchIcons } from '../../items/icon-tags';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppTextInput from '../../components/AppTextInput';
import { useRouteIntent } from '../../navigator/RouteIntent';
import AppText from '../../components/AppText';
import DropInTitle from '../../components/DropInTitle';

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
  const [searchQuery, setSearchQuery] = useState('');

  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsTransitioning(false), 150);
    return () => clearTimeout(t);
  }, []);

  const filteredIcons = useMemo(() => {
    if (isTransitioning) return [];
    return searchIcons(searchQuery, itemIconKeys);
  }, [searchQuery, isTransitioning]);

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
      <DropInTitle text={editing ? lang.items.editTitle : lang.items.addTitle} textStyle={{ color: theme.color, fontSize: 32, fontFamily: 'Kranky', marginBottom: 12 }} />
      <AppTextInput
        testID="item-name-input"
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
        shellStyle={{ backgroundColor: theme.primarySoft, borderColor: theme.primary }}
      />

      <AppCard
        variant="soft"
        selected
        title={lang.items.colorLabel}
        style={styles.sectionCard}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorRow}
        >
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
        </ScrollView>
      </AppCard>

      <AppCard
        variant="soft"
        selected
        title={lang.items.iconLabel}
        style={styles.sectionCard}
      >
        <View style={styles.iconGrid}>
          {filteredIcons.length === 0 ? (
            <AppText style={{ color: theme.muted, paddingVertical: 12 }}>No se encontraron íconos</AppText>
          ) : isTransitioning ? (
            <View style={{ height: 100, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <AppText style={{ color: theme.muted, fontSize: 13 }}>Cargando íconos...</AppText>
            </View>
          ) : (
            filteredIcons.map((key, index) => {
              const active = icon === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setIcon(key)}
                  style={({ pressed }) => [
                    styles.iconCell,
                    {
                      borderColor: active ? theme.primary : theme.borderSoft,
                      backgroundColor: active ? theme.primary : theme.surface,
                      borderWidth: active ? 2 : 1.5,
                    },
                    pressed && styles.selectionPressed,
                  ]}
                >
                  <ItemIcon
                    icon={key}
                    color={active ? theme.onPrimary : color}
                    lineWidth={2}
                    style={styles.cellIcon}
                    delay={100 + index * 40}
                    iconAnimation={catalogDrawAnimation}
                  />
                </Pressable>
              );
            })
          )}
        </View>

        <View style={styles.searchWrapper}>
          <AppTextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar ícono..."
            clearable
            maxLength={20}
            shellStyle={{ backgroundColor: theme.primarySoft, borderColor: theme.primary }}
          />
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
    borderRadius: 24,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 4,
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
  searchWrapper: {
    marginTop: 16,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 240,
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

