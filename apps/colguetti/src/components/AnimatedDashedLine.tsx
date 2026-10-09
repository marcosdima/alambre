import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import type { ColorValue } from 'react-native';

interface Props {
  color: ColorValue;
  delay?: number;
  width?: number; // total possible width, defaults to 1000 for full screen+
}

export default function AnimatedDashedLine({ color, delay = 0, width = 1000 }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={{ width: '100%', height: 2, overflow: 'hidden' }}>
      <Animated.View style={[{ height: 2, overflow: 'hidden' }, style]}>
        <Svg width={width} height="2">
          <Line
            x1="0"
            y1="1"
            x2={width.toString()}
            y2="1"
            stroke={color}
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
