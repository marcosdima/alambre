import { render } from '@testing-library/react-native';
import type { RenderResult } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Arrow from '../../src/components/icons/Arrow';
import Cross from '../../src/components/icons/Cross';
import Tick from '../../src/components/icons/Tick';
import Sun from '../../src/components/icons/Sun';
import Moon from '../../src/components/icons/Moon';
import * as AlambreIcons from '../../src/components/icons';
import {
  clearBoxes,
  expectRotation,
  expectStrokeState,
  linesOf,
  circlesOf,
  svgOf,
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
  return { default: host, Svg: host, Circle: host, Line: host };
});

const icons = [
  { name: 'Arrow', Component: Arrow, drawItDefault: false },
  { name: 'Cross', Component: Cross, drawItDefault: true },
  { name: 'Tick', Component: Tick, drawItDefault: true },
  { name: 'Sun', Component: Sun, drawItDefault: true },
  { name: 'Moon', Component: Moon, drawItDefault: true },
] as const;

const renderIcon = async (element: ReactElement): Promise<RenderResult> => {
  clearBoxes();
  return render(element);
};

describe('concrete icons — common contract', () => {
  beforeEach(clearBoxes);

  for (const { name, Component } of icons) {
    it(`${name} forwards color to every stroke and keeps lineWidth`, async () => {
      const { toJSON } = await renderIcon(
        <Component color="#ff0000" lineWidth={4} />,
      );

      const strokes = [...linesOf(toJSON()), ...circlesOf(toJSON())]
        .filter((host) => 'stroke' in host);
      expect(strokes.length).toBeGreaterThan(0);
      for (const stroke of strokes) {
        expect(stroke.stroke).toBe('#ff0000');
        expect(stroke.strokeWidth).toBe(4);
      }
    });

    it(`${name} applies the rotation to the wrapper view`, async () => {
      const { getByTestId } = await renderIcon(
        <Component testID={`${name}-icon`} color="#ff0000" lineWidth={2} rotation={45} />,
      );

      expectRotation(getByTestId(`${name}-icon`).props.style, 45);
    });

    it(`${name} forwards View props and merges style on the wrapper`, async () => {
      const { getByTestId } = await renderIcon(
        <Component
          testID={`${name}-icon`}
          color="#ff0000"
          lineWidth={2}
          accessibilityLabel="algo"
          style={{ marginTop: 5 }}
        />,
      );

      const wrapper = getByTestId(`${name}-icon`);
      expect(wrapper.props.accessibilityLabel).toBe('algo');
      expect(wrapper.props.style).toEqual([
        { marginTop: 5 },
        { transform: [{ rotate: '0deg' }] },
      ]);
    });
  }

  it('applies the documented default drawIt per icon', async () => {
    for (const { Component, drawItDefault } of icons) {
      await renderIcon(<Component color="#000" lineWidth={2} />);

      const [_, progress] = strokePairs()[0];
      expect(progress.value).toBe(drawItDefault ? 1 : 0);
    }
  });

  it('forwards iconAnimation to the base primitives (all icons)', async () => {
    const drawAnimation = vi.fn((v: number) => v);
    const resetAnimation = vi.fn((v: number) => v);

    await renderIcon(
      <Arrow color="#000" lineWidth={2} iconAnimation={{ drawAnimation, resetAnimation }} />,
    );
    expect(resetAnimation).toHaveBeenCalled();

    for (const { name, Component } of icons) {
      if (name === 'Arrow') continue;
      drawAnimation.mockClear();
      resetAnimation.mockClear();
      await renderIcon(
        <Component color="#000" lineWidth={2} iconAnimation={{ drawAnimation, resetAnimation }} />,
      );
      expect(drawAnimation).toHaveBeenCalled();
    }

    drawAnimation.mockClear();
    await renderIcon(
      <Sun
        color="#000"
        lineWidth={2}
        iconAnimation={{ strokeDasharray: 42, drawAnimation, resetAnimation }}
      />,
    );
    expect(drawAnimation).toHaveBeenCalledWith(expect.closeTo(42 * 0.2, 4));
  });
});

describe('Arrow', () => {
  beforeEach(clearBoxes);

  it('renders three lines in its 200x100 viewBox with the arrow geometry', async () => {
    const { toJSON } = await renderIcon(<Arrow color="#000" lineWidth={2} />);

    expect(svgOf(toJSON())[0].viewBox).toBe('0 0 200 100');

    const lines = linesOf(toJSON());
    expect(lines).toHaveLength(3);
    expect(lines.map((l) => [l.x1, l.y1, l.x2, l.y2])).toEqual([
      [20, 50, 180, 50],
      [130, 0, 180, 50],
      [130, 100, 180, 50],
    ]);
  });

  it('does not draw by default (drawIt defaults to false)', async () => {
    await renderIcon(<Arrow color="#000" lineWidth={2} />);

    const pairs = strokePairs();
    expect(pairs).toHaveLength(3);
    expectStrokeState(pairs[0], 160, 0, false);
    expectStrokeState(pairs[1], Math.hypot(50, 50), 0, false);
    expectStrokeState(pairs[2], Math.hypot(50, 50), 0, false);
  });

  it('draws when drawIt is enabled', async () => {
    await renderIcon(<Arrow color="#000" lineWidth={2} drawIt />);

    expectStrokeState(strokePairs()[0], 160, 0, true);
  });
});

describe('Cross', () => {
  beforeEach(clearBoxes);

  it('renders two crossed lines in the 100x100 viewBox and draws by default', async () => {
    const { toJSON } = await renderIcon(<Cross color="#000" lineWidth={2} />);

    expect(svgOf(toJSON())[0].viewBox).toBe('0 0 100 100');

    const lines = linesOf(toJSON());
    expect(lines).toHaveLength(2);
    expect(lines.map((l) => [l.x1, l.y1, l.x2, l.y2])).toEqual([
      [10, 10, 90, 90],
      [90, 10, 10, 90],
    ]);

    const pairs = strokePairs();
    expect(pairs).toHaveLength(2);
    expectStrokeState(pairs[0], Math.hypot(80, 80), 0, true);
    expectStrokeState(pairs[1], Math.hypot(80, 80), 0, true);
  });
});

describe('Tick', () => {
  beforeEach(clearBoxes);

  it('renders two separated lines and draws by default', async () => {
    const { toJSON } = await renderIcon(<Tick color="#000" lineWidth={2} />);

    const lines = linesOf(toJSON());
    expect(lines).toHaveLength(2);
    expect(lines.map((l) => [l.x1, l.y1, l.x2, l.y2])).toEqual([
      [10, 60, 35, 90],
      [35, 90, 90, 30],
    ]);

    const pairs = strokePairs();
    expect(pairs).toHaveLength(2);
    expectStrokeState(pairs[0], Math.hypot(25, 30), 0, true);
    expectStrokeState(pairs[1], Math.hypot(55, 60), 0, true);
  });
});

describe('Sun', () => {
  beforeEach(clearBoxes);

  it('renders one circle and eight rays with the expected geometry', async () => {
    const { toJSON } = await renderIcon(<Sun color="#000" lineWidth={2} />);

    const circles = circlesOf(toJSON());
    expect(circles).toHaveLength(1);
    expect(circles[0]).toMatchObject({ cx: 50, cy: 50, r: 23, fillOpacity: 1 });

    const rays = linesOf(toJSON());
    expect(rays).toHaveLength(8);
    rays.forEach((ray, i) => {
      expect(ray).toMatchObject({ x1: 0, y1: 50, x2: 50, y2: 50, fillOpacity: 0 });
      expect(ray.transform).toBe(`rotate(${(360 / 8) * i}, 50, 50)`);
    });
  });

  it('draws the circle at 20% and alternates ray offsets (80/85)', async () => {
    await renderIcon(<Sun color="#000" lineWidth={2} />);

    const perimeter = 2 * Math.PI * 23;
    const pairs = strokePairs();
    expect(pairs).toHaveLength(9);

    expectStrokeState(pairs[0], perimeter, 20, true);
    for (let i = 0; i < 8; i += 1) {
      expectStrokeState(pairs[i + 1], 50, i % 2 === 0 ? 80 : 85, true);
    }
  });

  it('forwards the optional fill to the main circle', async () => {
    const { toJSON } = await renderIcon(<Sun color="#000" lineWidth={2} fill="gold" />);

    expect(circlesOf(toJSON())[0].fill).toBe('gold');
  });

  it('leaves fill undefined when not provided', async () => {
    const { toJSON } = await renderIcon(<Sun color="#000" lineWidth={2} />);

    expect(circlesOf(toJSON())[0].fill).toBeUndefined();
  });
});

describe('Moon', () => {
  beforeEach(clearBoxes);

  it('renders six circles with the expected stroke offsets and rotation', async () => {
    const { toJSON } = await renderIcon(<Moon color="#000" lineWidth={2} />);

    const circles = circlesOf(toJSON());
    expect(circles).toHaveLength(6);

    const perimeter = 2 * Math.PI * 35;
    const pairs = strokePairs();
    expect(pairs).toHaveLength(6);

    expectStrokeState(pairs[0], perimeter, 25, true);
    expectStrokeState(pairs[1], perimeter, 80, true);
    expect(circles[1].transform).toBe('rotate(279, 50, 50)');

    const smallPerimeters = [5, 3, 5, 5].map((r) => 2 * Math.PI * r);
    for (let i = 0; i < 4; i += 1) {
      expectStrokeState(pairs[i + 2], smallPerimeters[i], 0, true);
    }
  });

  it('honours fillOpacity states: main drawn, decorations hidden', async () => {
    const { toJSON } = await renderIcon(<Moon color="#000" lineWidth={2} />);

    const circles = circlesOf(toJSON());
    expect(circles[0].fillOpacity).toBe(1);
    expect(circles[1].fillOpacity).toBe(0);
  });

  it('forwards the optional fill to the main circle', async () => {
    const { toJSON } = await renderIcon(<Moon color="#000" lineWidth={2} fill="#ddd" />);

    expect(circlesOf(toJSON())[0].fill).toBe('#ddd');
  });
});

describe('public icon API', () => {
  it('keeps exposing the five concrete icons and both base primitives', () => {
    for (const name of ['Arrow', 'Cross', 'Tick', 'Sun', 'Moon', 'Circle', 'Line']) {
      expect(AlambreIcons).toHaveProperty(name);
    }
  });
});
