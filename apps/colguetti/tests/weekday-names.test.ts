import { describe, expect, it } from 'vitest';
import { weekdayNames } from '../src/utils/weekday-names';

describe('weekdayNames', () => {
  it('labels a Sunday (getDay 0) as Sunday, not Monday', () => {
    expect(weekdayNames([0], 'en')).toContain('Sun');
    expect(weekdayNames([0], 'en')).not.toContain('Mon');
  });

  it('maps every getDay() index to the correct short name', () => {
    expect(weekdayNames([0, 1, 2, 3, 4, 5, 6], 'en')).toBe('Sun Mon Tue Wed Thu Fri Sat');
  });

  it('joins the given weekdays in order', () => {
    expect(weekdayNames([1, 3, 5], 'en')).toBe('Mon Wed Fri');
  });
});
