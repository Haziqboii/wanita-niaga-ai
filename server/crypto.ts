/**
 * WANITA NIAGA AI — Secure Cryptographic Primitives
 *
 * Implements AES-256-GCM authenticated encryption and cryptographically secure
 * session token hashing for participant Gemini API keys.
 *
 * SECURITY INVARIANTS:
 * 1. Plaintext keys are NEVER persisted to disk or sent to client-side JS.
 * 2. AES-256-GCM provides both confidentiality and tamper detection (auth tag).
 * 3. Session tokens are 256-bit random hex strings; database only stores their SHA-256 hash.
 */

import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH_BYTES = 12 // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH_BYTES = 16 // 128-bit auth tag

// Default development key if CREDENTIAL_ENCRYPTION_KEY is not set in environment
const DEFAULT_DEV_KEY = 'wanita_niaga_ai_dev_secret_key_32_bytes!!'

/**
 * Derives a 32-byte Buffer key from environment variable or development fallback.
 */
export function getMasterEncryptionKey(overrideSecret?: string): Buffer {
  const secret = overrideSecret || process.env.CREDENTIAL_ENCRYPTION_KEY || DEFAULT_DEV_KEY
  return crypto.createHash('sha256').update(secret).digest()
}

export interface EncryptedPayload {
  ciphertext: string // hex
  iv: string // hex
  tag: string // hex
}

/**
 * Encrypts a plaintext Gemini API key using AES-256-GCM.
 */
export function encryptApiKey(plainKey: string, overrideSecret?: string): EncryptedPayload {
  if (!plainKey || typeof plainKey !== 'string') {
    throw new Error('Kunci API tidak sah untuk dienkripsi.')
  }

  const key = getMasterEncryptionKey(overrideSecret)
  const iv = crypto.randomBytes(IV_LENGTH_BYTES)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH_BYTES })

  let ciphertext = cipher.update(plainKey.trim(), 'utf8', 'hex')
  ciphertext += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return {
    ciphertext,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

/**
 * Decrypts an AES-256-GCM payload.
 * Throws an error if ciphertext or auth tag has been tampered with.
 */
export function decryptApiKey(payload: EncryptedPayload, overrideSecret?: string): string {
  if (!payload || !payload.ciphertext || !payload.iv || !payload.tag) {
    throw new Error('Data enkripsi tidak lengkap.')
  }

  const key = getMasterEncryptionKey(overrideSecret)
  const iv = Buffer.from(payload.iv, 'hex')
  const tag = Buffer.from(payload.tag, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH_BYTES })
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Generates an opaque, cryptographically random 256-bit session token (64 hex characters).
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Computes the SHA-256 hash of a session token for safe server-side storage and lookup.
 */
export function hashSessionToken(token: string): string {
  if (!token || typeof token !== 'string') {
    throw new Error('Token sesi tidak sah.')
  }
  return crypto.createHash('sha256').update(token.trim()).digest('hex')
}

/**
 * Produces a safe, masked preview of an API key (e.g. "AIzaSy...3F9Q").
 * Never reveals more than 6 characters at the start and 4 at the end.
 */
export function maskApiKeyPreview(apiKey: string): string {
  const trimmed = (apiKey || '').trim()
  if (trimmed.length < 12) {
    return '••••••••'
  }
  const start = trimmed.substring(0, 6)
  const end = trimmed.substring(trimmed.length - 4)
  return `${start}...${end}`
}
