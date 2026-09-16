import { render } from '@testing-library/react-native';
import type { RenderResult } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Circle from '../../src/components/icons/base/Circle';
import Line from '../../src/components/icons/base/Line';
import {
  clearBoxes,
  expectStrokeState,
  linesOf,
  circlesOf,
  strokePairs,
} from '../helpers/icons-helpers';

vi.mock('react-native-reanimated', () => {
  const key = '__alambreIconSharedValues__';
  return {
    default: {
      createAnimatedComponent: (Component: unknown) => Component,
    },
    useSharedValue: (value: number) => {
      const box = { value };
      const g = globalThis as unknown as Record<string, { value: number }[]>;
      if (!g[key]) g[key] = [];
      g[key].push(box);
      return box;
    },
    withTiming: (toValue: number) => toValue,
    useAnimatedProps: (factory: () => unknown) => factory(),
  };
});

vi.mock('react-native-svg', async () => {
  const React = await import('react');
  const { View } = await import('react-native');
  const host = (props: Record<string, unknown>) => React.createElement(View, props);
  return { default: host, Svg: host, Circle: host, Line: host, Path: host };
});

const line = { x1: 0, y1: 0, x2: 3, y2: 4, stroke: '#fff', strokeWidth: 2 };
const circle = { cx: 0, cy: 0, r: 5, stroke: '#fff', strokeWidth: 2 };

const renderPrimitive = async (
  element: ReactElement,
): Promise<RenderResult> => {
  clearBoxes();
  return render(element);
};

describe('base Line', () => {
  beforeEach(clearBoxes);

  it('computes strokeDasharray from its geometry', async () => {
    await renderPrimitive(<Line line={line} drawIt={false} />);

    expectStrokeState(strokePairs()[0], 5, 0, false);
  });

  it('passes stroke, strokeWidth and coordinates to the host', async () => {
    const { toJSON } = await renderPrimitive(<Line line={line} drawIt={false} />);

    const hosts = linesOf(toJSON());
    expect(hosts).toHaveLength(1);
    expect(hosts[0]).toMatchObject({
      x1: 0,
      y1: 0,
      x2: 3,
      y2: 4,
      stroke: '#fff',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    });
  });

  it('draws at the given strokeOffset when drawIt is true', async () => {
    await renderPrimitive(<Line line={line} drawIt strokeOffset={25} />);

    expectStrokeState(strokePairs()[0], 5, 25, true);
  });

  it('resets when drawIt is false', async () => {
    await renderPrimitive(<Line line={line} drawIt={false} strokeOffset={25} />);

    expectStrokeState(strokePairs()[0], 5, 25, false);
  });

  it('toggles between draw and reset on re-render', async () => {
    const { rerender } = await renderPrimitive(
      <Line line={line} drawIt={false} />,
    );

    await rerender(<Line line={line} drawIt strokeOffset={25} />);
    expectStrokeState(strokePairs().at(-1) as ReturnType<typeof strokePairs>[number], 5, 25, true);

    await rerender(<Line line={line} drawIt={false} />);
    expectStrokeState(strokePairs().at(-1) as ReturnType<typeof strokePairs>[number], 5, 0, false);
  });

  it('applies the rotation as an SVG transform around the end point', async () => {
    const { toJSON } = await renderPrimitive(
      <Line line={line} drawIt={false} rotation={45} />,
    );

    expect(linesOf(toJSON())[0].transform).toBe('rotate(45, 3, 4)');
  });

  it('honours an iconAnimation strokeDasharray override', async () => {
    await renderPrimitive(
      <Line line={line} drawIt={false} iconAnimation={{ strokeDasharray: 42 }} />,
    );

    expect(strokePairs()[0][0].value).toBe(42);
  });

  it('drives draw/reset through the iconAnimation animations', async () => {
    const drawAnimation = vi.fn((v: number) => v);
    const resetAnimation = vi.fn((v: number) => v);

    const { rerender } = await renderPrimitive(
      <Line line={line} drawIt iconAnimation={{ drawAnimation, resetAnimation }} />,
    );
    expect(drawAnimation).toHaveBeenCalledWith(0);

    await rerender(
      <Line
        line={line}
        drawIt={false}
        iconAnimation={{ drawAnimation, resetAnimation }}
      />,
    );
    expect(resetAnimation).toHaveBeenCalledWith(5);
  });
});

describe('base Circle', () => {
  beforeEach(clearBoxes);

  it('computes strokeDasharray from the perimeter', async () => {
    await renderPrimitive(<Circle circle={circle} drawIt={false} />);

    expectStrokeState(strokePairs()[0], 2 * Math.PI * 5, 0, false);
  });

  it('passes cx, cy, r, stroke and strokeWidth to the host', async () => {
    const { toJSON } = await renderPrimitive(<Circle circle={circle} drawIt={false} />);

    const hosts = circlesOf(toJSON());
    expect(hosts).toHaveLength(1);
    expect(hosts[0]).toMatchObject({
      cx: 0,
      cy: 0,
      r: 5,
      stroke: '#fff',
      strokeWidth: 2,
    });
  });

  it('draws at the given strokeOffset when drawIt is true', async () => {
    await renderPrimitive(<Circle circle={circle} drawIt strokeOffset={50} />);

    expectStrokeState(strokePairs()[0], 2 * Math.PI * 5, 50, true);
  });

  it('resets when drawIt is false', async () => {
    await renderPrimitive(<Circle circle={circle} drawIt={false} strokeOffset={50} />);

    expectStrokeState(strokePairs()[0], 2 * Math.PI * 5, 50, false);
  });

  it('applies the rotation as an SVG transform around the center', async () => {
    const { toJSON } = await renderPrimitive(
      <Circle circle={circle} drawIt={false} rotation={30} />,
    );

    expect(circlesOf(toJSON())[0].transform).toBe('rotate(30, 0, 0)');
  });

  it('honours an iconAnimation strokeDasharray override', async () => {
    await renderPrimitive(
      <Circle circle={circle} drawIt={false} iconAnimation={{ strokeDasharray: 7 }} />,
    );

    expect(strokePairs()[0][0].value).toBe(7);
  });

  it('drives draw/reset through the iconAnimation animations', async () => {
    const drawAnimation = vi.fn((v: number) => v);
    const resetAnimation = vi.fn((v: number) => v);

    await renderPrimitive(
      <Circle
        circle={circle}
        drawIt
        strokeOffset={20}
        iconAnimation={{ drawAnimation, resetAnimation }}
      />,
    );

    expect(drawAnimation).toHaveBeenCalledWith((2 * Math.PI * 5) * 0.2);
  });
});
