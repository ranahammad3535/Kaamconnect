/**
 * utils/encryption.js — Encrypt & decrypt sensitive data (CNIC, phone)
 *
 * WHY encrypt?
 * - CNIC and phone are private personal data
 * - If someone hacks the database, they see scrambled text, not real numbers
 *
 * HOW it works:
 * - Uses Node.js built-in "crypto" module (AES-256-GCM)
 * - ENCRYPTION_KEY in .env must be exactly 32 characters
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // Initialization vector length

/**
 * Get 32-byte encryption key from .env
 */
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;

  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters in .env file');
  }

  return Buffer.from(key, 'utf-8');
};

/**
 * Encrypt plain text (e.g. CNIC or phone)
 * @param {string} plainText
 * @returns {string} encrypted string (safe to store in MongoDB)
 */
const encrypt = (plainText) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(String(plainText), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Store iv + authTag + encrypted data together (colon-separated)
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt encrypted text (for admin viewing only)
 * @param {string} encryptedText
 * @returns {string} original plain text
 */
const decrypt = (encryptedText) => {
  const key = getEncryptionKey();

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Create a one-way hash for uniqueness checks (CNIC, etc.)
 * We cannot use encrypted CNIC for unique index because encryption
 * uses a random IV — same CNIC would produce different ciphertext each time.
 *
 * @param {string} plainText
 * @returns {string} SHA-256 hash (safe to store for lookup only)
 */
const hashForLookup = (plainText) => {
  return crypto.createHash('sha256').update(String(plainText).trim()).digest('hex');
};

/**
 * Normalize CNIC — remove dashes so 35201-1234567-1 always hashes the same
 */
const normalizeCnic = (cnic) => String(cnic).replace(/-/g, '').trim();

/**
 * Hash CNIC for unique database lookup
 */
const hashCnic = (cnic) => hashForLookup(normalizeCnic(cnic));

module.exports = { encrypt, decrypt, hashCnic, normalizeCnic };
