import crypto from 'crypto';

/**
 * Hashes a plaintext password using Node.js scrypt with a unique random salt.
 * Produces format: <salt_hex>:<hash_hex>
 */
export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
};

/**
 * Verifies a plaintext password against a stored scrypt hash in a timing-safe manner.
 */
export const verifyPassword = (password: string, storedHash: string): boolean => {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;

    const [salt, expectedHashHex] = parts;
    if (!salt || !expectedHashHex) return false;

    const derivedKey = crypto.scryptSync(password, salt, 64);
    const expectedBuffer = Buffer.from(expectedHashHex, 'hex');

    if (derivedKey.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedKey, expectedBuffer);
  } catch {
    return false;
  }
};
