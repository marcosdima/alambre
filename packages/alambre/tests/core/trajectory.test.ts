import { describe, expect, it } from 'vitest';
import {
  linearTrajectory,
  parabolicTrajectory,
  arcTrajectory,
  quadraticBezier,
  cubicBezier,
  interpolateScalar,
} from '../../src/core/trajectory';

describe('parametric trajectory primitives', () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 200 };

  describe('linearTrajectory', () => {
    it('returns starting point at t = 0', () => {
      const pt = linearTrajectory(0, from, to);
      expect(pt.x).toBe(0);
      expect(pt.y).toBe(0);
    });

    it('returns destination point at t = 1', () => {
      const pt = linearTrajectory(1, from, to);
      expect(pt.x).toBe(100);
      expect(pt.y).toBe(200);
    });

    it('returns exact midpoint at t = 0.5', () => {
      const pt = linearTrajectory(0.5, from, to);
      expect(pt.x).toBe(50);
      expect(pt.y).toBe(100);
    });

    it('clamps t out of [0, 1] range', () => {
      const ptNeg = linearTrajectory(-0.5, from, to);
      expect(ptNeg.x).toBe(0);
      expect(ptNeg.y).toBe(0);

      const ptOver = linearTrajectory(1.5, from, to);
      expect(ptOver.x).toBe(100);
      expect(ptOver.y).toBe(200);
    });
  });

  describe('parabolicTrajectory', () => {
    it('starts at from and ends at to with zero altitude offset at boundaries', () => {
      const start = parabolicTrajectory(0, from, to, 50);
      expect(start.x).toBe(0);
      expect(start.y).toBe(0);

      const end = parabolicTrajectory(1, from, to, 50);
      expect(end.x).toBe(100);
      expect(end.y).toBe(200);
    });

    it('reaches peak vertical lift of liftHeight at t = 0.5', () => {
      const mid = parabolicTrajectory(0.5, from, to, 60);
      // Midpoint linear is y = 100, liftHeight = 60 lifts upward (-60): y = 40
      expect(mid.x).toBe(50);
      expect(mid.y).toBe(40);
    });

    it('is symmetric about midpoint t = 0.5', () => {
      const lift = 40;
      const t1 = parabolicTrajectory(0.25, from, to, lift);
      const t2 = parabolicTrajectory(0.75, from, to, lift);

      // Linear y: t=0.25 -> 50, t=0.75 -> 150
      // Parabolic altitude: 4 * 0.25 * 0.75 = 0.75 of lift (30)
      expect(t1.y).toBeCloseTo(50 - 30);
      expect(t2.y).toBeCloseTo(150 - 30);
    });
  });

  describe('arcTrajectory', () => {
    it('matches linear endpoints at t = 0 and t = 1', () => {
      const start = arcTrajectory(0, from, to, 30);
      expect(start.x).toBeCloseTo(0);
      expect(start.y).toBeCloseTo(0);

      const end = arcTrajectory(1, from, to, 30);
      expect(end.x).toBeCloseTo(100);
      expect(end.y).toBeCloseTo(200);
    });

    it('applies lateral perpendicular displacement at t = 0.5', () => {
      const hFrom = { x: 0, y: 0 };
      const hTo = { x: 100, y: 0 };
      // Horizontal trajectory: dx = 100, dy = 0.
      // Perpendicular vector (-dy/len, dx/len) = (0, 1).
      const mid = arcTrajectory(0.5, hFrom, hTo, 40);
      expect(mid.x).toBeCloseTo(50);
      expect(mid.y).toBeCloseTo(40);
    });

    it('handles zero-length vector without division by zero', () => {
      const same = { x: 50, y: 50 };
      const pt = arcTrajectory(0.5, same, same, 30);
      expect(pt.x).toBe(50);
      expect(pt.y).toBe(50);
    });
  });

  describe('quadraticBezier & cubicBezier', () => {
    it('anchors quadratic bezier at P0 and P2', () => {
      const p0 = { x: 10, y: 20 };
      const p1 = { x: 50, y: 100 };
      const p2 = { x: 90, y: 40 };

      const start = quadraticBezier(0, p0, p1, p2);
      expect(start.x).toBe(10);
      expect(start.y).toBe(20);

      const end = quadraticBezier(1, p0, p1, p2);
      expect(end.x).toBe(90);
      expect(end.y).toBe(40);
    });

    it('anchors cubic bezier at P0 and P3', () => {
      const p0 = { x: 0, y: 0 };
      const p1 = { x: 30, y: 90 };
      const p2 = { x: 70, y: 90 };
      const p3 = { x: 100, y: 0 };

      const start = cubicBezier(0, p0, p1, p2, p3);
      expect(start.x).toBe(0);
      expect(start.y).toBe(0);

      const end = cubicBezier(1, p0, p1, p2, p3);
      expect(end.x).toBe(100);
      expect(end.y).toBe(0);
    });
  });

  describe('interpolateScalar', () => {
    it('linearly interpolates scalar value and clamps bounds', () => {
      expect(interpolateScalar(0, 10, 50)).toBe(10);
      expect(interpolateScalar(0.5, 10, 50)).toBe(30);
      expect(interpolateScalar(1, 10, 50)).toBe(50);
      expect(interpolateScalar(-0.2, 10, 50)).toBe(10);
      expect(interpolateScalar(1.2, 10, 50)).toBe(50);
    });
  });
});
