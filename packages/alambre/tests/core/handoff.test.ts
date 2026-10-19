import { describe, expect, it } from 'vitest';
import {
  transferVelocity,
  projectEndpoint,
  blendScalar,
  calculateCriticalDamping,
  calculateDampingRatio,
  makeCriticallyDampedConfig,
} from '../../src/core/handoff';

describe('kinetic handoff primitives', () => {
  describe('transferVelocity', () => {
    const baseSpring = { damping: 20, stiffness: 200, mass: 1 };

    it('injects scalar velocity into spring config with default scaling', () => {
      const config = transferVelocity(1000, baseSpring);
      // default velocityScale is 0.85 -> 850
      expect(config.damping).toBe(20);
      expect(config.stiffness).toBe(200);
      expect(config.velocity).toBe(850);
    });

    it('computes resultant magnitude and direction from 2D velocity vector', () => {
      // 3-4-5 triangle: vx=300, vy=400 -> hypot=500 -> scaled 0.85 = 425
      const config = transferVelocity({ vx: 300, vy: 400 }, baseSpring);
      expect(config.velocity).toBe(425);

      const negConfig = transferVelocity({ vx: 300, vy: -400 }, baseSpring);
      expect(negConfig.velocity).toBe(-425);
    });

    it('clamps velocity at maxVelocity to protect numerical spring stability', () => {
      const config = transferVelocity(10000, baseSpring, { maxVelocity: 3000 });
      expect(config.velocity).toBe(3000);

      const negConfig = transferVelocity(-10000, baseSpring, { maxVelocity: 3000 });
      expect(negConfig.velocity).toBe(-3000);
    });

    it('respects custom velocityScale', () => {
      const config = transferVelocity(1000, baseSpring, { velocityScale: 0.5 });
      expect(config.velocity).toBe(500);
    });

    it('enforces critical damping when requested', () => {
      // stiffness = 100, mass = 1 -> critical damping = 2 * sqrt(100) = 20
      const underdamped = { damping: 10, stiffness: 100, mass: 1 };
      const config = transferVelocity(1000, underdamped, { enforceCriticalDamping: true });
      expect(config.damping).toBe(20);

      // If existing damping is already higher than critical, it is preserved
      const overdamped = { damping: 30, stiffness: 100, mass: 1 };
      const configOver = transferVelocity(1000, overdamped, { enforceCriticalDamping: true });
      expect(configOver.damping).toBe(30);
    });
  });

  describe('critical damping helpers', () => {
    it('calculates critical damping coefficient c_crit = 2 * sqrt(m * k)', () => {
      expect(calculateCriticalDamping(100, 1)).toBe(20);
      expect(calculateCriticalDamping(400, 1)).toBe(40);
      expect(calculateCriticalDamping(100, 4)).toBe(40);
    });

    it('calculates damping ratio zeta = c / c_crit', () => {
      // c_crit = 20
      expect(calculateDampingRatio(10, 100, 1)).toBeCloseTo(0.5, 2); // underdamped
      expect(calculateDampingRatio(20, 100, 1)).toBeCloseTo(1.0, 2); // critically damped
      expect(calculateDampingRatio(30, 100, 1)).toBeCloseTo(1.5, 2); // overdamped
    });

    it('constructs a critically damped spring config', () => {
      const cfg = makeCriticallyDampedConfig(160, 1, 500);
      expect(cfg.stiffness).toBe(160);
      expect(cfg.mass).toBe(1);
      expect(cfg.velocity).toBe(500);
      expect(cfg.damping).toBeCloseTo(2 * Math.sqrt(160), 4);
    });
  });

  describe('projectEndpoint', () => {
    it('returns start position when velocity is negligible', () => {
      expect(projectEndpoint(100, 0)).toBe(100);
      expect(projectEndpoint(100, 0.5)).toBe(100);
    });

    it('projects resting point under inertial decay', () => {
      // v = 1000, d = 0.997 -> travel = (1000 * 0.997) / (1000 * 0.003) = 997 / 3 = 332.33
      const rest = projectEndpoint(0, 1000, 0.997);
      expect(rest).toBeCloseTo(332.33, 1);
    });

    it('projects negative travel for negative velocity', () => {
      const rest = projectEndpoint(100, -1000, 0.997);
      expect(rest).toBeCloseTo(100 - 332.33, 1);
    });

    it('clamps decelerationRate between 0.9 and 0.999', () => {
      const rest1 = projectEndpoint(0, 1000, 0.5); // clamps to 0.9
      expect(rest1).toBeCloseTo((1000 * 0.9) / (1000 * 0.1)); // 9

      const rest2 = projectEndpoint(0, 1000, 1.5); // clamps to 0.999
      expect(rest2).toBeCloseTo((1000 * 0.999) / (1000 * 0.001)); // 999
    });
  });

  describe('blendScalar', () => {
    it('blends values according to alpha', () => {
      expect(blendScalar(10, 20, 0)).toBe(10);
      expect(blendScalar(10, 20, 0.5)).toBe(15);
      expect(blendScalar(10, 20, 1)).toBe(20);
    });

    it('clamps alpha to [0, 1]', () => {
      expect(blendScalar(10, 20, -1)).toBe(10);
      expect(blendScalar(10, 20, 2)).toBe(20);
    });
  });
});
