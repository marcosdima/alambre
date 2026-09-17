import { describe, it, expect, beforeEach } from 'vitest';
import { getJson, setJson, removeJson, createStorage } from 'alambre';
import type { GameMode, Difficulty, GridState } from '../src/domain/types';

interface SavedSession {
  puzzleId: string;
  grid: GridState;
  strikethroughClues: string[];
  mistakesCount: number;
  elapsedSeconds: number;
  mode: GameMode;
  difficulty: Difficulty;
}

describe('game session persistence', () => {
  let memoryStorage: Record<string, string> = {};
  const mockStorage = createStorage({
    getItem: async (key) => memoryStorage[key] ?? null,
    setItem: async (key, val) => {
      memoryStorage[key] = val;
    },
    removeItem: async (key) => {
      delete memoryStorage[key];
    },
  });

  beforeEach(() => {
    memoryStorage = {};
  });

  it('saves and restores active game session', async () => {
    const session: SavedSession = {
      puzzleId: 'puzzle-terrace-gathering',
      grid: { 'friends:ana__pets:gato': 'tick' },
      strikethroughClues: ['c1'],
      mistakesCount: 1,
      elapsedSeconds: 45,
      mode: 'challenge',
      difficulty: 'easy',
    };

    await setJson(mockStorage, 'cross-logic.activeGame', session);

    const restored = await getJson<SavedSession>(mockStorage, 'cross-logic.activeGame');
    expect(restored).toEqual(session);
  });

  it('removes active game session upon completion', async () => {
    await setJson(mockStorage, 'cross-logic.activeGame', { test: true });
    await removeJson(mockStorage, 'cross-logic.activeGame');

    const result = await getJson(mockStorage, 'cross-logic.activeGame');
    expect(result).toBeNull();
  });
});
