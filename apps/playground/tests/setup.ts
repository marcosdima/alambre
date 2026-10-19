import { vi } from 'vitest';

// Stub __workletsModuleProxy for react-native-worklets 0.10.x in test environment
const dummySerializable: Record<string, unknown> = {};
const dummyProxy: Record<string, unknown> = {
  createSerializableNull: () => dummySerializable,
  createSerializableUndefined: () => dummySerializable,
  createSerializableBoolean: () => dummySerializable,
  createSerializableNumber: () => dummySerializable,
  createSerializableString: () => dummySerializable,
  createSerializableBigInt: () => dummySerializable,
  createSerializableTurboModuleLike: () => dummySerializable,
  createSerializableObject: () => dummySerializable,
  createSerializableHostObject: () => dummySerializable,
  createSerializableArray: () => dummySerializable,
  createSerializableArrayBuffer: () => dummySerializable,
  createSerializableMap: () => dummySerializable,
  createSerializableSet: () => dummySerializable,
  createSerializableError: () => dummySerializable,
  createSerializableRegExp: () => dummySerializable,
  createSerializableArrayBufferView: () => dummySerializable,
  createSerializableInitializer: () => dummySerializable,
  createSerializableNonWorkletFunction: () => dummySerializable,
  createSerializableWorklet: () => dummySerializable,
  createCustomSerializable: () => dummySerializable,
  registerCustomSerializable: () => {},
  createShareable: () => dummySerializable,
  scheduleOnRN: (fn: unknown, args: unknown[]) => {
    if (typeof fn === 'function') {
      fn(...(args ?? []));
    }
  },
  scheduleOnUI: () => {},
  runOnUISync: (fn: unknown) => {
    if (typeof fn === 'function') {
      return fn();
    }
    return undefined;
  },
  createWorkletRuntime: () => ({}),
  scheduleOnRuntime: () => {},
  scheduleOnRuntimeWithId: () => {},
  runOnRuntimeSync: (_runtime: unknown, fn: unknown) => {
    if (typeof fn === 'function') {
      return fn();
    }
    return undefined;
  },
  runOnRuntimeSyncWithId: (_id: unknown, fn: unknown) => {
    if (typeof fn === 'function') {
      return fn();
    }
    return undefined;
  },
  handlePromise: () => {},
  createSynchronizable: (val: unknown) => ({ value: val }),
  synchronizableGetDirty: () => false,
  synchronizableGetBlocking: () => null,
  synchronizableSetBlocking: () => {},
  synchronizableLock: () => {},
  synchronizableUnlock: () => {},
  reportFatalErrorOnJS: () => {},
  getStaticFeatureFlag: () => false,
  setDynamicFeatureFlag: () => {},
  getUIRuntimeHolder: () => ({}),
  getUISchedulerHolder: () => ({}),
  toggleSlowAnimationsOnUIRuntime: () => false,
  loadUnpackers: () => {},
};
(globalThis as unknown as Record<string, unknown>).__workletsModuleProxy = dummyProxy;
(globalThis as unknown as Record<string, unknown>)._WORKLETS_VERSION_CPP = '0.10.1';

// react-native-worklets checks isWorkletFunction(fn) via fn.__workletHash.
// In test environments, Babel worklet compilation is not run on node_modules.
Object.defineProperty(Function.prototype, '__workletHash', {
  value: 123456,
  configurable: true,
  writable: true,
});

vi.mock('expo-clipboard', () => ({
  getStringAsync: vi.fn(async () => ''),
  setStringAsync: vi.fn(async () => true),
}));

vi.mock('expo', () => ({
  registerRootComponent: vi.fn(),
}));

vi.mock('expo-modules-core', () => ({
  requireNativeModule: vi.fn(),
  requireOptionalNativeModule: vi.fn(),
  requireNativeView: vi.fn(),
  EventEmitter: vi.fn(),
  SharedObject: vi.fn(),
  SharedRef: vi.fn(),
  NativeModule: vi.fn(),
  Platform: { OS: 'ios', select: <T>(obj: Record<string, T>) => obj.ios },
  UnavailabilityError: class extends Error {},
}));

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
    cancelAnimation: vi.fn(),
    interpolateColor: (_val: unknown, _inRange: unknown, outRange: string[]) => outRange[0] ?? '#000000',
    withTiming: vi.fn((toValue: unknown) => toValue),
    withSpring: vi.fn((toValue: unknown) => toValue),
    withDecay: vi.fn((config: unknown) => config),
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
    ZoomIn: {
      duration: () => ({
        delay: () => ({ easing: () => ({}) }),
        springify: () => ({ damping: () => ({ stiffness: () => ({}) }) }),
      }),
    },
    ZoomOut: {
      duration: () => ({
        delay: () => ({ easing: () => ({}) }),
      }),
    },
    LinearTransition: {
      springify: () => ({
        damping: () => ({ stiffness: () => ({ mass: () => ({}) }) }),
      }),
    },
  };
});

vi.mock('react-native-gesture-handler', async () => {
  const { View } = await import('react-native');

  const createGestureBuilder = () => {
    const builder: Record<string, unknown> = {
      enabled: () => builder,
      maxDuration: () => builder,
      minPointers: () => builder,
      maxPointers: () => builder,
      shouldCancelWhenOutside: () => builder,
      hitSlop: () => builder,
      activeOffsetX: () => builder,
      activeOffsetY: () => builder,
      failOffsetX: () => builder,
      failOffsetY: () => builder,
      onBegin: () => builder,
      onStart: () => builder,
      onUpdate: () => builder,
      onEnd: () => builder,
      onFinalize: () => builder,
      onTouchesDown: () => builder,
      onTouchesMove: () => builder,
      onTouchesUp: () => builder,
      onTouchesCancelled: () => builder,
    };
    return builder;
  };

  return {
    __esModule: true,
    Gesture: {
      Pan: () => createGestureBuilder(),
      Tap: () => createGestureBuilder(),
      Fling: () => createGestureBuilder(),
      LongPress: () => createGestureBuilder(),
      Pinch: () => createGestureBuilder(),
      Rotation: () => createGestureBuilder(),
      Exclusive: (...gestures: unknown[]) => gestures[0] ?? createGestureBuilder(),
      Simultaneous: (...gestures: unknown[]) => gestures[0] ?? createGestureBuilder(),
      Race: (...gestures: unknown[]) => gestures[0] ?? createGestureBuilder(),
    },
    GestureDetector: ({ children }: { children?: unknown }) => children,
    GestureHandlerRootView: View,
  };
});

