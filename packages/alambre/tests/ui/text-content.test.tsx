import { render } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { describe, expect, it } from 'vitest';
import AppBadge from '../../src/ui/components/AppBadge';
import AppButton from '../../src/ui/components/AppButton';
import { isTextContent } from '../../src/ui/utils/text';

/**
 * Traverses a rendered JSON tree and asserts that no raw string or number
 * primitives are direct children of any View element (which triggers React
 * Native's "Text strings must be rendered within a <Text> component" error).
 */
function assertNoRawStringsInViews(node: any) {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (typeof node.type === 'string' && (node.type.endsWith('View') || node.type === 'RCTView')) {
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (typeof child === 'string' || typeof child === 'number') {
          throw new Error(
            `Found raw text/number child "${child}" directly inside View element (${node.type})`,
          );
        }
      }
    }
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      assertNoRawStringsInViews(child);
    }
  }
}

describe('isTextContent utility', () => {
  describe('primitives', () => {
    it('returns true for string literals', () => {
      expect(isTextContent('hello')).toBe(true);
      expect(isTextContent('')).toBe(true);
      expect(isTextContent(' ')).toBe(true);
      expect(isTextContent('123')).toBe(true);
    });

    it('returns true for numbers (positive, negative, 0, float)', () => {
      expect(isTextContent(0)).toBe(true);
      expect(isTextContent(42)).toBe(true);
      expect(isTextContent(-7)).toBe(true);
      expect(isTextContent(3.14159)).toBe(true);
      expect(isTextContent(Number.NaN)).toBe(true);
    });

    it('returns false for null and undefined', () => {
      expect(isTextContent(null)).toBe(false);
      expect(isTextContent(undefined)).toBe(false);
    });

    it('returns false for booleans', () => {
      expect(isTextContent(true)).toBe(false);
      expect(isTextContent(false)).toBe(false);
    });

    it('returns false for React elements', () => {
      expect(isTextContent(<View />)).toBe(false);
      expect(isTextContent(<Text>Test</Text>)).toBe(false);
      expect(isTextContent(<View testID="element" />)).toBe(false);
    });
  });

  describe('arrays', () => {
    it('returns true for arrays containing string literals', () => {
      expect(isTextContent(['Toggle (', 'Back', ')'])).toBe(true);
      expect(isTextContent(['simple'])).toBe(true);
      expect(isTextContent(['first', 'second'])).toBe(true);
    });

    it('returns true for arrays containing numbers', () => {
      expect(isTextContent([0])).toBe(true);
      expect(isTextContent([1, 2, 3])).toBe(true);
      expect(isTextContent([-5, 10])).toBe(true);
    });

    it('returns true for mixed text arrays with strings and numbers', () => {
      expect(isTextContent(['Count: ', 5])).toBe(true);
      expect(isTextContent(['Play ', 1])).toBe(true);
      expect(isTextContent(['Items: ', 0, ' remaining'])).toBe(true);
      expect(isTextContent(['Score: ', -10])).toBe(true);
    });

    it('returns true for arrays containing text alongside null, undefined, or booleans', () => {
      expect(isTextContent(['Status: ', null, 'Active'])).toBe(true);
      expect(isTextContent([false, 'Count: ', 0])).toBe(true);
      expect(isTextContent([undefined, 42])).toBe(true);
    });

    it('returns false for arrays containing only React elements', () => {
      expect(isTextContent([<View key="1" />, <View key="2" />])).toBe(false);
      expect(isTextContent([<Text key="1">A</Text>])).toBe(false);
    });

    it('returns false for empty arrays', () => {
      expect(isTextContent([])).toBe(false);
    });

    it('returns false for arrays containing only null, undefined, or booleans', () => {
      expect(isTextContent([null])).toBe(false);
      expect(isTextContent([undefined])).toBe(false);
      expect(isTextContent([false])).toBe(false);
      expect(isTextContent([true])).toBe(false);
      expect(isTextContent([null, undefined, false, true])).toBe(false);
    });
  });
});

describe('AppButton with compound text children', () => {
  it('renders compound children containing array of strings inside a Text component', async () => {
    const { getByText, toJSON } = await render(
      <AppButton>Toggle Flip ({'Back'})</AppButton>,
    );

    expect(getByText('Toggle Flip (Back)')).toBeDefined();

    const tree = toJSON() as any;
    assertNoRawStringsInViews(tree);

    // Button wraps in Pressable (View) -> Animated.View -> Text
    const animatedView = tree.children[0];
    expect(animatedView.type).toMatch(/View$/);
    expect(animatedView.children).toHaveLength(1);

    const textChild = animatedView.children[0];
    expect(textChild.type).toMatch(/Text$/);
    expect(textChild.children).toEqual(['Toggle Flip (', 'Back', ')']);
  });

  it('renders compound children containing strings and numbers inside a Text component', async () => {
    const { getByText, toJSON } = await render(
      <AppButton>Play {1}</AppButton>,
    );

    expect(getByText('Play 1')).toBeDefined();

    const tree = toJSON() as any;
    assertNoRawStringsInViews(tree);

    const animatedView = tree.children[0];
    expect(animatedView.type).toMatch(/View$/);
    expect(animatedView.children).toHaveLength(1);

    const textChild = animatedView.children[0];
    expect(textChild.type).toMatch(/Text$/);
    expect(textChild.children).toEqual(['Play ', '1']);
  });

  it('renders compound children containing zero numeric value', async () => {
    const { getByText, toJSON } = await render(
      <AppButton>Counter: {0}</AppButton>,
    );

    expect(getByText('Counter: 0')).toBeDefined();

    const tree = toJSON() as any;
    assertNoRawStringsInViews(tree);

    const textChild = tree.children[0].children[0];
    expect(textChild.type).toMatch(/Text$/);
    expect(textChild.children).toEqual(['Counter: ', '0']);
  });

  it('renders custom ReactNode children directly without extra Text wrapper', async () => {
    const { getByTestId, toJSON } = await render(
      <AppButton>
        <View testID="custom-button-child" />
      </AppButton>,
    );

    expect(getByTestId('custom-button-child')).toBeDefined();

    const tree = toJSON() as any;
    const animatedView = tree.children[0];
    expect(animatedView.children).toHaveLength(1);
    expect(animatedView.children[0].props.testID).toBe('custom-button-child');
    expect(animatedView.children[0].type).toMatch(/View$/);
  });
});

describe('AppBadge with compound text children', () => {
  it('renders compound children containing array of strings and numbers inside a Text component', async () => {
    const { getByText, toJSON } = await render(
      <AppBadge>Count: {3}</AppBadge>,
    );

    expect(getByText('Count: 3')).toBeDefined();

    const tree = toJSON() as any;
    assertNoRawStringsInViews(tree);

    expect(tree.type).toMatch(/View$/);
    expect(tree.children).toHaveLength(1);

    const textChild = tree.children[0];
    expect(textChild.type).toMatch(/Text$/);
    expect(textChild.children).toEqual(['Count: ', '3']);
  });

  it('renders compound children with multiple string interpolations inside a Text component', async () => {
    const { getByText, toJSON } = await render(
      <AppBadge>Status: ({'Active'})</AppBadge>,
    );

    expect(getByText('Status: (Active)')).toBeDefined();

    const tree = toJSON() as any;
    assertNoRawStringsInViews(tree);

    const textChild = tree.children[0];
    expect(textChild.type).toMatch(/Text$/);
    expect(textChild.children).toEqual(['Status: (', 'Active', ')']);
  });

  it('renders compound text children alongside an icon', async () => {
    const { getByTestId, getByText, toJSON } = await render(
      <AppBadge icon={<View testID="badge-custom-icon" />}>
        Level {1} - Max {10}
      </AppBadge>,
    );

    expect(getByTestId('badge-custom-icon')).toBeDefined();
    expect(getByText('Level 1 - Max 10')).toBeDefined();

    const tree = toJSON() as any;
    assertNoRawStringsInViews(tree);

    expect(tree.children).toHaveLength(2);
    expect(tree.children[0].props.testID).toBe('badge-custom-icon');

    const textChild = tree.children[1];
    expect(textChild.type).toMatch(/Text$/);
    expect(textChild.children).toEqual(['Level ', '1', ' - Max ', '10']);
  });

  it('handles compound children with numeric zero', async () => {
    const { getByText, toJSON } = await render(
      <AppBadge>Items: {0}</AppBadge>,
    );

    expect(getByText('Items: 0')).toBeDefined();

    const tree = toJSON() as any;
    assertNoRawStringsInViews(tree);

    const textChild = tree.children[0];
    expect(textChild.type).toMatch(/Text$/);
    expect(textChild.children).toEqual(['Items: ', '0']);
  });
});
