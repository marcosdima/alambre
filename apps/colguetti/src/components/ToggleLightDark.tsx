import { useEffect, useMemo, useState } from 'react';
import type { ColorValue, LayoutChangeEvent } from 'react-native';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import type { ComponentProps } from 'react';
import type { View as AlambreView } from 'react-native';

const BORDER = 2;

type Colors = {
  background?: ColorValue;
  border?: ColorValue;
  circle?: ColorValue;
  sun?: ColorValue;
  moon?: ColorValue;
};

type ThemeColors = {
  light?: Colors;
  dark?: Colors;
};

type ToggleProps = ComponentProps<typeof AlambreView> & {
  toggle: () => void;
  setLeft?: boolean;
  colors?: ThemeColors;
};

const getColorConfig = (colors?: ThemeColors) => {
  const { light = {}, dark = {} } = colors ?? {};

  const safe = (c: ColorValue | undefined, fallback: string) =>
    typeof c === 'string' ? c : fallback;

  return {
    light: {
      background: safe(light.background, '#e6edf7'),
      border: safe(light.border, '#c9d6ea'),
      circle: safe(light.circle, '#0f7b6c'),
      sun: safe(light.sun, '#f59e0b'),
      moon: safe(light.moon, '#6b7280'),
    },
    dark: {
      background: safe(dark.background, '#1c2a42'),
      border: safe(dark.border, '#2b3d5c'),
      circle: safe(dark.circle, '#3dc8b4'),
      sun: safe(dark.sun, '#ffc266'),
      moon: safe(dark.moon, '#9eb0c8'),
    },
  };
};

export default (
  {
    setLeft = true,
    toggle,
    colors = {},
    ...props
  }: ToggleProps,
) => {
  const { light, dark } = getColorConfig(colors);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [side, setSide] = useState(setLeft ? 0 : 1);

  const progress = useSharedValue(setLeft ? 1 : 0);
  const centerX = useSharedValue(0);
  const radius = useSharedValue(0);

  useEffect(() => {
    setSide(setLeft ? 0 : 1);
  }, [setLeft]);

  const { leftCenter, rightCenter } = useMemo(() => {
    const { width, height } = size;
    if (height <= 0) return { leftCenter: 0, rightCenter: 0 };
    const icon = height * 0.6;
    const pad = (width - 2 * icon) / 3;
    return {
      leftCenter: pad + icon / 2,
      rightCenter: 2 * pad + (3 * icon) / 2,
    };
  }, [size]);

  useEffect(() => {
    progress.value = withSpring(side);
    const target = side === 0 ? leftCenter : rightCenter;
    if (target > 0) {
      centerX.value = withSpring(target);
    }
  }, [progress, side, leftCenter, rightCenter, centerX]);

  useEffect(() => {
    const max = Math.min(size.width, size.height) / 2 - BORDER;
    if (max <= 0) return;
    radius.value = max * 0.85;
  }, [radius, size]);

  const onLayout = (event: LayoutChangeEvent) => {
    const layout = event?.nativeEvent?.layout;
    if (!layout) return;
    setSize({ width: layout.width, height: layout.height });
  };

  const onBegin = () => {
    const max = Math.min(size.width, size.height) / 2 - BORDER;
    if (max <= 0) return;
    radius.value = withTiming(Math.min(radius.value * 1.2, max), { duration: 200 });
  };

  const onFinalize = () => {
    const change = side === 0 ? 1 : 0;
    setSide(change);
    toggle();
    const max = Math.min(size.width, size.height) / 2 - BORDER;
    if (max > 0) radius.value = withTiming(max * 0.85, { duration: 200 });
  };

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [light.background, dark.background],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [light.border, dark.border],
    ),
  }));

  const circleStyle = useAnimatedStyle(() => ({
    width: radius.value * 2,
    height: radius.value * 2,
    borderRadius: radius.value,
    left: centerX.value - radius.value,
    top: size.height / 2 - radius.value,
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [light.circle, dark.circle],
    ),
    opacity: 0.4,
  }));

  const drawAnimation = (v: number) => withTiming(v, { duration: 500 });

  return (
    <Pressable
      onPressIn={onBegin}
      onPressOut={onFinalize}
      {...props}
    >
      <Animated.View
        onLayout={onLayout}
        style={[styles.container, containerStyle]}
      >
        <Animated.View style={[styles.circle, circleStyle]} />
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <AlambreIcons.Sun
              drawIt={side === 0}
              style={styles.icon}
              color={light.sun}
              lineWidth={3}
              iconAnimation={{ drawAnimation }}
            />
          </View>
          <View style={styles.iconWrap}>
            <AlambreIcons.Moon
              drawIt={side === 1}
              style={styles.icon}
              color={light.moon}
              lineWidth={3}
              iconAnimation={{ drawAnimation }}
            />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    borderWidth: BORDER,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    zIndex: 0,
  },
  row: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 1,
  },
  iconWrap: {
    height: '60%',
    aspectRatio: 1,
  },
  icon: {
    height: '100%',
    aspectRatio: 1,
  },
});
