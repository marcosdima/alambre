import { describe, it, expect } from 'vitest';
import type { CompletedRecord } from '../src/domain/types';

describe('records best time per puzzle and mode', () => {
  const records: CompletedRecord[] = [
    {
      id: 'puzzle-1',
      completedAt: '2026-09-17T10:00:00Z',
      elapsedSeconds: 120,
      mistakesCount: 0,
      difficulty: 'easy',
      mode: 'zen',
    },
    {
      id: 'puzzle-1',
      completedAt: '2026-09-17T11:00:00Z',
      elapsedSeconds: 95,
      mistakesCount: 0,
      difficulty: 'easy',
      mode: 'zen',
    },
    {
      id: 'puzzle-1',
      completedAt: '2026-09-17T12:00:00Z',
      elapsedSeconds: 140,
      mistakesCount: 1,
      difficulty: 'easy',
      mode: 'challenge',
    },
    {
      id: 'puzzle-2',
      completedAt: '2026-09-17T13:00:00Z',
      elapsedSeconds: 200,
      mistakesCount: 0,
      difficulty: 'medium',
      mode: 'challenge',
    },
  ];

  const getBestTime = (puzzleId: string, mode?: 'zen' | 'challenge'): number | null => {
    const matches = records.filter(
      (r) => r.id === puzzleId && (mode === undefined || r.mode === mode),
    );
    if (matches.length === 0) return null;
    return Math.min(...matches.map((r) => r.elapsedSeconds));
  };

  const isPuzzleCompleted = (puzzleId: string, mode?: 'zen' | 'challenge'): boolean => {
    return records.some(
      (r) => r.id === puzzleId && (mode === undefined || r.mode === mode),
    );
  };

  it('computes best time separately for zen mode and challenge mode', () => {
    expect(getBestTime('puzzle-1', 'zen')).toBe(95);
    expect(getBestTime('puzzle-1', 'challenge')).toBe(140);
  });

  it('computes overall best time when mode is not specified', () => {
    expect(getBestTime('puzzle-1')).toBe(95);
  });

  it('returns null when no record exists for the given mode', () => {
    expect(getBestTime('puzzle-2', 'zen')).toBeNull();
    expect(getBestTime('puzzle-nonexistent', 'zen')).toBeNull();
  });

  it('checks puzzle completion status with optional mode filter', () => {
    expect(isPuzzleCompleted('puzzle-1', 'zen')).toBe(true);
    expect(isPuzzleCompleted('puzzle-1', 'challenge')).toBe(true);
    expect(isPuzzleCompleted('puzzle-2', 'zen')).toBe(false);
    expect(isPuzzleCompleted('puzzle-2', 'challenge')).toBe(true);
    expect(isPuzzleCompleted('puzzle-3')).toBe(false);
  });
});
