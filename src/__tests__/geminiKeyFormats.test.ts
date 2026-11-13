import { describe, it, expect } from 'vitest'
import {
  isValidGeminiKeyFormat,
  handleConnectKey,
  resolveParticipantKey,
  handleCheckKeyStatus,
} from '../../server/keyHandlers'
import { maskApiKeyPreview } from '../../server/crypto'
import { InMemoryCredentialRepository } from '../../server/credentialRepository'

describe('WANITA NIAGA AI — Gemini API Key Format & Authorization Key Suite', () => {
  const repo = new InMemoryCredentialRepository()

  describe('1. isValidGeminiKeyFormat', () => {
    it('accepts legacy Google AI Studio keys starting with AIza (length >= 25)', () => {
      expect(isValidGeminiKeyFormat('AIzaSyDemoKey1234567890ABCDEF123456')).toBe(true)
      expect(isValidGeminiKeyFormat('AIzaSyB5e8X49kLmNoPqRsTuVwXyZ0123456789')).toBe(true)
    })

    it('accepts newer Google AI Studio keys starting with AQ', () => {
      expect(isValidGeminiKeyFormat('AQ1234567890abcdefghijklmnopqrstuvwxyz')).toBe(true)
      expect(isValidGeminiKeyFormat('AQ_ProjectKey_9876543210_abcdefghij')).toBe(true)
      expect(isValidGeminiKeyFormat('AQ-Hyphenated-Key-Format-1234567890')).toBe(true)
    })

    it('accepts newer AQ. authorization keys with dot delimiters', () => {
      expect(isValidGeminiKeyFormat('AQ.AbCdEf1234567890_test.xyz_Token99')).toBe(true)
      expect(isValidGeminiKeyFormat('AQ.auth_token.20261112.sub_key_123456789')).toBe(true)
    })

    it('rejects keys shorter than 25 characters', () => {
      expect(isValidGeminiKeyFormat('AIzaSyShort')).toBe(false)
      expect(isValidGeminiKeyFormat('AQ.ShortKey')).toBe(false)
      expect(isValidGeminiKeyFormat('AQ1234567890')).toBe(false)
    })

    it('rejects keys longer than 256 characters', () => {
      const longKey = 'AQ.' + 'A'.repeat(260)
      expect(isValidGeminiKeyFormat(longKey)).toBe(false)
    })

    it('rejects keys with illegal or unsafe characters', () => {
      expect(isValidGeminiKeyFormat('AQ.Key With Spaces 1234567890123')).toBe(false)
      expect(isValidGeminiKeyFormat('AIzaSyKey;DropTable;1234567890123')).toBe(false)
      expect(isValidGeminiKeyFormat('AQ.Key$Special%Chars!1234567890123')).toBe(false)
    })

    it('rejects non-Google API keys from other providers', () => {
      expect(isValidGeminiKeyFormat('sk-proj-1234567890abcdefghijklmnop')).toBe(false)
      expect(isValidGeminiKeyFormat('sk-ant-api03-abcdefghijklmnopqrstuv')).toBe(false)
      expect(isValidGeminiKeyFormat('hf_1234567890abcdefghijklmnopqrstuv')).toBe(false)
      expect(isValidGeminiKeyFormat('ghp_1234567890abcdefghijklmnopqrstuv')).toBe(false)
      expect(isValidGeminiKeyFormat('AKIA1234567890EXAMPLE1234567890')).toBe(false)
    })

    it('rejects empty, whitespace, null, or non-string values', () => {
      expect(isValidGeminiKeyFormat('')).toBe(false)
      expect(isValidGeminiKeyFormat('   ')).toBe(false)
      expect(isValidGeminiKeyFormat(null as any)).toBe(false)
      expect(isValidGeminiKeyFormat(undefined as any)).toBe(false)
      expect(isValidGeminiKeyFormat(1234567890123456789012345 as any)).toBe(false)
    })
  })

  describe('2. maskApiKeyPreview (Prefix-Agnostic Masking)', () => {
    it('correctly masks legacy AIza keys without hardcoding assumptions', () => {
      const masked = maskApiKeyPreview('AIzaSyDemoKey1234567890ABCD')
      expect(masked).toBe('AIzaSy...ABCD')
    })

    it('correctly masks newer AQ. keys preserving the AQ. prefix', () => {
      const masked = maskApiKeyPreview('AQ.1234567890testabcdef1234')
      expect(masked).toBe('AQ.123...1234')
      expect(masked).not.toContain('AIza')
    })

    it('correctly masks newer AQ keys without dot', () => {
      const masked = maskApiKeyPreview('AQKey1234567890testabcdef9999')
      expect(masked).toBe('AQKey1...9999')
      expect(masked).not.toContain('AIza')
    })

    it('handles short strings safely', () => {
      expect(maskApiKeyPreview('short')).toBe('••••••••')
      expect(maskApiKeyPreview('')).toBe('••••••••')
    })
  })

  describe('3. Key Connection, AES-256-GCM Storage & Credential Resolution', () => {
    it('connects a newer AQ. authorization key securely', async () => {
      const rawAqKey = 'AQ.ParticipantTestKey2026_November_12_SecureKey12345'
      const result = await handleConnectKey(rawAqKey, null, repo)

      expect(result.success).toBe(true)
      expect(result.sessionToken).toBeDefined()
      expect(result.maskedPreview).toBe('AQ.Par...2345')

      // Check status
      const status = await handleCheckKeyStatus(result.sessionToken, repo)
      expect(status.connected).toBe(true)
      expect(status.maskedPreview).toBe('AQ.Par...2345')

      // Resolve key for authorized request: decrypts exactly to original plaintext
      const resolved = await resolveParticipantKey(result.sessionToken, null, repo)
      expect(resolved.key).toBe(rawAqKey)
      expect(resolved.isParticipantKey).toBe(true)
      expect(resolved.source).toBe('session')
    })

    it('connects a legacy AIza key securely', async () => {
      const rawLegacyKey = 'AIzaSyLegacyParticipantKey1234567890XYZ'
      const result = await handleConnectKey(rawLegacyKey, null, repo)

      expect(result.success).toBe(true)
      expect(result.sessionToken).toBeDefined()
      expect(result.maskedPreview).toBe('AIzaSy...0XYZ')

      const resolved = await resolveParticipantKey(result.sessionToken, null, repo)
      expect(resolved.key).toBe(rawLegacyKey)
      expect(resolved.isParticipantKey).toBe(true)
      expect(resolved.source).toBe('session')
    })

    it('returns an informative error message that does not imply AIza is mandatory', async () => {
      const invalidRes = await handleConnectKey('sk-ant-non-google-key-1234567890', null, repo)

      expect(invalidRes.success).toBe(false)
      expect(invalidRes.status).toBe(400)
      expect(invalidRes.error).toContain('Format kunci API tidak sah')
      expect(invalidRes.error).toContain('Google AI Studio')
      // Mentions both supported formats
      expect(invalidRes.error).toContain('AIza')
      expect(invalidRes.error).toContain('AQ')
    })
  })
})
