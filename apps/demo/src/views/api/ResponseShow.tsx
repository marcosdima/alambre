import { ScrollView, StyleSheet } from 'react-native';
import { Text, View } from 'alambre';
import { useLang } from '../../providers/lang';
import { useLightDark } from '../../providers/theme';
import type { KnownApiResponse } from '../../providers/api';

type ResponseShowProps = {
  response?: KnownApiResponse;
};

type RowValue = string | number | boolean | null | undefined;

type ResponseItem = Record<string, RowValue>;

const toItems = (response?: KnownApiResponse): ResponseItem[] => {
  if (!response) return [];
  return response as ResponseItem[];
};


const titleOfItem = (item: ResponseItem, index: number, fallbackLabel: string): string => {
  const nameValue = item.name;
  if (typeof nameValue === 'string' && nameValue.trim()) return nameValue;

  const titleValue = item.title;
  if (typeof titleValue === 'string' && titleValue.trim()) return titleValue;

  const idValue = item.id;
  if (typeof idValue === 'number' || typeof idValue === 'string') return `${fallbackLabel} ${idValue}`;

  return `${fallbackLabel} ${index + 1}`;
};


const valueToText = (value: RowValue): string => {
  if (value === null) return 'null';
  if (value === undefined) return '-';
  return String(value);
};


export default ({ response }: ResponseShowProps) => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const items = toItems(response);

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
        <Text style={[styles.emptyText, { color: theme.muted }]}>{lang.api.pressToLoad}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
      <View style={styles.scrollViewport}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator
        >
          {items.map((item, index) => (
            <View key={`${titleOfItem(item, index, lang.api.fallbackItem)}-${index}`} style={[styles.card, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.color }]}>{titleOfItem(item, index, lang.api.fallbackItem)}</Text>

              {Object.entries(item).map(([key, value]) => (
                <View key={`${key}-${index}`} style={styles.row}>
                  <Text style={[styles.rowKey, { color: theme.muted }]}>{key}</Text>
                  <Text style={[styles.rowValue, { color: theme.color }]}>{valueToText(value)}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        <View
          pointerEvents='none'
          style={[styles.fadeTop, { borderTopColor: theme.border, backgroundColor: theme.surfaceAlt }]}
        />
        <View
          pointerEvents='none'
          style={[styles.fadeBottom, { borderBottomColor: theme.border, backgroundColor: theme.surfaceAlt }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  emptyContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  emptyText: {
    fontSize: 13,
  },
  scroll: {
    minHeight: 120,
    maxHeight: 180,
  },
  scrollViewport: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  scrollContent: {
    gap: 8,
    paddingTop: 10,
    paddingBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 13,
  },
  row: {
    gap: 2,
  },
  rowKey: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rowValue: {
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 1,
  },
  fadeTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 12,
    opacity: 0.55,
    borderTopWidth: 1,
  },
  fadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 14,
    opacity: 0.95,
    borderBottomWidth: 1,
  },
});
