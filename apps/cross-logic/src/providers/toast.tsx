import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ToastComponentProps } from 'alambre';
import { useLightDark } from './theme';

export function TemplateToast({ toast, dismiss }: ToastComponentProps) {
  const { theme } = useLightDark();
  const { data } = toast;

  const raw = data.payload;
  let content = '';
  if (typeof raw === 'string') content = raw;
  else if (raw && typeof raw === 'object' && 'content' in raw && typeof raw.content === 'string') {
    content = raw.content;
  }

  return (
    <View style={styles.root} pointerEvents='box-none'>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
        <Text style={{ color: theme.color, flex: 1 }}>{content}</Text>
        <Pressable onPress={() => dismiss(data.id)} hitSlop={12}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 12,
    width: '100%',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    width: '94%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
