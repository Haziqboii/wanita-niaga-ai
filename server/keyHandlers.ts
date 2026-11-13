/**
 * WANITA NIAGA AI — Key Management Handlers & Credential Resolution
 *
 * Implements server-side endpoints for connecting, checking, and disconnecting
 * individual participant Gemini API keys, plus cookie-based credential resolution.
 */

import {
  encryptApiKey,
  decryptApiKey,
  generateSessionToken,
  hashSessionToken,
  maskApiKeyPreview,
} from './crypto.ts'
import {
  getActiveCredentialRepository,
  type CredentialRepository,
} from './credentialRepository.ts'
import { getGeminiApiKey } from './chatHandler.ts'

export const SESSION_COOKIE_NAME = 'wn_session'
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 days

/**
 * Controlled feature switch for participant-scoped key architecture.
 * Remains disabled by default until database persistence is validated.
 */
export function isParticipantFlowEnabled(): boolean {
  return process.env.ENABLE_PARTICIPANT_KEY_FLOW === 'true'
}

// In-memory sliding-window rate limiter for key connection attempts (max 5/min)
const connectionRateMap = new Map<string, { lastAttempt: number; count: number }>()

export function checkConnectionRateLimit(clientIp: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now()
  const rec = connectionRateMap.get(clientIp) || { lastAttempt: 0, count: 0 }
  if (now - rec.lastAttempt > 60000) {
    rec.count = 0
  }
  if (rec.count >= 5) {
    const waitSeconds = Math.ceil((60000 - (now - rec.lastAttempt)) / 1000)
    return { allowed: false, waitSeconds }
  }
  rec.lastAttempt = now
  rec.count += 1
  connectionRateMap.set(clientIp, rec)
  return { allowed: true }
}

/**
 * Validates Origin/CSRF header for state-changing endpoints.
 */
export function validateOrigin(originHeader?: string | null, hostHeader?: string | null): boolean {
  if (!originHeader || !hostHeader) return true
  try {
    const url = new URL(originHeader)
    return url.host === hostHeader
  } catch {
    return false
  }
}

/**
 * Validates basic Gemini API key syntax.
 * Supports legacy keys (e.g. starting with "AIza") and newer Google AI Studio
 * authorization keys (e.g. starting with "AQ" or "AQ.") as well as other
 * valid Google AI Studio key formats.
 */
export function isValidGeminiKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false
  const trimmed = key.trim()

  // Must satisfy length bounds for Google API keys / authorization tokens
  if (trimmed.length < 25 || trimmed.length > 256) {
    return false
  }

  // Must only contain valid URL-safe characters: letters, digits, underscore, hyphen, and dot
  if (!/^[A-Za-z0-9_.-]+$/.test(trimmed)) {
    return false
  }

  // Reject obvious non-Google provider keys
  if (/^(sk-|sk-ant-|hf_|ghp_|gho_|AKIA)/i.test(trimmed)) {
    return false
  }

  // Support officially supported Google Gemini key formats:
  // 1. Legacy Google API keys: "AIza..."
  // 2. Newer Google AI Studio authorization keys: "AQ..." (including "AQ....")
  return trimmed.startsWith('AIza') || trimmed.startsWith('AQ')
}

/**
 * Parses the session token from a standard HTTP Cookie header string.
 */
export function parseSessionCookie(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(';')
  for (const c of cookies) {
    const [name, ...valParts] = c.trim().split('=')
    if (name === SESSION_COOKIE_NAME || name === `__Host-${SESSION_COOKIE_NAME}`) {
      const val = valParts.join('=').trim()
      return val ? decodeURIComponent(val) : null
    }
  }
  return null
}

/**
 * Builds the Set-Cookie header string for a participant session.
 */
export function buildSessionCookie(token: string, isProduction = false): string {
  const cookieName = isProduction ? `__Host-${SESSION_COOKIE_NAME}` : SESSION_COOKIE_NAME
  const secureFlag = isProduction ? '; Secure' : ''
  return `${cookieName}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secureFlag}`
}

/**
 * Builds the Set-Cookie header string to clear a participant session upon disconnect.
 */
export function buildClearSessionCookie(isProduction = false): string {
  const cookieName = isProduction ? `__Host-${SESSION_COOKIE_NAME}` : SESSION_COOKIE_NAME
  const secureFlag = isProduction ? '; Secure' : ''
  return `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secureFlag}`
}

export interface ConnectKeyResult {
  success: boolean
  sessionToken?: string
  maskedPreview?: string
  error?: string
  status?: number
}

/**
 * Connects or updates a participant's Gemini API key.
 */
export async function handleConnectKey(
  rawKey: string,
  existingSessionToken?: string | null,
  repo: CredentialRepository = getActiveCredentialRepository()
): Promise<ConnectKeyResult> {
  const trimmed = (rawKey || '').trim()

  if (!trimmed) {
    return {
      success: false,
      error: 'Sila masukkan kunci API Gemini anda.',
      status: 400,
    }
  }

  if (!isValidGeminiKeyFormat(trimmed)) {
    return {
      success: false,
      error: 'Format kunci API tidak sah. Sila pastikan kunci adalah dari Google AI Studio (bermula dengan "AIza" atau "AQ").',
      status: 400,
    }
  }

  try {
    // If an existing valid session exists, revoke old connection first
    if (existingSessionToken) {
      try {
        const oldHash = hashSessionToken(existingSessionToken)
        await repo.deleteBySessionHash(oldHash)
      } catch {
        // ignore error during clean replacement
      }
    }

    const sessionToken = generateSessionToken()
    const sessionHash = hashSessionToken(sessionToken)
    const encrypted = encryptApiKey(trimmed)
    const maskedPreview = maskApiKeyPreview(trimmed)

    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString()

    await repo.saveCredential({
      sessionHash,
      encryptedKey: encrypted.ciphertext,
      keyIv: encrypted.iv,
      keyTag: encrypted.tag,
      maskedPreview,
      status: 'active',
      expiresAt,
    })

    return {
      success: true,
      sessionToken,
      maskedPreview,
    }
  } catch (err: any) {
    return {
      success: false,
      error: 'Gagal menyulitkan atau menyimpan kunci API secara selamat.',
      status: 500,
    }
  }
}

export interface CheckStatusResult {
  connected: boolean
  maskedPreview?: string
  expiresAt?: string
}

/**
 * Checks connection status using the session token.
 * Never returns plaintext API keys!
 */
export async function handleCheckKeyStatus(
  sessionToken?: string | null,
  repo: CredentialRepository = getActiveCredentialRepository()
): Promise<CheckStatusResult> {
  if (!sessionToken) {
    return { connected: false }
  }

  try {
    const sessionHash = hashSessionToken(sessionToken)
    const credential = await repo.findBySessionHash(sessionHash)

    if (!credential || credential.status !== 'active') {
      return { connected: false }
    }

    return {
      connected: true,
      maskedPreview: credential.maskedPreview,
      expiresAt: credential.expiresAt,
    }
  } catch {
    return { connected: false }
  }
}

/**
 * Disconnects and deletes a participant's key connection.
 */
export async function handleDisconnectKey(
  sessionToken?: string | null,
  repo: CredentialRepository = getActiveCredentialRepository()
): Promise<{ success: boolean; error?: string }> {
  if (!sessionToken) {
    return { success: true }
  }

  try {
    const sessionHash = hashSessionToken(sessionToken)
    await repo.deleteBySessionHash(sessionHash)
    return { success: true }
  } catch {
    return { success: false, error: 'Gagal memutuskan sambungan kunci.' }
  }
}

export interface ResolvedKeyResult {
  key: string | null
  isParticipantKey: boolean
  source: 'session' | 'legacy' | 'shared' | 'none'
  maskedPreview?: string
}

/**
 * Unified Credential Resolver for /api/chat and /api/extract-story.
 *
 * Priority:
 * 1. Verified participant session token (decrypts participant's own key).
 * 2. Legacy x-gemini-api-key header (for backward compatibility during migration).
 * 3. Shared application key (from environment, used only when participant flow is unauthenticated).
 *
 * CRITICAL RULE: If a participant provided a session token that is invalid/expired,
 * it returns key: null (source: 'session') and NEVER falls back to the shared application key!
 */
export async function resolveParticipantKey(
  sessionToken?: string | null,
  legacyHeaderKey?: string | null,
  repo: CredentialRepository = getActiveCredentialRepository()
): Promise<ResolvedKeyResult> {
  // 1. Participant session token provided
  if (sessionToken && sessionToken.trim()) {
    try {
      const sessionHash = hashSessionToken(sessionToken)
      const cred = await repo.findBySessionHash(sessionHash)
      if (cred && cred.status === 'active') {
        const decrypted = decryptApiKey({
          ciphertext: cred.encryptedKey,
          iv: cred.keyIv,
          tag: cred.keyTag,
        })
        return {
          key: decrypted,
          isParticipantKey: true,
          source: 'session',
          maskedPreview: cred.maskedPreview,
        }
      }
      // Session was supplied but is invalid/expired: do NOT fall back to shared key!
      return {
        key: null,
        isParticipantKey: true,
        source: 'session',
      }
    } catch {
      return {
        key: null,
        isParticipantKey: true,
        source: 'session',
      }
    }
  }

  // 2. Legacy header provided
  if (legacyHeaderKey && legacyHeaderKey.trim()) {
    return {
      key: legacyHeaderKey.trim(),
      isParticipantKey: true,
      source: 'legacy',
      maskedPreview: maskApiKeyPreview(legacyHeaderKey),
    }
  }

  // 3. Fallback to shared application key for workshop/dev demonstration
  // CRITICAL: When participant mode is enabled, do NOT fall back to shared application key!
  if (isParticipantFlowEnabled()) {
    return {
      key: null,
      isParticipantKey: true,
      source: 'none',
    }
  }

  const sharedKey = getGeminiApiKey()
  if (sharedKey) {
    return {
      key: sharedKey,
      isParticipantKey: false,
      source: 'shared',
    }
  }

  return {
    key: null,
    isParticipantKey: false,
    source: 'none',
  }
}
