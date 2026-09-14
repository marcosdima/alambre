import { describe, expect, it } from 'vitest';
import {
  HOUR_RANGE,
  MINUTE_RANGE,
  clampIndex,
  formatTimeValue,
  indexFromOffset,
  pad2,
  parseTimeValue,
} from '../../src/components/time/time-utils';

describe('time-utils', () => {
  it('pads values to two digits', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(8)).toBe('08');
    expect(pad2(23)).toBe('23');
  });

  it('provides full hour and minute ranges', () => {
    expect(HOUR_RANGE).toHaveLength(24);
    expect(HOUR_RANGE[0]).toBe('00');
    expect(HOUR_RANGE[23]).toBe('23');
    expect(MINUTE_RANGE).toHaveLength(60);
    expect(MINUTE_RANGE[59]).toBe('59');
  });

  it('parses valid clock values', () => {
    expect(parseTimeValue('08:30')).toEqual({ hours: 8, minutes: 30 });
    expect(parseTimeValue('23:59')).toEqual({ hours: 23, minutes: 59 });
  });

  it('falls back to 0 for malformed values', () => {
    expect(parseTimeValue('')).toEqual({ hours: 0, minutes: 0 });
    expect(parseTimeValue('25:61')).toEqual({ hours: 0, minutes: 0 });
    expect(parseTimeValue('ab:cd')).toEqual({ hours: 0, minutes: 0 });
  });

  it('formats parts back to a clock value', () => {
    expect(formatTimeValue({ hours: 8, minutes: 5 })).toBe('08:05');
  });

  it('clamps indexes to the range', () => {
    expect(clampIndex(-3, 24)).toBe(0);
    expect(clampIndex(40, 24)).toBe(23);
    expect(clampIndex(5, 24)).toBe(5);
  });

  it('derives the index from an offset', () => {
    expect(indexFromOffset(0, 38)).toBe(0);
    expect(indexFromOffset(190, 38)).toBe(5);
    expect(indexFromOffset(189, 38)).toBe(5);
    expect(indexFromOffset(191, 38)).toBe(5);
  });
});
