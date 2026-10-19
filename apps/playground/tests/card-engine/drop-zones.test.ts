import { describe, expect, it } from 'vitest';
import type { DropZoneBounds, PlayingCardData } from '../../src/views/card-game/types';
import {
  findTargetDropZone,
  generateStackJitter,
  getZoneCenter,
  pointInBounds,
} from '../../src/views/card-game/engine/drop-zones';

describe('Drop Zones Engine', () => {
  const tableZone: DropZoneBounds = {
    id: 'table',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
  };

  const discardZone: DropZoneBounds = {
    id: 'discard',
    x: 350,
    y: 100,
    width: 100,
    height: 150,
    accepts: (card) => card.suit === 'hearts',
  };

  describe('pointInBounds', () => {
    it('returns true when point is inside bounding box', () => {
      expect(pointInBounds({ x: 150, y: 150 }, tableZone)).toBe(true);
      expect(pointInBounds({ x: 100, y: 100 }, tableZone)).toBe(true); // on edge
      expect(pointInBounds({ x: 300, y: 250 }, tableZone)).toBe(true); // on edge
    });

    it('returns false when point is outside bounding box', () => {
      expect(pointInBounds({ x: 50, y: 150 }, tableZone)).toBe(false);
      expect(pointInBounds({ x: 350, y: 150 }, tableZone)).toBe(false);
    });

    it('honors expansion padding', () => {
      expect(pointInBounds({ x: 90, y: 150 }, tableZone, 0)).toBe(false);
      expect(pointInBounds({ x: 90, y: 150 }, tableZone, 15)).toBe(true);
    });
  });

  describe('findTargetDropZone', () => {
    const zones = [tableZone, discardZone];

    it('finds containing zone when point is inside', () => {
      const match = findTargetDropZone({ x: 150, y: 150 }, zones);
      expect(match).toBeDefined();
      expect(match?.id).toBe('table');
    });

    it('respects zone accepts predicate', () => {
      const heartCard: PlayingCardData = { id: 'c1', suit: 'hearts', rank: 'A' };
      const spadeCard: PlayingCardData = { id: 'c2', suit: 'spades', rank: 'K' };

      const matchHeart = findTargetDropZone({ x: 380, y: 150 }, zones, heartCard);
      expect(matchHeart?.id).toBe('discard');

      const matchSpade = findTargetDropZone({ x: 380, y: 150 }, zones, spadeCard);
      expect(matchSpade).toBeNull();
    });

    it('returns null when outside all zones', () => {
      const match = findTargetDropZone({ x: 500, y: 500 }, zones);
      expect(match).toBeNull();
    });
  });

  describe('getZoneCenter', () => {
    it('calculates midpoint accurately', () => {
      const center = getZoneCenter(tableZone);
      expect(center.x).toBe(200); // 100 + 200/2
      expect(center.y).toBe(175); // 100 + 150/2
    });
  });

  describe('generateStackJitter', () => {
    it('returns deterministic rotation and offsets within bounds', () => {
      const jitter1 = generateStackJitter('card_spades_A', 14, 6);
      const jitter2 = generateStackJitter('card_spades_A', 14, 6);

      expect(jitter1).toEqual(jitter2);
      expect(Math.abs(jitter1.rotation)).toBeLessThanOrEqual(14);
      expect(Math.abs(jitter1.offsetX)).toBeLessThanOrEqual(6);
      expect(Math.abs(jitter1.offsetY)).toBeLessThanOrEqual(6);
    });

    it('produces different jitter for different cards', () => {
      const jitterA = generateStackJitter('card_1', 12, 5);
      const jitterB = generateStackJitter('card_2', 12, 5);

      expect(jitterA).not.toEqual(jitterB);
    });
  });
});
