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
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useStagger, useWavefront, type WavefrontCurve } from '../..';

export type CascadePattern = 'top-to-bottom' | 'bottom-to-top' | 'alternate' | 'pop';

export type AnimatedCascadeProps = {
  children: ReactNode;
  pattern?: CascadePattern;
  duration?: number;
  staggerMs?: number;
  initialDelay?: number;
  maxDelay?: number;
  distance?: number;
  /**
   * Whether to run in frame-budgeted wavefront orchestrator mode (pure UI thread, 0 layout thrashing).
   * @default true
   */
  orchestrated?: boolean;
  /**
   * Closed-form analytical curve to use in orchestrated mode.
   * @default 'criticallyDamped'
   */
  curve?: WavefrontCurve;
  layoutTransition?: boolean;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
};

function OrchestratedItem({
  child,
  index,
  pattern,
  distance,
  progress,
  getItemProgress,
  itemStyle,
}: {
  child: ReactNode;
  index: number;
  pattern: CascadePattern;
  distance: number;
  progress: SharedValue<number>;
  getItemProgress: (index: number, progressOverride?: number) => number;
  itemStyle?: StyleProp<ViewStyle>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const tau = progress.value;
    const p = getItemProgress(index, tau);
    let transform: ViewStyle['transform'];

    switch (pattern) {
      case 'bottom-to-top':
        transform = [{ translateY: (1 - p) * distance }];
        break;
      case 'alternate':
        transform = [{ translateX: (index % 2 === 0 ? -1 : 1) * (1 - p) * distance }];
        break;
      case 'pop':
        transform = [{ scale: 0.92 + p * 0.08 }];
        break;
      case 'top-to-bottom':
      default:
        transform = [{ translateY: (1 - p) * -distance }];
        break;
    }

    return {
      opacity: p,
      transform,
    };
  });

  return (
    <Animated.View style={[itemStyle, animatedStyle]}>
      {child}
    </Animated.View>
  );
}

export default function AnimatedCascade({
  children,
  pattern = 'top-to-bottom',
  duration = 260,
  staggerMs = 40,
  initialDelay = 0,
  maxDelay = 1500,
  distance = 18,
  orchestrated = true,
  curve = 'criticallyDamped',
  layoutTransition = false,
  style,
  itemStyle,
}: AnimatedCascadeProps) {
  const childArray = Children.toArray(children).filter(isValidElement);

  // Frame-budgeted wavefront orchestration mode (default: 1 master clock, 0 layout thrashing)
  const wavefront = useWavefront({
    count: childArray.length,
    staggerMs,
    itemDuration: duration,
    curve,
    autoStart: true,
  });

  // Classic entering fallback mode if explicitly disabled
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

  if (orchestrated) {
    return (
      <View style={style}>
        {childArray.map((child, index) => {
          const key = (child as any).key ?? `cascade-${index}`;
          return (
            <OrchestratedItem
              key={key}
              child={child}
              index={index}
              pattern={pattern}
              distance={distance}
              progress={wavefront.masterProgress}
              getItemProgress={wavefront.getItemProgress}
              itemStyle={itemStyle}
            />
          );
        })}
      </View>
    );
  }

  return (
    <View style={style}>
      {childArray.map((child, index) => {
        const entering = getEnteringAnimation(index);
        const layout = layoutTransition
          ? LinearTransition.springify().damping(18).stiffness(200)
          : undefined;

        return (
          <Animated.View
            key={(child as any).key ?? `cascade-${index}`}
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

