import { describe, expect, it } from 'vitest';
import type { PlayingCardData, Point2D } from '../../src/views/card-game/types';
import {
  computeDealCascadePlan,
  sampleFlightTrajectory,
} from '../../src/views/card-game/engine/deal-cascade';

describe('Deal Cascade Engine', () => {
  const deckOrigin: Point2D = { x: 50, y: 100 };
  const handCenter: Point2D = { x: 200, y: 400 };

  const cardsToDeal: PlayingCardData[] = [
    { id: 'c1', suit: 'spades', rank: 'A' },
    { id: 'c2', suit: 'hearts', rank: 'K' },
    { id: 'c3', suit: 'diamonds', rank: 'Q' },
  ];

  describe('computeDealCascadePlan', () => {
    it('returns empty plan when no cards are passed', () => {
      const plan = computeDealCascadePlan([], { deckOrigin, handCenter });
      expect(plan.specs).toHaveLength(0);
      expect(plan.totalDurationMs).toBe(0);
      expect(plan.targetHandTotal).toBe(0);
    });

    it('calculates staggered delays and landing times for each card', () => {
      const staggerDelayMs = 100;
      const flightDurationMs = 350;

      const plan = computeDealCascadePlan(cardsToDeal, {
        deckOrigin,
        handCenter,
        staggerDelayMs,
        flightDurationMs,
      });

      expect(plan.specs).toHaveLength(3);
      expect(plan.targetHandTotal).toBe(3);

      const [c1, c2, c3] = plan.specs;

      expect(c1!.startDelayMs).toBe(0);
      expect(c1!.landingTimeMs).toBe(350);

      expect(c2!.startDelayMs).toBe(100);
      expect(c2!.landingTimeMs).toBe(450);

      expect(c3!.startDelayMs).toBe(200);
      expect(c3!.landingTimeMs).toBe(550);

      expect(plan.totalDurationMs).toBe(550);
    });

    it('maps target slot coordinates accurately based on resulting hand fan', () => {
      const plan = computeDealCascadePlan(cardsToDeal, {
        deckOrigin,
        handCenter,
      });

      const [left, center, right] = plan.specs;

      // In a 3-card hand, center card should have translateX = 0, so x = handCenter.x
      expect(center!.to.x).toBe(handCenter.x);
      expect(center!.targetRotation).toBe(0);

      // Left card should be to the left, right card to the right
      expect(left!.to.x).toBeLessThan(handCenter.x);
      expect(left!.targetRotation).toBeLessThan(0);

      expect(right!.to.x).toBeGreaterThan(handCenter.x);
      expect(right!.targetRotation).toBeGreaterThan(0);
    });

    it('appends dealt cards to existing cards in hand', () => {
      const existingHand: PlayingCardData[] = [
        { id: 'e1', suit: 'clubs', rank: '2' },
        { id: 'e2', suit: 'diamonds', rank: '3' },
      ];

      const plan = computeDealCascadePlan(cardsToDeal, {
        deckOrigin,
        handCenter,
        currentHand: existingHand,
      });

      expect(plan.specs).toHaveLength(3);
      expect(plan.targetHandTotal).toBe(5);

      // The 3 dealt cards should target slot indices 2, 3, 4
      expect(plan.specs[0]!.targetSlotIndex).toBe(2);
      expect(plan.specs[1]!.targetSlotIndex).toBe(3);
      expect(plan.specs[2]!.targetSlotIndex).toBe(4);
    });
  });

  describe('sampleFlightTrajectory', () => {
    it('evaluates initial state at t = 0', () => {
      const plan = computeDealCascadePlan(cardsToDeal, { deckOrigin, handCenter, flipOnFly: true });
      const spec = plan.specs[0]!;

      const state0 = sampleFlightTrajectory(spec, 0);

      expect(state0.x).toBe(spec.from.x);
      expect(state0.y).toBe(spec.from.y);
      expect(state0.scale).toBe(1.0);
      expect(state0.altitude).toBe(0);
      expect(state0.rotateYDeg).toBe(180);
      expect(state0.isFrontFacing).toBe(false); // Back facing at t=0
    });

    it('evaluates parabolic apex at midpoint t = 0.5', () => {
      const liftHeight = 60;
      const peakScale = 1.2;

      const plan = computeDealCascadePlan(cardsToDeal, {
        deckOrigin,
        handCenter,
        liftHeight,
        peakScale,
        flipOnFly: true,
      });
      const spec = plan.specs[0]!;

      const midState = sampleFlightTrajectory(spec, 0.5);

      expect(midState.altitude).toBe(1.0);
      expect(midState.scale).toBe(peakScale);
      expect(midState.rotateYDeg).toBe(90);

      // Midpoint linear Y is (deckOrigin.y + spec.to.y) / 2
      const linearMidY = (spec.from.y + spec.to.y) / 2;
      // Parabolic y should be lifted upward (negative Y in screen coords) by liftHeight
      expect(midState.y).toBe(linearMidY - liftHeight);
    });

    it('evaluates touchdown state at t = 1.0', () => {
      const plan = computeDealCascadePlan(cardsToDeal, { deckOrigin, handCenter, flipOnFly: true });
      const spec = plan.specs[0]!;

      const endState = sampleFlightTrajectory(spec, 1.0);

      expect(endState.x).toBe(spec.to.x);
      expect(endState.y).toBe(spec.to.y);
      expect(endState.scale).toBe(1.0);
      expect(endState.altitude).toBe(0);
      expect(endState.rotateYDeg).toBe(0);
      expect(endState.isFrontFacing).toBe(true); // Front facing on landing
      expect(endState.rotateZDeg).toBe(spec.targetRotation);
    });

    it('remains face-up throughout flight when flipOnFly is false', () => {
      const plan = computeDealCascadePlan(cardsToDeal, { deckOrigin, handCenter, flipOnFly: false });
      const spec = plan.specs[0]!;

      const start = sampleFlightTrajectory(spec, 0);
      const mid = sampleFlightTrajectory(spec, 0.5);
      const end = sampleFlightTrajectory(spec, 1.0);

      expect(start.rotateYDeg).toBe(0);
      expect(start.isFrontFacing).toBe(true);

      expect(mid.rotateYDeg).toBe(0);
      expect(mid.isFrontFacing).toBe(true);

      expect(end.rotateYDeg).toBe(0);
      expect(end.isFrontFacing).toBe(true);
    });
  });
});
