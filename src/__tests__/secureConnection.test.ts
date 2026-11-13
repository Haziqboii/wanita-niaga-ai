import { describe, it, expect, beforeEach } from 'vitest'
import {
  encryptApiKey,
  decryptApiKey,
  generateSessionToken,
  hashSessionToken,
  maskApiKeyPreview,
} from '../../server/crypto'
import {
  InMemoryCredentialRepository,
} from '../../server/credentialRepository'
import {
  handleConnectKey,
  handleCheckKeyStatus,
  handleDisconnectKey,
  resolveParticipantKey,
  parseSessionCookie,
  buildSessionCookie,
  buildClearSessionCookie,
  isValidGeminiKeyFormat,
} from '../../server/keyHandlers'
import { calculateSales } from '../calc/sales'
import type { ValidatedSale } from '../types'

describe('WANITA NIAGA AI — TASK 7B: Secure Gemini Connection Suite', () => {
  let repo: InMemoryCredentialRepository

  beforeEach(() => {
    repo = new InMemoryCredentialRepository()
  })

  it('1. Secure encryption/decryption roundtrip', () => {
    const originalKey = 'AIzaSyDemoValidSecretKey1234567890'
    expect(isValidGeminiKeyFormat(originalKey)).toBe(true)
    const encrypted = encryptApiKey(originalKey)

    expect(encrypted.ciphertext).toBeDefined()
    expect(encrypted.ciphertext).not.toBe(originalKey)
    expect(encrypted.iv).toHaveLength(24) // 12 bytes = 24 hex chars
    expect(encrypted.tag).toHaveLength(32) // 16 bytes = 32 hex chars

    const decrypted = decryptApiKey(encrypted)
    expect(decrypted).toBe(originalKey)
  })

  it('2. Invalid or tampered ciphertext fails with authentication error', () => {
    const originalKey = 'AIzaSyTamperTestKey1234567890'
    const encrypted = encryptApiKey(originalKey)

    // Tamper with one character in ciphertext
    const tamperedCiphertext =
      encrypted.ciphertext.substring(0, 4) +
      (encrypted.ciphertext[4] === 'a' ? 'b' : 'a') +
      encrypted.ciphertext.substring(5)

    expect(() =>
      decryptApiKey({
        ciphertext: tamperedCiphertext,
        iv: encrypted.iv,
        tag: encrypted.tag,
      })
    ).toThrow()

    // Tamper with auth tag
    const tamperedTag =
      encrypted.tag.substring(0, 4) +
      (encrypted.tag[4] === '0' ? '1' : '0') +
      encrypted.tag.substring(5)

    expect(() =>
      decryptApiKey({
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        tag: tamperedTag,
      })
    ).toThrow()
  })

  it('3. Session tokens are random, unique and hashed with SHA-256', () => {
    const token1 = generateSessionToken()
    const token2 = generateSessionToken()

    expect(token1).toHaveLength(64) // 32 bytes hex = 64 characters
    expect(token2).toHaveLength(64)
    expect(token1).not.toBe(token2)

    const hash1 = hashSessionToken(token1)
    const hash2 = hashSessionToken(token2)

    expect(hash1).toHaveLength(64)
    expect(hash1).not.toBe(token1)
    expect(hash1).not.toBe(hash2)

    // Deterministic hashing for identical token
    expect(hashSessionToken(token1)).toBe(hash1)
  })

  it('4. Participant A cannot access Participant B\'s credential', async () => {
    const keyA = 'AIzaSyParticipantAKey123456789'
    const keyB = 'AIzaSyParticipantBKey987654321'

    const resA = await handleConnectKey(keyA, null, repo)
    const resB = await handleConnectKey(keyB, null, repo)

    expect(resA.success).toBe(true)
    expect(resB.success).toBe(true)
    expect(resA.sessionToken).not.toBe(resB.sessionToken)

    // Resolving with Token A returns Key A
    const resolvedA = await resolveParticipantKey(resA.sessionToken, null, repo)
    expect(resolvedA.key).toBe(keyA)
    expect(resolvedA.isParticipantKey).toBe(true)

    // Resolving with Token B returns Key B
    const resolvedB = await resolveParticipantKey(resB.sessionToken, null, repo)
    expect(resolvedB.key).toBe(keyB)
    expect(resolvedB.isParticipantKey).toBe(true)

    // Token A cannot retrieve Key B
    expect(resolvedA.key).not.toBe(keyB)
  })

  it('5. Expired sessions are rejected', async () => {
    const expiredDate = new Date(Date.now() - 1000).toISOString() // 1 second ago
    const token = generateSessionToken()
    const sessionHash = hashSessionToken(token)
    const encrypted = encryptApiKey('AIzaSyExpiredSessionKey12345')

    await repo.saveCredential({
      sessionHash,
      encryptedKey: encrypted.ciphertext,
      keyIv: encrypted.iv,
      keyTag: encrypted.tag,
      maskedPreview: 'AIzaSy...2345',
      status: 'active',
      expiresAt: expiredDate,
    })

    const status = await handleCheckKeyStatus(token, repo)
    expect(status.connected).toBe(false)

    const resolved = await resolveParticipantKey(token, null, repo)
    expect(resolved.key).toBeNull()
    expect(resolved.isParticipantKey).toBe(true)
  })

  it('6. Disconnect revokes access and removes credential', async () => {
    const res = await handleConnectKey('AIzaSyDisconnectTestKey123456', null, repo)
    expect(res.success).toBe(true)

    // Verify connected
    const statusBefore = await handleCheckKeyStatus(res.sessionToken, repo)
    expect(statusBefore.connected).toBe(true)

    // Disconnect
    const discRes = await handleDisconnectKey(res.sessionToken, repo)
    expect(discRes.success).toBe(true)

    // Verify disconnected
    const statusAfter = await handleCheckKeyStatus(res.sessionToken, repo)
    expect(statusAfter.connected).toBe(false)

    const resolved = await resolveParticipantKey(res.sessionToken, null, repo)
    expect(resolved.key).toBeNull()
  })

  it('7. Key replacement invalidates previous connection cleanly', async () => {
    const key1 = 'AIzaSyFirstOldKey123456789'
    const key2 = 'AIzaSySecondReplacementKey987'

    // Connect first key
    const res1 = await handleConnectKey(key1, null, repo)
    const token1 = res1.sessionToken!

    // Replace with second key using existing session token
    const res2 = await handleConnectKey(key2, token1, repo)
    const token2 = res2.sessionToken!

    // Old token is invalidated
    const resolvedOld = await resolveParticipantKey(token1, null, repo)
    expect(resolvedOld.key).toBeNull()

    // New token retrieves the replacement key
    const resolvedNew = await resolveParticipantKey(token2, null, repo)
    expect(resolvedNew.key).toBe(key2)
  })

  it('8. No plaintext API key is returned by status endpoints', async () => {
    const secretKey = 'AIzaSyNeverExposePlaintextToClient123'
    const res = await handleConnectKey(secretKey, null, repo)

    // Connect response does not return plaintext key
    expect((res as any).apiKey).toBeUndefined()
    expect(res.maskedPreview).toBe(maskApiKeyPreview(secretKey))
    expect(res.maskedPreview).not.toContain('NeverExpose')

    // Status response does not return plaintext key
    const status = await handleCheckKeyStatus(res.sessionToken, repo)
    expect((status as any).apiKey).toBeUndefined()
    expect((status as any).key).toBeUndefined()
    expect(status.connected).toBe(true)
    expect(status.maskedPreview).toBe('AIzaSy...t123')
  })

  it('9. Cookie utilities configure HttpOnly, Path, and appropriate SameSite flags', () => {
    const token = 'sample-opaque-token-12345'

    // Development cookie
    const devCookie = buildSessionCookie(token, false)
    expect(devCookie).toContain('wn_session=sample-opaque-token-12345')
    expect(devCookie).toContain('HttpOnly')
    expect(devCookie).toContain('Path=/')
    expect(devCookie).toContain('SameSite=Lax')
    expect(devCookie).not.toContain('Secure')

    // Production cookie
    const prodCookie = buildSessionCookie(token, true)
    expect(prodCookie).toContain('__Host-wn_session=sample-opaque-token-12345')
    expect(prodCookie).toContain('Secure')
    expect(prodCookie).toContain('HttpOnly')

    // Parse cookie header
    const parsed = parseSessionCookie(`theme=dark; wn_session=${token}; lang=ms`)
    expect(parsed).toBe(token)

    // Clear cookie header
    const clearCookie = buildClearSessionCookie(false)
    expect(clearCookie).toContain('Max-Age=0')
  })

  it('10. Chat and extraction credential resolver uses intended participant session', async () => {
    const participantKey = 'AIzaSyParticipantSpecificSecret'
    const connectRes = await handleConnectKey(participantKey, null, repo)

    const resolved = await resolveParticipantKey(connectRes.sessionToken, null, repo)
    expect(resolved.key).toBe(participantKey)
    expect(resolved.isParticipantKey).toBe(true)
    expect(resolved.source).toBe('session')
  })

  it('11. Missing or invalid credentials cannot fall back to shared key in new participant flow', async () => {
    // When an invalid or expired participant session token is presented:
    const invalidToken = 'invalid-session-token-xyz'
    const resolved = await resolveParticipantKey(invalidToken, null, repo)

    // Must return null, NOT fallback to shared application key!
    expect(resolved.key).toBeNull()
    expect(resolved.isParticipantKey).toBe(true)
    expect(resolved.source).toBe('session')
  })

  it('12. Existing financial calculations and persistence remain unaffected', () => {
    const sampleRecords: ValidatedSale[] = [
      {
        produk: 'Karipap',
        kuantiti: 100,
        harga: 2.0,
        kos: 1.0,
        tarikh: '2026-09-01',
        saluran: 'Gerai',
        kategori: 'Makanan',
        kaedahBayaran: 'Tunai',
        lokasi: null,
        idTransaksi: null,
        masa: null,
        nota: null,
      },
    ]

    const result = calculateSales(sampleRecords, 50)
    expect(result.totalRevenue).toBe(200.0)
    expect(result.totalKuantiti).toBe(100)
    expect(result.grossProfit).toBe(100.0)
    expect(result.estimatedNetProfit).toBe(50.0)
  })
})
