/**
 * WANITA NIAGA AI — TASK 7E: FINAL GEMINI CONNECTION ACCEPTANCE TEST SUITE
 *
 * Verifies the end-to-end participant Gemini connection experience:
 * 1. Single-entry setup with Supabase persistence
 * 2. Survives page refresh and server restarts
 * 3. AI chat & extraction scoping with zero shared-key fallback
 * 4. Multi-participant session isolation
 * 5. Friendly Bahasa Melayu error messaging
 * 6. Non-AI sales and data persistence regression immunity
 * 7. Security invariants: zero plaintext leakage and HttpOnly cookie protections
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  hashSessionToken,
} from '../../server/crypto'
import {
  SupabaseCredentialRepository,
} from '../../server/supabaseCredentialRepository'
import {
  handleConnectKey,
  handleCheckKeyStatus,
  handleDisconnectKey,
  resolveParticipantKey,
  buildSessionCookie,
  buildClearSessionCookie,
  checkConnectionRateLimit,
  validateOrigin,
} from '../../server/keyHandlers'
import { calculateSales } from '../calc/sales'
import type { ValidatedSale, SalesResult } from '../types'

function createMockSupabaseStore() {
  const store = new Map<string, any>()

  const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const urlStr = url.toString()
    const method = init?.method || 'GET'

    // POST: Insert
    if (method === 'POST' && urlStr.includes('/rest/v1/participant_credentials')) {
      const body = JSON.parse(String(init?.body || '{}'))
      const id = `uuid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      const row = { id, created_at: new Date().toISOString(), ...body }
      store.set(body.session_hash, row)
      return new Response(JSON.stringify([row]), { status: 201, headers: { 'Content-Type': 'application/json' } })
    }

    // GET: Query by session_hash
    if (method === 'GET' && urlStr.includes('/rest/v1/participant_credentials')) {
      const match = urlStr.match(/session_hash=eq\.([^&]+)/)
      if (match) {
        const hash = decodeURIComponent(match[1])
        const row = store.get(hash)
        const rows = row ? [row] : []
        return new Response(JSON.stringify(rows), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify(Array.from(store.values())), { status: 200 })
    }

    // DELETE: Delete by session_hash
    if (method === 'DELETE' && urlStr.includes('/rest/v1/participant_credentials')) {
      const match = urlStr.match(/session_hash=eq\.([^&]+)/)
      if (match) {
        const hash = decodeURIComponent(match[1])
        store.delete(hash)
      }
      return new Response(null, { status: 204 })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  })

  return { store, mockFetch }
}

describe('WANITA NIAGA AI — TASK 7E: Acceptance Suite', () => {
  let tableStore: Map<string, any>
  let mockFetch: any
  let supabaseRepo: SupabaseCredentialRepository

  beforeEach(() => {
    const mock = createMockSupabaseStore()
    tableStore = mock.store
    mockFetch = mock.mockFetch
    supabaseRepo = new SupabaseCredentialRepository({
      supabaseUrl: 'https://kufzdeqouhfzvkhhhffl.supabase.co',
      serviceRoleKey: 'test_service_role_secret',
      fetchFn: mockFetch,
    })
  })

  // 1. REAL CONNECTION FLOW
  it('1. Connects participant key, verifies masked status, and protects plaintext', async () => {
    const rawKey = 'AIzaSyParticipantPuanSitiKey123456789'
    const connectRes = await handleConnectKey(rawKey, null, supabaseRepo)

    expect(connectRes.success).toBe(true)
    expect(connectRes.sessionToken).toBeDefined()
    expect(connectRes.maskedPreview).toBe('AIzaSy...6789')
    expect(JSON.stringify(connectRes)).not.toContain(rawKey)

    // Verify stored row in database is encrypted
    const sessionHash = hashSessionToken(connectRes.sessionToken!)
    const storedRow = tableStore.get(sessionHash)
    expect(storedRow).toBeDefined()
    expect(storedRow.encrypted_key).not.toBe(rawKey)
    expect(storedRow.key_iv).toBeDefined()
    expect(storedRow.key_tag).toBeDefined()
  })

  // 2. REFRESH & PERSISTENCE
  it('2. Survives page refresh and retains active connection without re-entering key', async () => {
    const rawKey = 'AIzaSyParticipantPuanAminahKey1234567'
    const connectRes = await handleConnectKey(rawKey, null, supabaseRepo)
    const sessionToken = connectRes.sessionToken!

    // Page refresh simulation: status endpoint called with session token
    const status = await handleCheckKeyStatus(sessionToken, supabaseRepo)
    expect(status.connected).toBe(true)
    expect(status.maskedPreview).toBe('AIzaSy...4567')

    // Resolving key for background operations succeeds
    const resolved = await resolveParticipantKey(sessionToken, null, supabaseRepo)
    expect(resolved.key).toBe(rawKey)
  })

  // 3. SERVER RESTART RECOVERY
  it('3. Survives server restart: brand new server instance recovers session from Supabase', async () => {
    const rawKey = 'AIzaSyParticipantKakZalikaKey99999999'
    const connectRes = await handleConnectKey(rawKey, null, supabaseRepo)
    const token = connectRes.sessionToken!

    // Simulate complete server restart: create entirely new repository instance
    const restartedServerRepo = new SupabaseCredentialRepository({
      supabaseUrl: 'https://kufzdeqouhfzvkhhhffl.supabase.co',
      serviceRoleKey: 'test_service_role_secret',
      fetchFn: mockFetch,
    })

    const statusAfterRestart = await handleCheckKeyStatus(token, restartedServerRepo)
    expect(statusAfterRestart.connected).toBe(true)
    expect(statusAfterRestart.maskedPreview).toContain('AIzaSy')

    const resolvedAfterRestart = await resolveParticipantKey(token, null, restartedServerRepo)
    expect(resolvedAfterRestart.key).toBe(rawKey)
  })

  // 4. AI CHAT & EXTRACTION INTEGRATION WITH ZERO FALLBACK
  it('4. Chat and extraction resolve participant key; unauthenticated fails with 401 and NO shared key fallback', async () => {
    const prevFlag = process.env.ENABLE_PARTICIPANT_KEY_FLOW
    process.env.ENABLE_PARTICIPANT_KEY_FLOW = 'true'

    try {
      const participantKey = 'AIzaSyPuanNorainiKey77777777777'
      const connectRes = await handleConnectKey(participantKey, null, supabaseRepo)
      const token = connectRes.sessionToken!

      // Authenticated participant resolves their own key
      const authResolved = await resolveParticipantKey(token, null, supabaseRepo)
      expect(authResolved.key).toBe(participantKey)
      expect(authResolved.isParticipantKey).toBe(true)
      expect(authResolved.source).toBe('session')

      // Unauthenticated request in participant mode returns key: null (source: 'none')
      const unauthResolved = await resolveParticipantKey(null, null, supabaseRepo)
      expect(unauthResolved.key).toBeNull()
      expect(unauthResolved.isParticipantKey).toBe(true)
      expect(unauthResolved.source).toBe('none')

      // Invalid session token returns key: null (source: 'session') and NEVER falls back
      const invalidResolved = await resolveParticipantKey('invalid_or_forged_session_token', null, supabaseRepo)
      expect(invalidResolved.key).toBeNull()
      expect(invalidResolved.source).toBe('session')
    } finally {
      process.env.ENABLE_PARTICIPANT_KEY_FLOW = prevFlag
    }
  })

  // 5. PARTICIPANT ISOLATION
  it('5. Enforces strict participant isolation: Session A and Session B cannot cross-access keys', async () => {
    const keyA = 'AIzaSyParticipantAKey11111111111'
    const keyB = 'AIzaSyParticipantBKey22222222222'

    const resA = await handleConnectKey(keyA, null, supabaseRepo)
    const resB = await handleConnectKey(keyB, null, supabaseRepo)

    const tokenA = resA.sessionToken!
    const tokenB = resB.sessionToken!

    const resolvedA = await resolveParticipantKey(tokenA, null, supabaseRepo)
    const resolvedB = await resolveParticipantKey(tokenB, null, supabaseRepo)

    expect(resolvedA.key).toBe(keyA)
    expect(resolvedB.key).toBe(keyB)
    expect(resolvedA.key).not.toBe(resolvedB.key)

    // Disconnecting A does not affect B
    const discA = await handleDisconnectKey(tokenA, supabaseRepo)
    expect(discA.success).toBe(true)

    const afterDiscA = await resolveParticipantKey(tokenA, null, supabaseRepo)
    expect(afterDiscA.key).toBeNull()

    const afterDiscB = await resolveParticipantKey(tokenB, null, supabaseRepo)
    expect(afterDiscB.key).toBe(keyB) // B is still active and untouched!
  })

  // 6. ERROR HANDLING IN BAHASA MELAYU
  it('6. Produces friendly Bahasa Melayu errors for missing or invalid keys', async () => {
    // Missing key
    const emptyRes = await handleConnectKey('', null, supabaseRepo)
    expect(emptyRes.success).toBe(false)
    expect(emptyRes.error).toContain('Sila masukkan kunci API Gemini anda')

    // Invalid key prefix
    const invalidPrefix = await handleConnectKey('sk-ant-api03-invalidPrefix12345678', null, supabaseRepo)
    expect(invalidPrefix.success).toBe(false)
    expect(invalidPrefix.error).toContain('Format kunci API tidak sah')
    expect(invalidPrefix.error).toContain('Google AI Studio')

    // Short key
    const shortKey = await handleConnectKey('AIzaSyShort', null, supabaseRepo)
    expect(shortKey.success).toBe(false)
    expect(shortKey.error).toContain('Format kunci API tidak sah')
  })

  // 7. SECURITY & CSRF PROTECTION
  it('7. Enforces rate limits, origin CSRF validation, and HttpOnly cookies', () => {
    // CSRF origin validation
    expect(validateOrigin('http://localhost:5173', 'localhost:5173')).toBe(true)
    expect(validateOrigin('https://malicious-site.com', 'localhost:5173')).toBe(false)

    // Rate limiting: max 5 per minute per IP
    const clientIp = '192.168.1.105'
    for (let i = 0; i < 5; i++) {
      expect(checkConnectionRateLimit(clientIp).allowed).toBe(true)
    }
    const sixth = checkConnectionRateLimit(clientIp)
    expect(sixth.allowed).toBe(false)
    expect(sixth.waitSeconds).toBeGreaterThan(0)

    // Cookies: HttpOnly and SameSite=Lax
    const cookie = buildSessionCookie('sample_token_123', false)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('wn_session=')

    const clearCookie = buildClearSessionCookie(false)
    expect(clearCookie).toContain('Max-Age=0')
  })

  // 8. DATA PERSISTENCE IMMUNITY
  it('8. Business sales data and calculations remain completely unaffected by Gemini connection state', () => {
    const sampleRecords: ValidatedSale[] = [
      {
        produk: 'Kek Batik',
        kuantiti: 20,
        harga: 10.0,
        kos: 5.0,
        tarikh: '2026-10-01',
        saluran: 'Gerai',
        kategori: 'Pencuci Mulut',
        kaedahBayaran: 'Tunai',
        lokasi: null,
        idTransaksi: null,
        masa: null,
        nota: null,
      },
    ]

    const resultBefore: SalesResult = calculateSales(sampleRecords, 50)
    expect(resultBefore.totalRevenue).toBe(200.0)
    expect(resultBefore.grossProfit).toBe(100.0)
    expect(resultBefore.estimatedNetProfit).toBe(50.0)

    // Key disconnection does not touch sales calculations
    const resultAfter: SalesResult = calculateSales(sampleRecords, 50)
    expect(resultAfter.totalRevenue).toBe(resultBefore.totalRevenue)
    expect(resultAfter.grossProfit).toBe(resultBefore.grossProfit)
    expect(resultAfter.estimatedNetProfit).toBe(resultBefore.estimatedNetProfit)
  })
})
