export const pad2 = (value: number): string => String(value).padStart(2, '0');

export const HOUR_RANGE = Array.from({ length: 24 }, (_, i) => pad2(i));

export const MINUTE_RANGE = Array.from({ length: 60 }, (_, i) => pad2(i));

export type TimeParts = { hours: number; minutes: number };

export const parseTimeValue = (value: string): TimeParts => {
  const [hours, minutes] = value.split(':');
  const h = Number(hours);
  const m = Number(minutes);
  return {
    hours: Number.isInteger(h) && h >= 0 && h <= 23 ? h : 0,
    minutes: Number.isInteger(m) && m >= 0 && m <= 59 ? m : 0,
  };
};

export const formatTimeValue = (parts: TimeParts): string =>
  `${pad2(parts.hours)}:${pad2(parts.minutes)}`;
