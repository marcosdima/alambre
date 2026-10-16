/**
 * Unambiguous character set excluding easily confused glyphs:
 * - I and 1
 * - O and 0
 */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generates an unambiguous, compact alphanumeric room code.
 *
 * Uses cryptographically secure random values when available in global scope,
 * falling back safely to Math.random() in resource-constrained environments.
 *
 * @param length Length of code to generate. Defaults to 4 (approx 810,000 combinations).
 */
export function generateRoomCode(length = 4): string {
  const codeLen = Math.max(1, Math.floor(length));
  const chars = ROOM_CODE_ALPHABET;
  const alphabetLen = chars.length;

  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(codeLen);
    globalThis.crypto.getRandomValues(bytes);
    let result = "";
    for (let i = 0; i < codeLen; i++) {
      result += chars.charAt(bytes[i] % alphabetLen);
    }
    return result;
  }

  let result = "";
  for (let i = 0; i < codeLen; i++) {
    result += chars.charAt(Math.floor(Math.random() * alphabetLen));
  }
  return result;
}

/**
 * Normalizes, strips whitespace and uppercase-sanitizes a room code.
 */
export function sanitizeRoomCode(code: string): string {
  if (!code || typeof code !== "string") return "";
  return code.trim().toUpperCase();
}
