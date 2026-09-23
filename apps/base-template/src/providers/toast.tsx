import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ToastComponentProps } from 'alambre';
import { useNavigator } from 'alambre';
import { useLightDark } from './theme';

export function TemplateToast({ toast, dismiss }: ToastComponentProps) {
  const { theme } = useLightDark();
  const { noPreviousPages } = useNavigator();
  const insets = useSafeAreaInsets();
  const { data } = toast;

  const raw = data.payload;
  let content = '';
  if (typeof raw === 'string') content = raw;
  else if (raw && typeof raw === 'object' && 'content' in raw && typeof raw.content === 'string') {
    content = raw.content;
  }

  // Base clearance: ensure toast is never obscured by the status bar area
  const baseTop = Math.max(insets.top, 16);
  // When noPreviousPages is true (Home), there is no header, so sit just below the status bar.
  // When noPreviousPages is false (secondary pages), keep below the 56px navigation header.
  const targetTop = baseTop + (noPreviousPages ? 10 : 66);

  const animatedTop = useSharedValue(targetTop);

  useEffect(() => {
    animatedTop.value = withTiming(targetTop, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetTop, animatedTop]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    top: animatedTop.value,
  }));

  return (
    <Animated.View
      style={[styles.root, animatedContainerStyle]}
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
    </Animated.View>
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
