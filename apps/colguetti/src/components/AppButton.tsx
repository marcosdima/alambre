import { useRef } from 'react';
import type { ButtonProps } from 'alambre';
import { Button } from 'alambre';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useLightDark } from '../providers/theme';

export default function AppButton({ style, children, ...props }: ButtonProps) {
  const { theme } = useLightDark();
  const progress = useSharedValue(0);
  const lastPressed = useRef(false);

  const syncPress = (pressed: boolean) => {
    if (pressed === lastPressed.current) return;
    lastPressed.current = pressed;
    progress.value = withTiming(pressed ? 1 : 0, { duration: 120 });
  };

  const shellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.04 * progress.value }],
    borderColor: interpolateColor(progress.value, [0, 1], [theme.success, theme.primary]),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.surface, theme.surfaceAlt],
    ),
  }));

  return (
    <Button {...props} style={style}>
      {({ pressed, disabled, loading }) => {
        syncPress(pressed);
        return (
          <Animated.View
            style={[
              styles.shell,
              shellStyle,
              (disabled || loading) && styles.muted,
            ]}
          >
            {typeof children === 'function'
              ? children({ pressed, disabled, loading })
              : children}
          </Animated.View>
        );
      }}
    </Button>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  muted: {
    opacity: 0.5,
  },
});
