import { vi } from 'vitest';

// react-native-worklets checks isWorkletFunction(fn) via fn.__workletHash.
// In test environments, Babel worklet compilation is not run on node_modules.
Object.defineProperty(Function.prototype, '__workletHash', {
  value: 123456,
  configurable: true,
  writable: true,
});

vi.mock('react-native-worklets', () => ({
  default: {},
  createWorkletRuntime: () => ({}),
  runOnJS: (fn: unknown) => fn,
  runOnUI: (fn: unknown) => fn,
}));

vi.mock('react-native-reanimated', async () => {
  const { View, Text } = await import('react-native');

  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (c: unknown) => c,
      View,
      Text,
    },
    useSharedValue: (val: unknown) => ({ value: val }),
    useAnimatedStyle: (cb: () => unknown) => cb(),
    useAnimatedProps: (cb: () => unknown) => cb(),
    useDerivedValue: (cb: () => unknown) => ({ value: cb() }),
    useAnimatedReaction: () => {},
    runOnJS: (fn: unknown) => fn,
    cancelAnimation: () => {},
    withTiming: (toValue: unknown) => toValue,
    withSpring: (toValue: unknown) => toValue,
    withRepeat: (anim: unknown) => anim,
    withSequence: (...anims: unknown[]) => anims[0],
    withDelay: (_d: unknown, anim: unknown) => anim,
    useReducedMotion: () => false,
    Easing: {
      linear: (x: unknown) => x,
      ease: (x: unknown) => x,
      inOut: (fn: unknown) => fn,
      out: (fn: unknown) => fn,
      quad: (x: unknown) => x,
      cubic: (x: unknown) => x,
      bezier: () => (x: unknown) => x,
    },
    FadeInDown: { duration: () => ({ delay: () => ({ easing: () => ({}) }) }) },
    FadeInLeft: { duration: () => ({ delay: () => ({ easing: () => ({}) }) }) },
    FadeInRight: { duration: () => ({ delay: () => ({ easing: () => ({}) }) }) },
    FadeInUp: { duration: () => ({ delay: () => ({ easing: () => ({}) }) }) },
    ZoomIn: { duration: () => ({ delay: () => ({ easing: () => ({}) }) }) },
    LinearTransition: {
      springify: () => ({
        damping: () => ({ stiffness: () => ({ mass: () => ({}) }) }),
      }),
    },
  };
});

