import {
  createContext,
  useContext,
  useMemo,
  Children,
  isValidElement,
  type ReactNode,
} from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
} from 'react-native-reanimated';

export type StaggerDirection =
  | 'from-bottom'
  | 'from-top'
  | 'from-left'
  | 'from-right'
  | 'fade';

export interface StaggeredContextValue {
  staggerMs: number;
  initialDelay: number;
  duration: number;
  direction: StaggerDirection;
  springify: boolean;
  damping: number;
  stiffness: number;
}

const StaggeredContext = createContext<StaggeredContextValue | null>(null);

export interface StaggeredGroupProps {
  children: ReactNode;
  staggerMs?: number;
  initialDelay?: number;
  duration?: number;
  direction?: StaggerDirection;
  springify?: boolean;
  damping?: number;
  stiffness?: number;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
}

export interface StaggeredItemProps {
  children: ReactNode;
  index?: number;
  staggerMs?: number;
  initialDelay?: number;
  duration?: number;
  direction?: StaggerDirection;
  springify?: boolean;
  damping?: number;
  stiffness?: number;
  style?: StyleProp<ViewStyle>;
}

export function StaggeredItem({
  children,
  index = 0,
  staggerMs: propStaggerMs,
  initialDelay: propInitialDelay,
  duration: propDuration,
  direction: propDirection,
  springify: propSpringify,
  damping: propDamping,
  stiffness: propStiffness,
  style,
}: StaggeredItemProps) {
  const ctx = useContext(StaggeredContext);

  const staggerMs = propStaggerMs ?? ctx?.staggerMs ?? 60;
  const initialDelay = propInitialDelay ?? ctx?.initialDelay ?? 80;
  const duration = propDuration ?? ctx?.duration ?? 320;
  const direction = propDirection ?? ctx?.direction ?? 'from-bottom';
  const springify = propSpringify ?? ctx?.springify ?? true;
  const damping = propDamping ?? ctx?.damping ?? 16;
  const stiffness = propStiffness ?? ctx?.stiffness ?? 160;

  const delay = Math.max(0, initialDelay + index * staggerMs);

  const entering = useMemo(() => {
    let builder;
    switch (direction) {
      case 'from-bottom':
        builder = FadeInDown;
        break;
      case 'from-top':
        builder = FadeInUp;
        break;
      case 'from-left':
        builder = FadeInLeft;
        break;
      case 'from-right':
        builder = FadeInRight;
        break;
      case 'fade':
      default:
        builder = FadeIn;
        break;
    }

    let anim = builder.delay(delay).duration(duration);
    if (springify) {
      anim = anim.springify().damping(damping).stiffness(stiffness);
    }
    return anim;
  }, [direction, delay, duration, springify, damping, stiffness]);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

export default function StaggeredGroup({
  children,
  staggerMs = 60,
  initialDelay = 80,
  duration = 320,
  direction = 'from-bottom',
  springify = true,
  damping = 16,
  stiffness = 160,
  style,
  itemStyle,
}: StaggeredGroupProps) {
  const contextValue = useMemo<StaggeredContextValue>(
    () => ({
      staggerMs,
      initialDelay,
      duration,
      direction,
      springify,
      damping,
      stiffness,
    }),
    [staggerMs, initialDelay, duration, direction, springify, damping, stiffness],
  );

  const childArray = Children.toArray(children).filter(Boolean);

  return (
    <StaggeredContext.Provider value={contextValue}>
      <View style={style}>
        {childArray.map((child, index) => {
          const key = isValidElement(child) && child.key ? child.key : index;
          return (
            <StaggeredItem key={key} index={index} style={itemStyle}>
              {child}
            </StaggeredItem>
          );
        })}
      </View>
    </StaggeredContext.Provider>
  );
}
