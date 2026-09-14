export type TimeParts = { hours: number; minutes: number };

const pad = (value: number): string => String(value).padStart(2, '0');

export const toTimeParts = (value: string): TimeParts | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
};

export const formatTime = (hours: number, minutes: number): string =>
  `${pad(hours)}:${pad(minutes)}`;

export const isValidTime = (value: string): boolean => toTimeParts(value) !== null;

export const clampTime = (hours: number, minutes: number): TimeParts => ({
  hours: Math.min(23, Math.max(0, Math.trunc(hours) || 0)),
  minutes: Math.min(59, Math.max(0, Math.trunc(minutes) || 0)),
});
