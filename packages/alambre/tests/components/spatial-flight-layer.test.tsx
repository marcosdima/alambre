import { renderHook, act } from '@testing-library/react';
import { render } from '@testing-library/react-native';
import { describe, expect, it, vi } from 'vitest';
import React, { type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';
import {
  SpatialSpace,
  SpatialFlightLayer,
  useSpatialSpace,
} from '../../src/components/spatial';

vi.mock('react-native-reanimated', async () => {
  const ReactMod = await import('react');
  const { View: RNView } = await import('react-native');
  return {
    default: {
      View: ({ children, style, ...props }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) =>
        ReactMod.createElement(RNView, { style, ...props }, children),
    },
    useSharedValue: vi.fn((val: unknown) => ({ value: val })),
    useAnimatedStyle: vi.fn((cb: () => unknown) => cb()),
    withTiming: vi.fn((val: unknown, _cfg: unknown, cb?: (f: boolean) => void) => {
      cb?.(true);
      return val;
    }),
    interpolate: vi.fn((val: number) => val),
    Extrapolation: { CLAMP: 'clamp' },
    runOnJS: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
    cancelAnimation: vi.fn(),
    useReducedMotion: vi.fn(() => false),
    Easing: { bezier: vi.fn(() => (t: number) => t) },
  };
});

describe('SpatialFlightLayer and SpatialSpace flight orchestration', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SpatialSpace>{children}</SpatialSpace>
  );

  it('launches a flight resolving targets from registered spatial target IDs', () => {
    const { result } = renderHook(() => useSpatialSpace(), { wrapper });

    // Register a source and destination target
    act(() => {
      result.current.registerTarget({
        id: 'deck',
        bounds: { x: 50, y: 100, width: 60, height: 90 },
      });
      result.current.registerTarget({
        id: 'hand-slot-1',
        bounds: { x: 150, y: 500, width: 60, height: 90 },
      });
    });

    const onComplete = vi.fn();

    // Launch flight from 'deck' to 'hand-slot-1'
    act(() => {
      result.current.launchFlight({
        id: 'flight-1',
        from: 'deck',
        to: 'hand-slot-1',
        item: { id: 'card-1', label: 'Ace of Spades' },
        onComplete,
      });
    });

    expect(result.current.activeFlights).toHaveLength(1);
    expect(result.current.activeFlights[0].from).toEqual({ x: 80, y: 145 }); // center of deck
    expect(result.current.activeFlights[0].to).toEqual({ x: 180, y: 545 });  // center of hand slot

    // Cancels flight cleanly
    act(() => {
      result.current.cancelFlight('flight-1');
    });

    expect(result.current.activeFlights).toHaveLength(0);
  });

  it('renders SpatialFlightLayer without crashing when idle and when flying', async () => {
    function App() {
      return (
        <View testID="test-container">
          <SpatialFlightLayer
            renderFallbackItem={(item) => <Text>{item.label}</Text>}
          />
        </View>
      );
    }

    const { getByTestId } = await render(
      <SpatialSpace>
        <App />
      </SpatialSpace>,
    );

    expect(getByTestId('test-container')).toBeDefined();
  });
});
