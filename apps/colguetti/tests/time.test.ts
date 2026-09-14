import { describe, expect, it } from 'vitest';
import { toTimeParts, formatTime, isValidTime, clampTime } from '../src/utils/time';

describe('time helpers', () => {
  it('parses valid HH:MM values', () => {
    expect(toTimeParts('08:30')).toEqual({ hours: 8, minutes: 30 });
    expect(toTimeParts('00:00')).toEqual({ hours: 0, minutes: 0 });
    expect(toTimeParts('23:59')).toEqual({ hours: 23, minutes: 59 });
  });

  it('rejects out-of-range or malformed values', () => {
    expect(toTimeParts('24:00')).toBeNull();
    expect(toTimeParts('08:60')).toBeNull();
    expect(toTimeParts('8')).toBeNull();
    expect(toTimeParts('ab:cd')).toBeNull();
  });

  it('formats parts with zero padding', () => {
    expect(formatTime(8, 5)).toBe('08:05');
    expect(formatTime(23, 59)).toBe('23:59');
  });

  it('validates full clock values', () => {
    expect(isValidTime('08:30')).toBe(true);
    expect(isValidTime('8:5')).toBe(false);
    expect(isValidTime('24:00')).toBe(false);
  });

  it('clamps parts to valid ranges', () => {
    expect(clampTime(26, 80)).toEqual({ hours: 23, minutes: 59 });
    expect(clampTime(-1, -1)).toEqual({ hours: 0, minutes: 0 });
  });
});
