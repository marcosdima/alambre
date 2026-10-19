import { describe, expect, it } from 'vitest';
import type { DropZoneBounds, PlayingCardData } from '../../src/views/card-game/types';
import {
  calculateDragTilt,
  projectTossLanding,
  resolveTossDynamics,
} from '../../src/views/card-game/engine/toss-physics';

describe('Toss Physics Engine', () => {
  const tableZone: DropZoneBounds = {
    id: 'table',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
  };

  const sampleCard: PlayingCardData = {
    id: 'card_hearts_10',
    suit: 'hearts',
    rank: '10',
  };

  const homeSlot = { x: 200, y: 400 };

  describe('projectTossLanding', () => {
    it('returns start position when velocity is 0', () => {
      const pos = projectTossLanding({ x: 50, y: 50 }, { vx: 0, vy: 0 });
      expect(pos.x).toBe(50);
      expect(pos.y).toBe(50);
    });

    it('projects forward displacement in direction of velocity', () => {
      const pos = projectTossLanding({ x: 100, y: 300 }, { vx: 400, vy: -600 });
      // Moving right and up (negative Y)
      expect(pos.x).toBeGreaterThan(100);
      expect(pos.y).toBeLessThan(300);
    });
  });

  describe('resolveTossDynamics', () => {
    it('resolves drop success when projected point enters a zone', () => {
      // Released near bottom of table moving upward into table zone
      const res = resolveTossDynamics({
        releasePoint: { x: 200, y: 260 },
        velocity: { vx: 0, vy: -300 },
        dropZones: [tableZone],
        card: sampleCard,
        homeSlot,
      });

      expect(res.isDropSuccess).toBe(true);
      expect(res.targetZone?.id).toBe('table');
      // Settles into table center with jitter (within maxOffset of 6)
      expect(Math.abs(res.destination.x - 200)).toBeLessThanOrEqual(6);
      expect(Math.abs(res.destination.y - 175)).toBeLessThanOrEqual(6);
      expect(res.springConfig.damping).toBeDefined();
    });

    it('restitutes back to home slot when toss misses all zones', () => {
      // Released far to the right, moving further away
      const res = resolveTossDynamics({
        releasePoint: { x: 600, y: 600 },
        velocity: { vx: 200, vy: 200 },
        dropZones: [tableZone],
        card: sampleCard,
        homeSlot,
        homeRotation: 4,
      });

      expect(res.isDropSuccess).toBe(false);
      expect(res.targetZone).toBeNull();
      expect(res.destination).toEqual(homeSlot);
      expect(res.targetRotation).toBe(4);
    });

    it('enforces critical damping (zeta >= 1.0) on spring config', () => {
      const res = resolveTossDynamics({
        releasePoint: { x: 200, y: 150 },
        velocity: { vx: 1200, vy: -1500 },
        dropZones: [tableZone],
        card: sampleCard,
        homeSlot,
        stiffness: 100,
      });

      // c_crit = 2 * sqrt(mass * stiffness) = 2 * sqrt(1 * 100) = 20
      expect(res.springConfig.damping).toBeGreaterThanOrEqual(20);
    });
  });

  describe('calculateDragTilt', () => {
    it('returns zero tilt when translation is zero', () => {
      expect(calculateDragTilt(0)).toBe(0);
    });

    it('tilts proportionally up to maximum angle', () => {
      const tiltLeft = calculateDragTilt(-100, 14, 200);
      const tiltRight = calculateDragTilt(100, 14, 200);

      expect(tiltLeft).toBe(-7);
      expect(tiltRight).toBe(7);

      // Clamps at max angle
      expect(calculateDragTilt(500, 14, 200)).toBe(14);
      expect(calculateDragTilt(-500, 14, 200)).toBe(-14);
    });
  });
});
