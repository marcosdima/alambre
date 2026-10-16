import { describe, expect, it } from 'vitest';
import {
  parabolicAltitudeCurve,
  calculateHandFan,
  calculateCarouselTransform,
  calculateSwipeTilt,
} from '../../src/core/spatial';
import { kinetics } from '../../src/core/kinetics';

describe('spatial kinetics primitives', () => {
  describe('parabolicAltitudeCurve', () => {
    it('returns exact boundary values at progress 0, 0.5, and 1', () => {
      expect(parabolicAltitudeCurve(0)).toBe(0);
      expect(parabolicAltitudeCurve(0.5)).toBe(1);
      expect(parabolicAltitudeCurve(1)).toBe(0);
    });

    it('clamps progress below 0 and above 1', () => {
      expect(parabolicAltitudeCurve(-0.5)).toBe(0);
      expect(parabolicAltitudeCurve(1.5)).toBe(0);
    });

    it('is symmetric around midpoint 0.5', () => {
      const p1 = parabolicAltitudeCurve(0.2);
      const p2 = parabolicAltitudeCurve(0.8);
      expect(p1).toBeCloseTo(p2, 5);
      expect(p1).toBeCloseTo(4 * 0.2 * 0.8, 5);
    });

    it('is accessible via kinetics.spatial token namespace', () => {
      expect(kinetics.spatial.parabolicAltitude).toBe(parabolicAltitudeCurve);
      expect(kinetics.spatial.calculateHandFan).toBe(calculateHandFan);
      expect(kinetics.spatial.calculateCarouselTransform).toBe(calculateCarouselTransform);
      expect(kinetics.spatial.calculateSwipeTilt).toBe(calculateSwipeTilt);
    });
  });

  describe('calculateHandFan', () => {
    it('handles empty hand (total <= 0) safely without throwing', () => {
      const res = calculateHandFan(0, 0);
      expect(res).toEqual({
        translateX: 0,
        translateY: 0,
        rotateDeg: 0,
        scale: 1,
        zIndex: 0,
      });
    });

    it('centers single item (total = 1) at origin with zero tilt', () => {
      const res = calculateHandFan(0, 1);
      expect(res.translateX).toBe(0);
      expect(res.translateY).toBe(0);
      expect(res.rotateDeg).toBe(0);
      expect(res.scale).toBe(1);
      expect(res.zIndex).toBe(1);
    });

    it('produces symmetric layout for odd number of cards (total = 5)', () => {
      const total = 5;
      const left = calculateHandFan(0, total);
      const mid = calculateHandFan(2, total);
      const right = calculateHandFan(4, total);

      // Mid card is centered
      expect(mid.translateX).toBe(0);
      expect(mid.translateY).toBe(0);
      expect(mid.rotateDeg).toBe(0);

      // Left and right are mirrored
      expect(left.translateX).toBe(-right.translateX);
      expect(left.rotateDeg).toBe(-right.rotateDeg);
      expect(left.translateY).toBe(right.translateY);
      expect(left.translateY).toBeGreaterThan(0); // Arc curvature drops edges
    });

    it('auto-compresses spacing when total items exceed maxSpan', () => {
      const cardSpacing = 40;
      const maxSpan = 120; // Allows at most 120 / (5 - 1) = 30 spacing for 5 cards
      const uncompressed = calculateHandFan(4, 5, { itemSpacing: cardSpacing, maxSpan: 500 });
      const compressed = calculateHandFan(4, 5, { itemSpacing: cardSpacing, maxSpan });

      expect(uncompressed.translateX).toBe(2 * 40); // 80
      expect(compressed.translateX).toBe(2 * 30); // 60
      expect(compressed.translateX).toBeLessThan(uncompressed.translateX);
    });

    it('applies selection lift, scale, straightened angle, and elevated zIndex', () => {
      const total = 5;
      const unselected = calculateHandFan(0, total, { isSelected: false });
      const selected = calculateHandFan(0, total, {
        isSelected: true,
        selectedLift: -36,
        selectedScale: 1.1,
        selectedStraightenFactor: 0.2,
      });

      expect(selected.translateY).toBe(unselected.translateY - 36);
      expect(selected.scale).toBe(1.1);
      expect(selected.rotateDeg).toBeCloseTo(unselected.rotateDeg * 0.2, 5);
      expect(selected.zIndex).toBe(999);
      expect(unselected.zIndex).toBe(1);
    });
  });

  describe('calculateCarouselTransform', () => {
    it('returns identity for flat preset', () => {
      const res = calculateCarouselTransform(1.5, 'flat');
      expect(res.transform).toEqual([]);
      expect(res.opacity).toBe(1);
      expect(res.zIndex).toBe(1);
    });

    it('returns scale 1.0 and opacity 1.0 for centered item (distance = 0)', () => {
      const res = calculateCarouselTransform(0, 'scale-fade');
      expect(res.transform).toEqual([{ scale: 1 }]);
      expect(res.opacity).toBe(1);
      expect(res.zIndex).toBe(50);
    });

    it('scales and fades adjacent items symmetrically for scale-fade preset', () => {
      const left = calculateCarouselTransform(-1, 'scale-fade');
      const right = calculateCarouselTransform(1, 'scale-fade');

      expect(left.transform).toEqual(right.transform);
      expect(left.opacity).toBe(right.opacity);
      expect(left.opacity).toBeLessThan(1);
      expect(left.zIndex).toBe(right.zIndex);
    });

    it('applies perspective and 3D rotateY for coverflow preset', () => {
      const center = calculateCarouselTransform(0, 'coverflow');
      const left = calculateCarouselTransform(-1, 'coverflow');
      const right = calculateCarouselTransform(1, 'coverflow');

      // Center has 0 rotation
      expect(center.transform).toContainEqual({ rotateY: '0deg' });

      // Left and right have opposing rotations
      expect(left.transform).toContainEqual({ rotateY: '38deg' });
      expect(right.transform).toContainEqual({ rotateY: '-38deg' });
      expect(center.zIndex).toBeGreaterThan(left.zIndex);
    });

    it('applies directional offsets for card-stack preset', () => {
      const left = calculateCarouselTransform(-1, 'card-stack');
      const right = calculateCarouselTransform(1, 'card-stack');

      expect(left.zIndex).toBeGreaterThanOrEqual(9);
      expect(right.zIndex).toBeLessThanOrEqual(9);
    });
  });

  describe('calculateSwipeTilt', () => {
    it('returns 0 at center', () => {
      expect(calculateSwipeTilt(0)).toBe(0);
    });

    it('returns proportional positive tilt when dragging right', () => {
      const tilt = calculateSwipeTilt(120, 14, 240);
      expect(tilt).toBe(7);
    });

    it('clamps tilt at max distance', () => {
      const maxRight = calculateSwipeTilt(500, 14, 240);
      const maxLeft = calculateSwipeTilt(-500, 14, 240);
      expect(maxRight).toBe(14);
      expect(maxLeft).toBe(-14);
    });

    it('handles zero or negative maxDistance safely', () => {
      expect(calculateSwipeTilt(50, 14, 0)).toBe(0);
    });
  });
});
