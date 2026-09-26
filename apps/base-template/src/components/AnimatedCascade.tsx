import type { ReactNode } from 'react';
import { Children, isValidElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  LinearTransition,
  ZoomIn,
} from 'react-native-reanimated';
import { useStagger } from 'alambre';

export type CascadePattern = 'top-to-bottom' | 'bottom-to-top' | 'alternate' | 'pop';

export type AnimatedCascadeProps = {
  children: ReactNode;
  pattern?: CascadePattern;
  duration?: number;
  staggerMs?: number;
  initialDelay?: number;
  maxDelay?: number;
  distance?: number;
  layoutTransition?: boolean;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
};

export default function AnimatedCascade({
  children,
  pattern = 'top-to-bottom',
  duration = 260,
  staggerMs = 50,
  initialDelay = 0,
  maxDelay = 1500,
  layoutTransition = true,
  style,
  itemStyle,
}: AnimatedCascadeProps) {
  const { getDelay, isReducedMotion } = useStagger({
    initialDelay,
    staggerMs,
    maxDelay,
  });

  const getEnteringAnimation = (index: number) => {
    if (isReducedMotion) {
      return undefined;
    }

    const delay = getDelay(index);

    switch (pattern) {
      case 'bottom-to-top':
        return FadeInUp.duration(duration).delay(delay);
      case 'alternate':
        return index % 2 === 0
          ? FadeInLeft.duration(duration).delay(delay)
          : FadeInRight.duration(duration).delay(delay);
      case 'pop':
        return ZoomIn.duration(duration).delay(delay);
      case 'top-to-bottom':
      default:
        return FadeInDown.duration(duration).delay(delay);
    }
  };

  const childArray = Children.toArray(children).filter(isValidElement);

  return (
    <View style={style}>
      {childArray.map((child, index) => {
        const entering = getEnteringAnimation(index);
        const layout = layoutTransition
          ? LinearTransition.springify().damping(18).stiffness(200)
          : undefined;

        return (
          <Animated.View
            key={child.key ?? `cascade-${index}`}
            entering={entering}
            layout={layout}
            style={itemStyle}
          >
            {child}
          </Animated.View>
        );
      })}
    </View>
  );
}
