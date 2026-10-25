import { describe, it, expect } from 'vitest';
import { ROOM_CODE_ALPHABET, generateRoomCode, sanitizeRoomCode } from '../../src/relay/code';

describe('generateRoomCode', () => {
  it('generates a code of default length 4', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(4);
  });

  it('generates a code of specified length', () => {
    expect(generateRoomCode(6)).toHaveLength(6);
    expect(generateRoomCode(8)).toHaveLength(8);
  });

  it('handles non-positive length safely', () => {
    expect(generateRoomCode(0)).toHaveLength(1);
    expect(generateRoomCode(-5)).toHaveLength(1);
  });

  it('uses only characters from ROOM_CODE_ALPHABET', () => {
    const allowed = new Set(ROOM_CODE_ALPHABET.split(''));
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode(6);
      for (const char of code) {
        expect(allowed.has(char)).toBe(true);
      }
    }
  });

  it('does not contain ambiguous characters (I, 1, O, 0)', () => {
    const ambiguous = ['I', '1', 'O', '0'];
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode(8);
      for (const char of ambiguous) {
        expect(code.includes(char)).toBe(false);
      }
    }
  });

  it('produces diverse codes without immediate collision', () => {
    const set = new Set<string>();
    for (let i = 0; i < 500; i++) {
      set.add(generateRoomCode(5));
    }
    // High entropy: in 500 codes with length 5 (30^5 = 24.3M), collisions should be 0 or near 0
    expect(set.size).toBeGreaterThanOrEqual(490);
  });
});

describe('sanitizeRoomCode', () => {
  it('trims and uppercases room code', () => {
    expect(sanitizeRoomCode('  xk89  ')).toBe('XK89');
    expect(sanitizeRoomCode('abc4')).toBe('ABC4');
  });

  it('normalizes and uppercases room code', () => {
    expect(sanitizeRoomCode('  xk-89_1  ')).toBe('XK-89_1');
  });

  it('handles empty or invalid inputs', () => {
    expect(sanitizeRoomCode('')).toBe('');
    expect(sanitizeRoomCode(null as any)).toBe('');
  });
});
