// @ts-nocheck
/**
 * AES-256-GCM Encryption Utilities
 * 
 * Security Standards:
 * - Uses Web Crypto API for cryptographic operations
 * - AES-256-GCM for authenticated encryption
 * - PBKDF2 for key derivation
 * - Random IV for each encryption operation
 * - Never logs sensitive data
 */

import { z } from 'zod';

// Validation schemas
const EncryptedDataSchema = z.object({
    iv: z.string(),
    data: z.string(),
    salt: z.string(),
});

export type EncryptedData = z.infer<typeof EncryptedDataSchema>;

/**
 * Derives a cryptographic key from the encryption secret
 */
async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    // @ts-ignore - TypeScript overload mismatch with crypto types in this environment
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts a string using AES-256-GCM
 * 
 * @param plaintext - The string to encrypt
 * @returns Encrypted data with IV and salt
 * @throws Error if ENCRYPTION_SECRET is not set
 */
export async function encrypt(plaintext: string): Promise<EncryptedData> {
    const secret = process.env.ENCRYPTION_SECRET;

    if (!secret) {
        throw new Error('ENCRYPTION_SECRET environment variable is not set');
    }

    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from secret
    const key = await deriveKey(secret, salt);

    // Encrypt the data
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plaintext);

    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv,
        },
        key,
        encodedData
    );

    // Convert to base64 for storage
    const encryptedArray = new Uint8Array(encryptedBuffer);

    return {
        iv: Buffer.from(iv).toString('base64'),
        data: Buffer.from(encryptedArray).toString('base64'),
        salt: Buffer.from(salt).toString('base64'),
    };
}

/**
 * Decrypts data encrypted with the encrypt function
 * 
 * @param encryptedData - The encrypted data object
 * @returns The decrypted plaintext string
 * @throws Error if decryption fails or ENCRYPTION_SECRET is not set
 */
export async function decrypt(encryptedData: EncryptedData): Promise<string> {
    // Validate input
    const validated = EncryptedDataSchema.parse(encryptedData);

    const secret = process.env.ENCRYPTION_SECRET;

    if (!secret) {
        throw new Error('ENCRYPTION_SECRET environment variable is not set');
    }

    // Convert from base64
    const iv = new Uint8Array(Buffer.from(validated.iv, 'base64'));
    const data = new Uint8Array(Buffer.from(validated.data, 'base64'));
    const salt = new Uint8Array(Buffer.from(validated.salt, 'base64'));

    // Derive the same key
    const key = await deriveKey(secret, salt);

    // Decrypt
    try {
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv,
            },
            key,
            data
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (error) {
        throw new Error('Decryption failed - data may be corrupted or key is incorrect');
    }
}

/**
 * Utility to safely log encrypted data (never logs the actual plaintext)
 */
export function safeLogEncrypted(label: string, encrypted: EncryptedData): void {
    console.log(`[ENCRYPTED] ${label}:`, {
        ivLength: encrypted.iv.length,
        dataLength: encrypted.data.length,
        saltLength: encrypted.salt.length,
    });
}
