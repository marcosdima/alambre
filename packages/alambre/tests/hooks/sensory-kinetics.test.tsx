import { renderHook, act } from '@testing-library/react';
import type { GestureResponderEvent } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchSensoryCue, type SensoryTriggerDispatcher } from '../../src/types/sensory-kinetics';
import { usePressKinetics } from '../../src/hooks/use-press-kinetics';
import { useSpatialFlip } from '../../src/hooks/use-spatial-flip';
import { useWheelPicker } from '../../src/behaviors/wheel/useWheelPicker';
import { useSpatialToss } from '../../src/hooks/use-spatial-toss';

type Reaction = {
  prepare: () => any;
  react: (curr: any, prev: any) => void;
  prev: any;
};

const reactions: Reaction[] = [];

const updateReactions = () => {
  for (const r of reactions) {
    const curr = r.prepare();
    const prev = r.prev;
    r.prev = curr;
    r.react(curr, prev);
  }
};

let capturedPanOnStart: (() => void) | null = null;
let capturedPanOnEnd: ((e: any) => void) | null = null;
let capturedTapOnEnd: ((e: any) => void) | null = null;

vi.mock('react-native-gesture-handler', async () => {
  return {
    Gesture: {
      Pan: () => {
        const pan: any = {
          enabled: () => pan,
          activeOffsetX: () => pan,
          failOffsetY: () => pan,
          activeOffsetY: () => pan,
          failOffsetX: () => pan,
          onStart: (cb: () => void) => {
            capturedPanOnStart = cb;
            return pan;
          },
          onUpdate: () => pan,
          onEnd: (cb: (e: any) => void) => {
            capturedPanOnEnd = cb;
            return pan;
          },
        };
        return pan;
      },
      Tap: () => {
        const tap: any = {
          maxDuration: () => tap,
          onEnd: (cb: (e: any) => void) => {
            capturedTapOnEnd = cb;
            return tap;
          },
        };
        return tap;
      },
      Exclusive: (..._gestures: any[]) => ({}),
    },
  };
});

vi.mock('react-native-reanimated', async () => {
  const ReactActual = await import('react');

  return {
    useReducedMotion: () => false,
    useSharedValue: (initial: any) => {
      const ref = ReactActual.useRef({ value: initial });
      return ref.current;
    },
    useAnimatedStyle: (cb: () => unknown) => cb(),
    useAnimatedReaction: (prepare: () => any, react: (curr: any, prev: any) => void) => {
      const r: Reaction = { prepare, react, prev: prepare() };
      reactions.push(r);
    },
    withSpring: (toValue: any, _config: any, callback?: (finished: boolean) => void) => {
      callback?.(true);
      return toValue;
    },
    withTiming: (toValue: any, _config: any, callback?: (finished: boolean) => void) => {
      callback?.(true);
      return toValue;
    },
    cancelAnimation: vi.fn(),
    interpolate: vi.fn((val: number) => val),
    Extrapolation: { CLAMP: 'clamp' },
    Easing: {
      bezier: vi.fn(),
      out: vi.fn((fn: any) => fn),
      in: vi.fn((fn: any) => fn),
      linear: vi.fn(),
    },
    runOnJS: (fn: (...args: any[]) => any) => fn,
  };
});

interface MockSensoryStore {
  trigger: ReturnType<typeof vi.fn> & ((cue: any, payload?: any) => boolean | void);
}

describe('Sensory Kinetics test suite', () => {
  const createMockStore = (): MockSensoryStore => ({
    trigger: vi.fn() as any,
  });

  const mockEvent = {} as GestureResponderEvent;

  beforeEach(() => {
    vi.clearAllMocks();
    reactions.length = 0;
    capturedPanOnStart = null;
    capturedPanOnEnd = null;
    capturedTapOnEnd = null;
  });

  describe('dispatchSensoryCue primitive', () => {
    it('safely ignores null or undefined input', () => {
      const store = createMockStore();
      expect(() => dispatchSensoryCue(null, store)).not.toThrow();
      expect(() => dispatchSensoryCue(undefined, store)).not.toThrow();
      expect(store.trigger).not.toHaveBeenCalled();
    });

    it('executes direct callback input and safely swallows driver errors', () => {
      const callback = vi.fn();
      dispatchSensoryCue(callback);
      expect(callback).toHaveBeenCalledTimes(1);

      const throwingCallback = vi.fn(() => {
        throw new Error('Haptic driver unavailable');
      });
      expect(() => dispatchSensoryCue(throwingCallback)).not.toThrow();
    });

    it('dispatches string cue identifier to store', () => {
      const store = createMockStore();
      dispatchSensoryCue('button_tap', store);
      expect(store.trigger).toHaveBeenCalledWith('button_tap');
    });

    it('dispatches structured cue input with sensory payload to store', () => {
      const store = createMockStore();
      dispatchSensoryCue(
        {
          cue: 'impact_heavy',
          payload: { intensity: 0.85, volume: 0.9 },
        },
        store,
      );
      expect(store.trigger).toHaveBeenCalledWith('impact_heavy', {
        intensity: 0.85,
        volume: 0.9,
      });
    });

    it('gracefully handles missing store without throwing', () => {
      expect(() => dispatchSensoryCue('any_cue', null)).not.toThrow();
      expect(() =>
        dispatchSensoryCue({ cue: 'any_cue', payload: { intensity: 0.5 } }, undefined),
      ).not.toThrow();
    });
  });

  describe('usePressKinetics sensory integration', () => {
    it('triggers sensory cues on pressIn and pressOut', () => {
      const store = createMockStore();
      const fnCue = vi.fn();

      const { result } = renderHook(() =>
        usePressKinetics({
          sensory: {
            store,
            onPressIn: 'press_down',
            onPressOut: { cue: 'press_up', payload: { intensity: 0.6 } },
          },
        }),
      );

      act(() => {
        result.current.pressProps.onPressIn(mockEvent);
      });
      expect(store.trigger).toHaveBeenCalledWith('press_down');

      act(() => {
        result.current.pressProps.onPressOut(mockEvent);
      });
      expect(store.trigger).toHaveBeenCalledWith('press_up', { intensity: 0.6 });
    });

    it('supports direct function callbacks in press sensory config', () => {
      const fnIn = vi.fn();
      const fnOut = vi.fn();

      const { result } = renderHook(() =>
        usePressKinetics({
          sensory: {
            onPressIn: fnIn,
            onPressOut: fnOut,
          },
        }),
      );

      act(() => {
        result.current.pressProps.onPressIn(mockEvent);
      });
      expect(fnIn).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.pressProps.onPressOut(mockEvent);
      });
      expect(fnOut).toHaveBeenCalledTimes(1);
    });

    it('suppresses sensory cues when interaction is disabled', () => {
      const store = createMockStore();
      const { result } = renderHook(() =>
        usePressKinetics({
          disabled: true,
          sensory: {
            store,
            onPressIn: 'press_down',
            onPressOut: 'press_up',
          },
        }),
      );

      act(() => {
        result.current.pressProps.onPressIn(mockEvent);
        result.current.pressProps.onPressOut(mockEvent);
      });

      expect(store.trigger).not.toHaveBeenCalled();
    });
  });

  describe('useSpatialFlip sensory integration', () => {
    it('triggers onFlipMidpoint when crossing the 0.5 progress threshold', () => {
      const store = createMockStore();
      const { result } = renderHook(() =>
        useSpatialFlip({
          sensory: {
            store,
            onFlipMidpoint: 'flip_tick',
            onLand: 'card_land',
          },
        }),
      );

      // Start at 0
      expect(result.current.progress.value).toBe(0);

      // Advance past 0.5
      act(() => {
        result.current.progress.value = 0.55;
        updateReactions();
      });

      expect(store.trigger).toHaveBeenCalledWith('flip_tick');
    });

    it('triggers onLand when flip action completes', () => {
      const store = createMockStore();
      const { result } = renderHook(() =>
        useSpatialFlip({
          sensory: {
            store,
            onFlipMidpoint: 'flip_tick',
            onLand: { cue: 'card_land', payload: { volume: 0.95 } },
          },
        }),
      );

      act(() => {
        result.current.flip();
      });

      expect(store.trigger).toHaveBeenCalledWith('card_land', { volume: 0.95 });
    });
  });

  describe('useWheelPicker sensory integration', () => {
    it('triggers onTick when scrolling past discrete item boundaries', () => {
      const store = createMockStore();
      const { result } = renderHook(() =>
        useWheelPicker({
          itemCount: 10,
          selected: 0,
          rowHeight: 40,
          onSelect: vi.fn(),
          sensory: {
            store,
            onTick: 'wheel_tick',
            onLand: 'wheel_settle',
          },
        }),
      );

      // Initial position
      updateReactions();

      // Scroll to next item (round changes from 20 to 21)
      act(() => {
        result.current.currentPosition.value = result.current.currentPosition.value + 1.2;
        updateReactions();
      });

      expect(store.trigger).toHaveBeenCalledWith('wheel_tick');
    });

    it('triggers onLand (or fallback onPressOut) upon pan gesture settling', () => {
      const store = createMockStore();
      renderHook(() =>
        useWheelPicker({
          itemCount: 5,
          selected: 0,
          rowHeight: 50,
          onSelect: vi.fn(),
          sensory: {
            store,
            onLand: 'wheel_settle',
          },
        }),
      );

      expect(capturedPanOnEnd).toBeDefined();

      act(() => {
        capturedPanOnEnd!({ velocityY: 100, velocityX: 0 });
      });

      expect(store.trigger).toHaveBeenCalledWith('wheel_settle');
    });

    it('triggers onLand upon tap gesture settling', () => {
      const store = createMockStore();
      renderHook(() =>
        useWheelPicker({
          itemCount: 5,
          selected: 1,
          rowHeight: 50,
          onSelect: vi.fn(),
          sensory: {
            store,
            onLand: 'wheel_settle',
          },
        }),
      );

      expect(capturedTapOnEnd).toBeDefined();

      // Tap on top item (pos < rowHeight => 20 < 50)
      act(() => {
        capturedTapOnEnd!({ y: 20, x: 0 });
      });

      expect(store.trigger).toHaveBeenCalledWith('wheel_settle');
    });

    it('supports onDragStart and onDragEnd callbacks during pan gesture lifecycle', () => {
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();

      renderHook(() =>
        useWheelPicker({
          itemCount: 5,
          selected: 0,
          rowHeight: 40,
          onSelect: vi.fn(),
          onDragStart,
          onDragEnd,
        }),
      );

      expect(capturedPanOnStart).toBeDefined();
      expect(capturedPanOnEnd).toBeDefined();

      act(() => {
        capturedPanOnStart!();
      });
      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDragEnd).not.toHaveBeenCalled();

      act(() => {
        capturedPanOnEnd!({ velocityY: 0, velocityX: 0 });
      });
      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it('supports onDragStart and onDragEnd in horizontal mode', () => {
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();

      renderHook(() =>
        useWheelPicker({
          itemCount: 5,
          selected: 0,
          rowHeight: 40,
          horizontal: true,
          onSelect: vi.fn(),
          onDragStart,
          onDragEnd,
        }),
      );

      act(() => {
        capturedPanOnStart!();
      });
      expect(onDragStart).toHaveBeenCalledTimes(1);

      act(() => {
        capturedPanOnEnd!({ velocityX: 100, velocityY: 0 });
      });
      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });
    it('does not trigger spurious ticks during recentering when position resets', () => {
      const store = createMockStore();
      const onSelect = vi.fn();

      const { result } = renderHook(() =>
        useWheelPicker({
          itemCount: 5,
          selected: 0,
          rowHeight: 40,
          onSelect,
          sensory: {
            store,
            onTick: 'wheel_tick',
            onLand: 'wheel_settle',
          },
        }),
      );

      const currentPos = result.current.currentPosition;
      let internalVal = currentPos.value;

      Object.defineProperty(currentPos, 'value', {
        get: () => internalVal,
        set: (newVal: number) => {
          internalVal = newVal;
          updateReactions();
        },
        configurable: true,
      });

      // 1. Normal discrete step (moving 1 item from 10 to 11) triggers a valid tick
      act(() => {
        currentPos.value = 11;
      });
      expect(store.trigger).toHaveBeenCalledWith('wheel_tick');
      store.trigger.mockClear();

      // 2. Step with recentering active suppresses the tick even when diff is <= 1
      const wheelReaction = reactions.find(
        (r) => typeof r.prepare() === 'object' && 'recentering' in r.prepare(),
      );
      expect(wheelReaction).toBeDefined();

      act(() => {
        wheelReaction!.react(
          { pos: 10, recentering: true },
          { pos: 11, recentering: false },
        );
      });
      expect(store.trigger).not.toHaveBeenCalled();

      // 3. Pan gesture settling invokes settle cue and onSelect
      act(() => {
        capturedPanOnEnd!({ velocityY: -7000, velocityX: 0 });
      });
      expect(store.trigger).toHaveBeenCalledWith('wheel_settle');
      expect(onSelect).toHaveBeenCalledWith(0);
    });
  });

  describe('useSpatialToss sensory integration', () => {
    const homeSlot = { x: 50, y: 100 };
    const dropZones = [
      {
        id: 'zone-1',
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        accepts: () => true,
      },
    ];

    it('triggers onToss on release and onLand when choreography settles', () => {
      const store = createMockStore();

      const { result } = renderHook(() =>
        useSpatialToss({
          item: { id: 'card-1' },
          homeSlot,
          dropZones,
          sensory: {
            store,
            onToss: 'card_release',
            onLand: { cue: 'card_settle', payload: { intensity: 0.8 } },
          },
        }),
      );

      act(() => {
        result.current.releaseToss({ x: 60, y: 120 }, { vx: 20, vy: 40 });
      });

      expect(store.trigger).toHaveBeenCalledWith('card_release');
      expect(store.trigger).toHaveBeenCalledWith('card_settle', { intensity: 0.8 });
    });
  });
});
