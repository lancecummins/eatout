/**
 * Generate and validate join codes for sessions
 */

const CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like 0, O, 1, I
const CODE_LENGTH = 6;

/**
 * Generate a random join code
 */
export function generateJoinCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    code += CHARACTERS[randomIndex];
  }
  return code;
}

/**
 * Validate a join code format
 */
export function isValidJoinCode(code: string): boolean {
  if (!code || code.length !== CODE_LENGTH) {
    return false;
  }

  return code.split('').every(char => CHARACTERS.includes(char.toUpperCase()));
}

/**
 * Format a join code for display (e.g., ABC-123)
 */
export function formatJoinCode(code: string): string {
  if (!code || code.length !== CODE_LENGTH) {
    return code;
  }

  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Clean a join code (remove hyphens, convert to uppercase)
 */
export function cleanJoinCode(code: string): string {
  return code.replace(/[-\s]/g, '').toUpperCase();
}
