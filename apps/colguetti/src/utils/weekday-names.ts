import type { Weekday } from '../alarms/alarm-types';

export const weekdayNames = (weekdays: readonly Weekday[], locale: string): string => {
  const names = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const byIndex = Array.from({ length: 7 }, (_, i) => names.format(new Date(2000, 0, 2 + i)));
  return weekdays.map((d) => byIndex[d]).join(' ');
};
