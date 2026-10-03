import { describe, expect, it } from 'vitest';
import { kinetics, rubberBandFriction } from '../../src/core/kinetics';

describe('kinetics token system', () => {
  describe('spring profiles', () => {
    it('exposes all canonical spring profiles', () => {
      expect(kinetics.spring).toBeDefined();
      expect(kinetics.spring.snappy).toBeDefined();
      expect(kinetics.spring.bouncy).toBeDefined();
      expect(kinetics.spring.gentle).toBeDefined();
      expect(kinetics.spring.stiff).toBeDefined();
    });

    it('defines expected token values for spring configs', () => {
      expect(kinetics.spring.snappy).toEqual({
        damping: 20,
        mass: 1,
        stiffness: 250,
      });

      expect(kinetics.spring.bouncy).toEqual({
        damping: 14,
        mass: 1,
        stiffness: 150,
      });

      expect(kinetics.spring.gentle).toEqual({
        damping: 25,
        mass: 1,
        stiffness: 100,
      });

      expect(kinetics.spring.stiff).toEqual({
        damping: 20,
        mass: 1,
        stiffness: 300,
      });
    });

    it('satisfies physical invariants across spring profiles', () => {
      const profiles = [
        kinetics.spring.snappy,
        kinetics.spring.bouncy,
        kinetics.spring.gentle,
        kinetics.spring.stiff,
      ];

      for (const profile of profiles) {
        expect(profile.mass).toBeGreaterThan(0);
        expect(profile.damping).toBeGreaterThan(0);
        expect(profile.stiffness).toBeGreaterThan(0);
      }

      // Stiffness hierarchy: gentle < bouncy < snappy < stiff
      expect(kinetics.spring.gentle.stiffness!).toBeLessThan(kinetics.spring.bouncy.stiffness!);
      expect(kinetics.spring.bouncy.stiffness!).toBeLessThan(kinetics.spring.snappy.stiffness!);
      expect(kinetics.spring.snappy.stiffness!).toBeLessThan(kinetics.spring.stiff.stiffness!);

      // Bouncy has the lowest damping to allow overshoot/rebound
      expect(kinetics.spring.bouncy.damping!).toBeLessThan(kinetics.spring.snappy.damping!);
      expect(kinetics.spring.bouncy.damping!).toBeLessThan(kinetics.spring.gentle.damping!);
    });
  });

  describe('timing profiles', () => {
    it('exposes fast, base, and slow duration presets', () => {
      expect(kinetics.timing).toBeDefined();
      expect(kinetics.timing.fast).toEqual({ duration: 150 });
      expect(kinetics.timing.base).toEqual({ duration: 250 });
      expect(kinetics.timing.slow).toEqual({ duration: 350 });
    });

    it('ensures monotonic ordering of durations', () => {
      expect(kinetics.timing.fast.duration!).toBeLessThan(kinetics.timing.base.duration!);
      expect(kinetics.timing.base.duration!).toBeLessThan(kinetics.timing.slow.duration!);
    });
  });

  describe('rubberBandFriction', () => {
    it('wires kinetics.friction.rubberBand to rubberBandFriction implementation', () => {
      expect(kinetics.friction.rubberBand).toBe(rubberBandFriction);
    });

    it('computes linear resistance with default friction coefficient (0.55)', () => {
      expect(rubberBandFriction(0)).toBe(0);
      expect(rubberBandFriction(100)).toBeCloseTo(55);
      expect(rubberBandFriction(-100)).toBeCloseTo(-55);
      expect(rubberBandFriction(25)).toBeCloseTo(13.75);
    });

    it('computes resistance with custom friction coefficients', () => {
      expect(rubberBandFriction(100, 0.12)).toBeCloseTo(12);
      expect(rubberBandFriction(100, 0.25)).toBeCloseTo(25);
      expect(rubberBandFriction(-200, 0.1)).toBeCloseTo(-20);
      expect(rubberBandFriction(80, 0)).toBe(0);
      expect(rubberBandFriction(0, 0.9)).toBe(0);
    });

    it('handles edge case inputs symmetrically and without loss of precision', () => {
      expect(rubberBandFriction(-0)).toBe(-0);
      expect(rubberBandFriction(1_000_000, 0.5)).toBe(500_000);
      expect(rubberBandFriction(-1_000_000, 0.5)).toBe(-500_000);

      // Symmetry check
      const delta = 150;
      const k = 0.35;
      expect(rubberBandFriction(delta, k)).toBe(-rubberBandFriction(-delta, k));
    });
  });
});
