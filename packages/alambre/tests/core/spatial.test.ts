import { describe, expect, it, vi } from 'vitest';
import {
  parabolicAltitudeCurve,
  calculateHandFan,
  calculateResponsiveHandFan,
  calculateCarouselTransform,
  calculateSwipeTilt,
  pointInBounds,
  findTargetDropZone,
  getZoneCenter,
  generateStackJitter,
  projectTossLanding,
  resolveTossDynamics,
  computeSpatialCascadePlan,
  sampleFlightTrajectory,
} from '../../src/core/spatial';
import { reorderHandItems, resolveHandReorderIndex } from '../../src/hooks/use-interactive-hand';
import { createSensoryCues } from '../../src/capabilities/sensory';
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
      expect(kinetics.spatial.calculateResponsiveHandFan).toBe(calculateResponsiveHandFan);
      expect(kinetics.spatial.calculateCarouselTransform).toBe(calculateCarouselTransform);
      expect(kinetics.spatial.calculateSwipeTilt).toBe(calculateSwipeTilt);
      expect(kinetics.spatial.pointInBounds).toBe(pointInBounds);
      expect(kinetics.spatial.findTargetDropZone).toBe(findTargetDropZone);
      expect(kinetics.spatial.getZoneCenter).toBe(getZoneCenter);
      expect(kinetics.spatial.generateStackJitter).toBe(generateStackJitter);
      expect(kinetics.spatial.projectTossLanding).toBe(projectTossLanding);
      expect(kinetics.spatial.resolveTossDynamics).toBe(resolveTossDynamics);
      expect(kinetics.spatial.computeSpatialCascadePlan).toBe(computeSpatialCascadePlan);
      expect(kinetics.spatial.sampleFlightTrajectory).toBe(sampleFlightTrajectory);
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

  describe('Drop-zone collision, toss dynamics & responsive hand fan (Proposals 12 & 13)', () => {
    it('evaluates AABB collision and resolves toss landing into drop zone or home slot', () => {
      const zone = { id: 'table', x: 100, y: 50, width: 120, height: 100 };
      expect(pointInBounds({ x: 150, y: 90 }, zone)).toBe(true);
      expect(pointInBounds({ x: 20, y: 20 }, zone)).toBe(false);
      expect(getZoneCenter(zone)).toEqual({ x: 160, y: 100 });

      const item = { id: 'card_1' };
      const hit = resolveTossDynamics({
        releasePoint: { x: 155, y: 95 },
        velocity: { vx: 10, vy: -10 },
        dropZones: [zone],
        item,
        homeSlot: { x: 0, y: 300 },
      });
      expect(hit.isDropSuccess).toBe(true);
      expect(hit.targetZone?.id).toBe('table');

      const miss = resolveTossDynamics({
        releasePoint: { x: 0, y: 290 },
        velocity: { vx: 0, vy: 0 },
        dropZones: [zone],
        item,
        homeSlot: { x: 0, y: 300 },
        homeRotation: -4,
      });
      expect(miss.isDropSuccess).toBe(false);
      expect(miss.destination).toEqual({ x: 0, y: 300 });
      expect(miss.targetRotation).toBe(-4);
    });

    it('supports multi-selection in calculateResponsiveHandFan and computes cascade flight plans', () => {
      const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const fan = calculateResponsiveHandFan(items, {
        selectedIds: ['a', 'c'],
        selectedLift: -30,
      });
      expect(fan.slots).toHaveLength(3);
      expect(fan.slots[0]!.zIndex).toBe(999);
      expect(fan.slots[1]!.zIndex).toBe(2);
      expect(fan.slots[2]!.zIndex).toBe(999);

      const plan = computeSpatialCascadePlan([{ id: 'd' }, { id: 'e' }], {
        origin: { x: 0, y: -150 },
        targetCenter: { x: 0, y: 120 },
        currentItems: items,
        staggerDelayMs: 80,
        flightDurationMs: 300,
      });
      expect(plan.specs).toHaveLength(2);
      expect(plan.targetTotal).toBe(5);
      expect(plan.specs[1]!.startDelayMs).toBe(80);
      expect(plan.totalDurationMs).toBe(380);

      const midSample = sampleFlightTrajectory(plan.specs[0]!, 0.5);
      expect(midSample.altitude).toBe(1);
    });

    it('reorders hand items immutably and resolves drag slot index', () => {
      const items = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }];
      const reordered = reorderHandItems(items, 0, 2);
      expect(reordered.map((i) => i.id)).toEqual(['2', '3', '1', '4']);
      expect(resolveHandReorderIndex(1, 76, 38, 4)).toBe(3);
      expect(resolveHandReorderIndex(1, -200, 38, 4)).toBe(0);
    });
  });

  describe('Sensory Cues Capability (Proposal 15)', () => {
    it('dispatches haptic and sound cues with cooldown throttling and mute controls', async () => {
      let currentNow = 1000;
      const onHaptic = vi.fn();
      const onSound = vi.fn();

      const sensory = createSensoryCues<'card.deal' | 'card.play'>({
        minIntervalMs: 40,
        onHaptic,
        onSound,
        now: () => currentNow,
      });

      expect(sensory.actions.trigger('card.deal', { pitch: 1.0 })).toBe(true);
      expect(onHaptic).toHaveBeenCalledTimes(1);
      expect(onSound).toHaveBeenCalledTimes(1);

      // Rapid duplicate within 40ms cooldown is throttled
      currentNow = 1015;
      expect(sensory.actions.trigger('card.deal', { pitch: 1.05 })).toBe(false);
      expect(onHaptic).toHaveBeenCalledTimes(1);

      // Different cue is not throttled
      expect(sensory.actions.trigger('card.play')).toBe(true);
      expect(onHaptic).toHaveBeenCalledTimes(2);

      // After cooldown window elapses, 'card.deal' fires again
      currentNow = 1050;
      expect(sensory.actions.trigger('card.deal', { pitch: 1.1 })).toBe(true);
      expect(onHaptic).toHaveBeenCalledTimes(3);

      // Muting haptics still allows sound to fire
      await sensory.actions.setHapticsEnabled(false);
      currentNow = 1100;
      expect(sensory.actions.trigger('card.deal')).toBe(true);
      expect(onHaptic).toHaveBeenCalledTimes(3);
      expect(onSound).toHaveBeenCalledTimes(4);

      // Muting both channels returns false
      await sensory.actions.setSoundEnabled(false);
      currentNow = 1200;
      expect(sensory.actions.trigger('card.deal')).toBe(false);
    });
  });
});

