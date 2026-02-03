import { randomBytes, createHash } from 'crypto';

/**
 * Generates a secure API key with a given prefix.
 * Format: {prefix}_{32_random_hex_chars}
 */
export function generateApiKey(prefix: string = 'sk_automail'): string {
    const random = randomBytes(24).toString('hex'); // 48 chars hex
    return `${prefix}_${random}`;
}

/**
 * Hashes an API key using SHA-256 for secure storage.
 */
export function hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
}

/**
 * Validates a key against a stored hash.
 */
export function validateApiKey(key: string, hash: string): boolean {
    const computedHash = hashApiKey(key);
    return computedHash === hash;
}
