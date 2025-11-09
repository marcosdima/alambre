import { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  withSpring,
} from 'react-native-reanimated';
import Svg from 'react-native-svg';
import Sun from '../icons/Sun';
import Moon from '../icons/Moon';
import type { DefaultReact } from '@types';
import { AnimatedCircle } from '../icons/utils';

type Colors = {
  backgroundLight?: string;
  backgroundDark?: string;
  borderLight?: string;
  borderDark?: string;
  circleLight?: string;
  circleDark?: string;
}

type ToggleProps = DefaultReact.ViewProps & {
  toggle: () => void;
  setLeft?: boolean;
  colors?: Colors;
};

const LEFT = 0.02;
const RIGHT = 1 - LEFT;
const RADIUS = 0.17;

export default (
  {
    setLeft = true,
    toggle,
    colors = {},
    ...props
  }: ToggleProps,
) => {
  // Default colors.
  const {
    backgroundLight = '#fff',
    backgroundDark = '#222',
    borderLight = '#fff',
    borderDark = '#222',
    circleLight = '#222',
    circleDark = '#fff',
  } = colors;

  // Hooks.
  const [width, setWidth] = useState(0);
  const [side, setSide] = useState(setLeft ? 1 : 0);

  // Animation values.
  const cx = useSharedValue(0);
  const r = useSharedValue(0);
  const progress = useSharedValue(0);

  // Set width and circle variables.
  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    r.value = w * RADIUS;
    cx.value = setLeft ? w * LEFT : w * RIGHT;
  };

  // On press events.
  const onBegin = () => (r.value = withTiming(r.value * 1.25, { duration: 200 }));
  const onFinalize = () => {
    const toLeft = side === 0 ? 1 : 0;
    cx.value = withTiming(toLeft ? width * LEFT : width * RIGHT, { duration: 400 });
    r.value = withTiming(width * RADIUS, { duration: 300 });
    progress.value = withSpring(toLeft);
    setSide(toLeft);
    toggle();
  };

  // Animated props.
  const circleAnimatedProps = useAnimatedProps(() => ({
    cx: cx.value,
    r: r.value,
    fill: interpolateColor(progress.value, [1, 0], [circleLight, circleDark]),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [1, 0], [backgroundLight, backgroundDark]),
    borderColor: interpolateColor(progress.value, [1, 0], [borderDark, borderLight]),
  }));

  return (
    <Pressable
      onPressIn={onBegin}
      onPressOut={onFinalize}
      {...props}
    >
      <Animated.View onLayout={onLayout} style={[styles.container, containerStyle]}>
        {
          width > 0 && (
            <Svg width="100%" height="100%" viewBox={`0 0 ${width} 100`} style={styles.svg}>
              <AnimatedCircle animatedProps={circleAnimatedProps} cy={50} fill="black" opacity={0.4} />
            </Svg>
          )
        }
        <View style={styles.row}>
          <Sun reset={side === 0} style={styles.icon} />
          <Moon reset={side === 1} style={styles.icon} />
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 3,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1,
  },
  icon: {
    height: '60%',
    aspectRatio: 1,
  },
});
