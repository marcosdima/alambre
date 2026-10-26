import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { describe, expect, it } from 'vitest';
import AppBadge from '../../src/ui/components/AppBadge';

describe('AppBadge component', () => {
  describe('numeric content rendering', () => {
    it('wraps numeric children inside a Text element', async () => {
      const { getByText, toJSON } = await render(<AppBadge>{3}</AppBadge>);

      expect(getByText('3')).toBeDefined();
      const tree = toJSON() as any;
      expect(tree.type).toMatch(/View$/);
      expect(tree.children).toHaveLength(1);
      expect(tree.children[0].type).toMatch(/Text$/);
      expect(tree.children[0].children).toEqual(['3']);
    });

    it('wraps numeric label prop inside a Text element', async () => {
      const { getByText, toJSON } = await render(<AppBadge label={42} />);

      expect(getByText('42')).toBeDefined();
      const tree = toJSON() as any;
      expect(tree.type).toMatch(/View$/);
      expect(tree.children).toHaveLength(1);
      expect(tree.children[0].type).toMatch(/Text$/);
      expect(tree.children[0].children).toEqual(['42']);
    });

    it('handles numeric zero correctly for children and label prop', async () => {
      const { getByText: getByTextChildren, toJSON: toJSONChildren } = await render(
        <AppBadge>{0}</AppBadge>,
      );
      expect(getByTextChildren('0')).toBeDefined();
      const treeChildren = toJSONChildren() as any;
      expect(treeChildren.type).toMatch(/View$/);
      expect(treeChildren.children[0].type).toMatch(/Text$/);
      expect(treeChildren.children[0].children).toEqual(['0']);

      const { getByText: getByTextLabel, toJSON: toJSONLabel } = await render(
        <AppBadge label={0} />,
      );
      expect(getByTextLabel('0')).toBeDefined();
      const treeLabel = toJSONLabel() as any;
      expect(treeLabel.type).toMatch(/View$/);
      expect(treeLabel.children[0].type).toMatch(/Text$/);
      expect(treeLabel.children[0].children).toEqual(['0']);
    });

    it('prioritizes label prop over children when both are numbers', async () => {
      const { getByText, queryByText, toJSON } = await render(
        <AppBadge label={99}>{5}</AppBadge>,
      );
      expect(getByText('99')).toBeDefined();
      expect(queryByText('5')).toBeNull();
      const tree = toJSON() as any;
      expect(tree.children[0].type).toMatch(/Text$/);
      expect(tree.children[0].children).toEqual(['99']);
    });

    it('renders negative and float numbers inside a Text element', async () => {
      const { getByText: getByNeg, toJSON: toJSONNeg } = await render(
        <AppBadge>{-7}</AppBadge>,
      );
      expect(getByNeg('-7')).toBeDefined();
      const treeNeg = toJSONNeg() as any;
      expect(treeNeg.children[0].type).toMatch(/Text$/);

      const { getByText: getByFloat, toJSON: toJSONFloat } = await render(
        <AppBadge label={3.14} />,
      );
      expect(getByFloat('3.14')).toBeDefined();
      const treeFloat = toJSONFloat() as any;
      expect(treeFloat.children[0].type).toMatch(/Text$/);
    });
  });

  describe('string and custom ReactNode rendering', () => {
    it('wraps string content in a Text element', async () => {
      const { getByText, toJSON } = await render(<AppBadge label="VIP" />);
      expect(getByText('VIP')).toBeDefined();
      const tree = toJSON() as any;
      expect(tree.children[0].type).toMatch(/Text$/);
    });

    it('renders custom ReactNode children directly without extra Text wrapper', async () => {
      const { getByTestId, toJSON } = await render(
        <AppBadge>
          <View testID="custom-dot" />
        </AppBadge>,
      );
      expect(getByTestId('custom-dot')).toBeDefined();
      const tree = toJSON() as any;
      expect(tree.children[0].props.testID).toBe('custom-dot');
      expect(tree.children[0].type).toMatch(/View$/);
    });

    it('renders icon alongside numeric label in correct structure', async () => {
      const { getByTestId, getByText, toJSON } = await render(
        <AppBadge icon={<View testID="badge-icon" />} label={12} />,
      );
      expect(getByTestId('badge-icon')).toBeDefined();
      expect(getByText('12')).toBeDefined();
      const tree = toJSON() as any;
      expect(tree.children).toHaveLength(2);
      expect(tree.children[0].props.testID).toBe('badge-icon');
      expect(tree.children[1].type).toMatch(/Text$/);
      expect(tree.children[1].children).toEqual(['12']);
    });
  });

  describe('tones, variants and sizes with numeric content', () => {
    it('applies tone styles properly to numeric badge', async () => {
      const { toJSON } = await render(
        <AppBadge tone="success" variant="solid" size="sm">
          {8}
        </AppBadge>,
      );
      const tree = toJSON() as any;
      const rootStyle = StyleSheet.flatten(tree.props.style);
      expect(rootStyle.backgroundColor).toBe('#10b981');
      const textStyle = StyleSheet.flatten(tree.children[0].props.style);
      expect(textStyle.color).toBe('#ffffff');
      expect(textStyle.fontSize).toBe(10);
    });

    it('applies neutral outline tone styles to numeric badge', async () => {
      const { toJSON } = await render(
        <AppBadge tone="neutral" variant="outline" size="md" label={25} />,
      );
      const tree = toJSON() as any;
      const rootStyle = StyleSheet.flatten(tree.props.style);
      expect(rootStyle.backgroundColor).toBe('transparent');
      const textStyle = StyleSheet.flatten(tree.children[0].props.style);
      expect(textStyle.fontSize).toBe(11);
    });
  });

  describe('compound children rendering', () => {
    it('wraps compound children with string and number interpolation inside Text', async () => {
      const { getByText, toJSON } = await render(<AppBadge>Count: {3}</AppBadge>);

      expect(getByText('Count: 3')).toBeDefined();
      const tree = toJSON() as any;
      expect(tree.type).toMatch(/View$/);
      expect(tree.children).toHaveLength(1);
      expect(tree.children[0].type).toMatch(/Text$/);
      expect(tree.children[0].children).toEqual(['Count: ', '3']);
    });

    it('wraps compound children with multiple string parts inside Text', async () => {
      const { getByText, toJSON } = await render(
        <AppBadge>Toggle Flip ({'Back'})</AppBadge>,
      );

      expect(getByText('Toggle Flip (Back)')).toBeDefined();
      const tree = toJSON() as any;
      expect(tree.children[0].type).toMatch(/Text$/);
      expect(tree.children[0].children).toEqual(['Toggle Flip (', 'Back', ')']);
    });
  });
});
