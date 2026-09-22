import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOutUp } from 'react-native-reanimated';
import type { ToastComponentProps } from 'alambre';
import { useNavigator } from 'alambre';
import { useLightDark } from './theme';

export function TemplateToast({ toast, dismiss }: ToastComponentProps) {
  const { theme } = useLightDark();
  const { noPreviousPages } = useNavigator();
  const { data } = toast;

  const raw = data.payload;
  let content = '';
  if (typeof raw === 'string') content = raw;
  else if (raw && typeof raw === 'object' && 'content' in raw && typeof raw.content === 'string') {
    content = raw.content;
  }

  return (
    <View
      style={[styles.root, { top: noPreviousPages ? 12 : 72 }]}
      pointerEvents="box-none"
    >
      <Animated.View
        key={data.id}
        entering={FadeInDown.duration(260).easing(Easing.out(Easing.cubic))}
        exiting={FadeOutUp.duration(220).easing(Easing.in(Easing.cubic))}
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.primary,
          },
        ]}
      >
        <Text style={{ color: theme.color, flex: 1 }}>{content}</Text>
        <Pressable onPress={() => dismiss(data.id)} hitSlop={12}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>✕</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
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
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
