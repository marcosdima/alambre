import type { GestureResponderEvent } from 'react-native';
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

export default function AppButton({
  style,
  children,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const { theme } = useLightDark();
  const progress = useSharedValue(0);

  const pressTo = (pressed: boolean) => {
    progress.value = withTiming(pressed ? 1 : 0, { duration: 120 });
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    pressTo(true);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    pressTo(false);
    onPressOut?.(event);
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
    <Button
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      {({ pressed, disabled, loading }) => (
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
      )}
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
