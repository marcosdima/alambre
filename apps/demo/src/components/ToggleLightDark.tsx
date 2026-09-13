import { useEffect, useState } from 'react';
import type { ColorValue, LayoutChangeEvent } from 'react-native';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { AlambreIcons } from 'alambre';
import type { ComponentProps } from 'react';
import type { View as AlambreView } from 'react-native';

const RADIUS = 13;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Colors = {
  background?: ColorValue;
  border?: ColorValue;
  circle?: ColorValue;
}

type ThemeColors = {
  light?: Colors,
  dark?: Colors,
}

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
      background: safe(light.background, '#fff'),
      border: safe(light.border, '#222'),
      circle: safe(light.circle, '#222'),
    },
    dark: {
      background: safe(dark.background, '#222'),
      border: safe(dark.border, '#fff'),
      circle: safe(dark.circle, '#fff'),
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
  // Default colors.
  const { light, dark } = getColorConfig(colors);

  // Hooks.
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [side, setSide] = useState(setLeft ? 1 : 0);

  // Animation values.
  const cx = useSharedValue(0);
  const r = useSharedValue(0);
  const progress = useSharedValue(setLeft ? 1 : 0);

  useEffect(() => {
    setSide(setLeft ? 0 : 1);
  }, [setLeft]);

  useEffect(() => {
    progress.value = withSpring(side);
    const offset = 73;
    const leftOffset = offset;
    const rightOffset = 300 - offset;
    const { width, height } = size;

    cx.value = withTiming(side === 0 ? leftOffset : rightOffset, { duration: 400 });
    r.value = withTiming((width / height) * RADIUS, { duration: 300 });
  }, [cx, progress, r, side, size]);

  // Set width and circle variables.
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  // On press events.
  const onBegin = () => (r.value = withTiming(r.value * 1.25, { duration: 200 }));
  const onFinalize = () => {
    const change = side === 0 ? 1 : 0;
    setSide(change);
    toggle();
  };

  // Animated props.
  const circleAnimatedProps = useAnimatedProps(() => ({
    cx: cx.value,
    r: r.value,
    fill: interpolateColor(
      progress.value,
      [0, 1],
      [light.circle, dark.circle],
    ),
  }));

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

  const drawAnimation = (v: number) => withTiming(v, { duration: 1700 });

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
        <Svg width="100%" height="100%" viewBox={'0 0 300 100'} style={styles.svg}>
          <AnimatedCircle
            animatedProps={circleAnimatedProps}
            cy={50}
            opacity={0.4}
            fill={setLeft ? light.circle : dark.circle}
          />
        </Svg>
        <View style={styles.row}>
          <AlambreIcons.Sun
            drawIt={side === 0}
            style={styles.icon}
            color={light.border}
            lineWidth={3}
            iconAnimation={{ drawAnimation }}
          />
          <AlambreIcons.Moon
            drawIt={side === 1}
            style={styles.icon}
            color={light.border}
            lineWidth={3}
            iconAnimation={{ drawAnimation }}
          />
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
    borderWidth: 2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  svg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  row: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 1,
  },
  icon: {
    height: '60%',
    aspectRatio: 1,
  },
});
