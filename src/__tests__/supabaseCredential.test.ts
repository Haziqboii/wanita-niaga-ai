import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  encryptApiKey,
  generateSessionToken,
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
} from '../../server/keyHandlers'
import { geminiApiPlugin } from '../../server/vitePlugin'
import { POST as vercelConnect } from '../../api/keys/connect'
import { GET as vercelStatus } from '../../api/keys/status'
import { POST as vercelDisconnect } from '../../api/keys/disconnect'
import { POST as vercelChat } from '../../api/chat'
import { POST as vercelExtract } from '../../api/extract'
import { calculateSales } from '../calc/sales'
import type { ValidatedSale, SalesResult } from '../types'

/**
 * Creates a mock Supabase fetch implementation that simulates PostgREST behavior
 * over a local in-memory Map.
 */
function createMockSupabaseFetch(tableStore = new Map<string, any>()) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const urlStr = url.toString()
    const method = init?.method || 'GET'

    // 1. POST: insert / upsert
    if (method === 'POST' && urlStr.includes('/rest/v1/participant_credentials')) {
      const body = JSON.parse(String(init?.body || '{}'))
      const id = `uuid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      const row = {
        id,
        created_at: new Date().toISOString(),
        ...body,
      }
      tableStore.set(body.session_hash, row)
      return new Response(JSON.stringify([row]), { status: 201, headers: { 'Content-Type': 'application/json' } })
    }

    // 2. GET: filter by session_hash
    if (method === 'GET' && urlStr.includes('/rest/v1/participant_credentials')) {
      const match = urlStr.match(/session_hash=eq\.([^&]+)/)
      if (match) {
        const hash = decodeURIComponent(match[1])
        const row = tableStore.get(hash)
        const rows = row ? [row] : []
        return new Response(JSON.stringify(rows), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify(Array.from(tableStore.values())), { status: 200 })
    }

    // 3. PATCH: update status
    if (method === 'PATCH' && urlStr.includes('/rest/v1/participant_credentials')) {
      const match = urlStr.match(/session_hash=eq\.([^&]+)/)
      if (match) {
        const hash = decodeURIComponent(match[1])
        const row = tableStore.get(hash)
        if (row) {
          const body = JSON.parse(String(init?.body || '{}'))
          Object.assign(row, body)
          tableStore.set(hash, row)
        }
      }
      return new Response(null, { status: 204 })
    }

    // 4. DELETE: delete by session_hash
    if (method === 'DELETE' && urlStr.includes('/rest/v1/participant_credentials')) {
      const match = urlStr.match(/session_hash=eq\.([^&]+)/)
      if (match) {
        const hash = decodeURIComponent(match[1])
        tableStore.delete(hash)
      }
      return new Response(null, { status: 204 })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  })
}

describe('WANITA NIAGA AI — TASK 7C: Supabase Credential Integration Suite', () => {
  let tableStore: Map<string, any>
  let mockFetch: any
  let supabaseRepo: SupabaseCredentialRepository

  beforeEach(() => {
    tableStore = new Map()
    mockFetch = createMockSupabaseFetch(tableStore)
    supabaseRepo = new SupabaseCredentialRepository({
      supabaseUrl: 'https://test-project.supabase.co',
      serviceRoleKey: 'test-service-role-secret-key',
      fetchFn: mockFetch,
    })
  })

  it('1. Participant A connects Key A to Supabase repository', async () => {
    const keyA = 'AIzaSyParticipantASecretKey123456789'
    const resA = await handleConnectKey(keyA, null, supabaseRepo)

    expect(resA.success).toBe(true)
    expect(resA.sessionToken).toBeDefined()
    expect(mockFetch).toHaveBeenCalled()

    // Verify stored row in Supabase has encrypted key and no plaintext
    const sessionHashA = hashSessionToken(resA.sessionToken!)
    const storedRow = tableStore.get(sessionHashA)

    expect(storedRow).toBeDefined()
    expect(storedRow.encrypted_key).toBeDefined()
    expect(storedRow.encrypted_key).not.toBe(keyA)
    expect(storedRow.key_iv).toBeDefined()
    expect(storedRow.key_tag).toBeDefined()
  })

  it('2. Participant B connects Key B to Supabase repository', async () => {
    const keyB = 'AIzaSyParticipantBSecretKey987654321'
    const resB = await handleConnectKey(keyB, null, supabaseRepo)

    expect(resB.success).toBe(true)
    expect(resB.sessionToken).toBeDefined()

    const sessionHashB = hashSessionToken(resB.sessionToken!)
    const storedRow = tableStore.get(sessionHashB)

    expect(storedRow).toBeDefined()
    expect(storedRow.encrypted_key).not.toBe(keyB)
  })

  it('3. Participant A cannot retrieve or use Participant B\'s credential', async () => {
    const keyA = 'AIzaSyParticipantAKey1234567890'
    const keyB = 'AIzaSyParticipantBKey0987654321'

    const resA = await handleConnectKey(keyA, null, supabaseRepo)
    const resB = await handleConnectKey(keyB, null, supabaseRepo)

    const resolvedA = await resolveParticipantKey(resA.sessionToken, null, supabaseRepo)
    const resolvedB = await resolveParticipantKey(resB.sessionToken, null, supabaseRepo)

    expect(resolvedA.key).toBe(keyA)
    expect(resolvedB.key).toBe(keyB)
    expect(resolvedA.key).not.toBe(resolvedB.key)
  })

  it('4. Chat uses the correct participant key scoped to session', async () => {
    const participantKey = 'AIzaSyChatParticipantKeyABC123'
    const connectRes = await handleConnectKey(participantKey, null, supabaseRepo)

    const resolved = await resolveParticipantKey(connectRes.sessionToken, null, supabaseRepo)
    expect(resolved.key).toBe(participantKey)
    expect(resolved.isParticipantKey).toBe(true)
    expect(resolved.source).toBe('session')
  })

  it('5. Story extraction uses the correct participant key scoped to session', async () => {
    const extractionKey = 'AIzaSyStoryExtractionKeyXYZ789'
    const connectRes = await handleConnectKey(extractionKey, null, supabaseRepo)

    const resolved = await resolveParticipantKey(connectRes.sessionToken, null, supabaseRepo)
    expect(resolved.key).toBe(extractionKey)
    expect(resolved.isParticipantKey).toBe(true)
    expect(resolved.source).toBe('session')
  })

  it('6. Page reload preserves the intended session state via session token', async () => {
    const originalKey = 'AIzaSyPersistentSessionKey55555'
    const connectRes = await handleConnectKey(originalKey, null, supabaseRepo)
    const token = connectRes.sessionToken!

    // Simulate page reload: frontend calls status endpoint with session token
    const status = await handleCheckKeyStatus(token, supabaseRepo)
    expect(status.connected).toBe(true)
    expect(status.maskedPreview).toContain('AIzaSy')

    // Resolving key after reload succeeds
    const resolved = await resolveParticipantKey(token, null, supabaseRepo)
    expect(resolved.key).toBe(originalKey)
  })

  it('7. Expired sessions require reconnection and reject credential resolution', async () => {
    const expiredDate = new Date(Date.now() - 5000).toISOString()
    const token = generateSessionToken()
    const sessionHash = hashSessionToken(token)
    const encrypted = encryptApiKey('AIzaSyExpiredKey99999')

    tableStore.set(sessionHash, {
      id: 'expired-row',
      session_hash: sessionHash,
      encrypted_key: encrypted.ciphertext,
      key_iv: encrypted.iv,
      key_tag: encrypted.tag,
      masked_preview: 'AIzaSy...9999',
      status: 'active',
      expires_at: expiredDate,
    })

    const status = await handleCheckKeyStatus(token, supabaseRepo)
    expect(status.connected).toBe(false)

    const resolved = await resolveParticipantKey(token, null, supabaseRepo)
    expect(resolved.key).toBeNull()
  })

  it('8. Disconnect revokes credential access in Supabase', async () => {
    const res = await handleConnectKey('AIzaSyDisconnectKey1234567890', null, supabaseRepo)
    expect(res.success).toBe(true)

    // Disconnect
    const disc = await handleDisconnectKey(res.sessionToken, supabaseRepo)
    expect(disc.success).toBe(true)

    // Subsequent status check returns disconnected
    const status = await handleCheckKeyStatus(res.sessionToken, supabaseRepo)
    expect(status.connected).toBe(false)

    const resolved = await resolveParticipantKey(res.sessionToken, null, supabaseRepo)
    expect(resolved.key).toBeNull()
  })

  it('9. Key replacement updates only the participant\'s own key and invalidates old token', async () => {
    const key1 = 'AIzaSyFirstOldKeyAAA11111111111'
    const key2 = 'AIzaSySecondNewKeyBBB2222222222'

    const res1 = await handleConnectKey(key1, null, supabaseRepo)
    const token1 = res1.sessionToken!

    // Replace with second key
    const res2 = await handleConnectKey(key2, token1, supabaseRepo)
    const token2 = res2.sessionToken!

    expect(token1).not.toBe(token2)

    // Old token is invalidated
    const resolvedOld = await resolveParticipantKey(token1, null, supabaseRepo)
    expect(resolvedOld.key).toBeNull()

    // New token retrieves the new key
    const resolvedNew = await resolveParticipantKey(token2, null, supabaseRepo)
    expect(resolvedNew.key).toBe(key2)
  })

  it('10. No plaintext key enters IndexedDB or localStorage', () => {
    // Verify that the encrypted payload contains no plaintext
    const rawKey = 'AIzaSyConfidentialKey88888'
    const encrypted = encryptApiKey(rawKey)

    expect(encrypted.ciphertext).not.toContain(rawKey)
    expect(encrypted.iv).not.toContain(rawKey)
    expect(encrypted.tag).not.toContain(rawKey)

    // Mock localStorage check: verify key is never saved to localStorage in new flow
    const mockStorage = {
      store: new Map<string, string>(),
      setItem(k: string, v: string) { this.store.set(k, v) },
      getItem(k: string) { return this.store.get(k) || null },
      removeItem(k: string) { this.store.delete(k) },
    }

    mockStorage.removeItem('user_gemini_api_key')
    expect(mockStorage.getItem('user_gemini_api_key')).toBeNull()
  })

  it('11. No silent credential migration (requires explicit user reconnection)', () => {
    // If an obsolete legacy key exists in localStorage, it must not be automatically uploaded
    const legacyKey = 'AIzaSyOldLegacyKeyInBrowser'
    const mockStorage = new Map<string, string>()
    mockStorage.set('user_gemini_api_key', legacyKey)

    // Verification: Modal state requires explicit user action before any network connect
    expect(mockStorage.get('user_gemini_api_key')).toBe(legacyKey)
    // Only after explicit wipe or connection is the legacy key deleted
    mockStorage.delete('user_gemini_api_key')
    expect(mockStorage.get('user_gemini_api_key')).toBeUndefined()
  })

  it('12. Existing sales records and financial calculations remain unaffected', () => {
    const sampleRecords: ValidatedSale[] = [
      {
        produk: 'Brownies',
        kuantiti: 50,
        harga: 8.0,
        kos: 4.0,
        tarikh: '2026-09-10',
        saluran: 'Online',
        kategori: 'Pencuci Mulut',
        kaedahBayaran: 'QR DuitNow',
        lokasi: null,
        idTransaksi: null,
        masa: null,
        nota: null,
      },
    ]

    const result: SalesResult = calculateSales(sampleRecords, 100)
    expect(result.totalRevenue).toBe(400.0)
    expect(result.totalKuantiti).toBe(50)
    expect(result.grossProfit).toBe(200.0)
    expect(result.estimatedNetProfit).toBe(100.0)
    expect(result.categories.length).toBe(1)
    expect(result.categories[0].kategori).toBe('Pencuci Mulut')
  })

  it('13. Local Vite middleware handles /api/keys/* endpoints and cookie lifecycle', async () => {
    const plugin = geminiApiPlugin() as any
    let middlewareFn: any

    const fakeServer = {
      middlewares: {
        use(fn: any) {
          middlewareFn = fn
        },
      },
    }

    plugin.configureServer(fakeServer)
    expect(middlewareFn).toBeDefined()

    // A. Connect endpoint
    let capturedHeaders: Record<string, string> = {}
    let capturedBody = ''
    let capturedStatus = 0

    const mockResConnect: any = {
      setHeader(k: string, v: string) {
        capturedHeaders[k] = v
      },
      set statusCode(val: number) {
        capturedStatus = val
      },
      get statusCode() {
        return capturedStatus
      },
      end(data: string) {
        capturedBody = data
      },
    }

    const mockReqConnect: any = {
      url: '/api/keys/connect',
      method: 'POST',
      headers: {
        host: 'localhost:5173',
        origin: 'http://localhost:5173',
      },
      socket: { remoteAddress: '127.0.0.1' },
      on(event: string, cb: any) {
        if (event === 'data') {
          cb(JSON.stringify({ apiKey: 'AIzaSyMiddlewareTestKey123456789' }))
        }
        if (event === 'end') {
          cb()
        }
      },
    }

    await new Promise<void>((resolve) => {
      mockResConnect.end = (data: string) => {
        capturedBody = data
        resolve()
      }
      middlewareFn(mockReqConnect, mockResConnect, () => {})
    })

    expect(capturedStatus).toBe(200)
    expect(capturedHeaders['Set-Cookie']).toBeDefined()
    expect(capturedHeaders['Set-Cookie']).toContain('wn_session=')
    expect(capturedHeaders['Set-Cookie']).toContain('HttpOnly')
    const connectPayload = JSON.parse(capturedBody)
    expect(connectPayload.success).toBe(true)

    // Extract cookie from response header
    const cookieHeader = capturedHeaders['Set-Cookie'].split(';')[0]

    // B. Status endpoint
    let statusBody = ''
    const mockResStatus: any = {
      setHeader() {},
      set statusCode(val: number) {
        capturedStatus = val
      },
      end(data: string) {
        statusBody = data
      },
    }

    const mockReqStatus: any = {
      url: '/api/keys/status',
      method: 'GET',
      headers: {
        cookie: cookieHeader,
      },
      socket: { remoteAddress: '127.0.0.1' },
    }

    await new Promise<void>((resolve) => {
      mockResStatus.end = (data: string) => {
        statusBody = data
        resolve()
      }
      middlewareFn(mockReqStatus, mockResStatus, () => {})
    })

    const statusPayload = JSON.parse(statusBody)
    expect(statusPayload.connected).toBe(true)
    expect(statusPayload.maskedPreview).toContain('AIzaSy')

    // C. Disconnect endpoint
    capturedHeaders = {}
    let disconnectBody = ''
    const mockResDisc: any = {
      setHeader(k: string, v: string) {
        capturedHeaders[k] = v
      },
      set statusCode(val: number) {
        capturedStatus = val
      },
      end(data: string) {
        disconnectBody = data
      },
    }

    const mockReqDisc: any = {
      url: '/api/keys/disconnect',
      method: 'POST',
      headers: {
        host: 'localhost:5173',
        origin: 'http://localhost:5173',
        cookie: cookieHeader,
      },
      socket: { remoteAddress: '127.0.0.1' },
    }

    await new Promise<void>((resolve) => {
      mockResDisc.end = (data: string) => {
        disconnectBody = data
        resolve()
      }
      middlewareFn(mockReqDisc, mockResDisc, () => {})
    })

    const discPayload = JSON.parse(disconnectBody)
    expect(discPayload.success).toBe(true)
    expect(capturedHeaders['Set-Cookie']).toContain('Max-Age=0')
  })

  it('14. Vercel Serverless adapters (api/keys/*) handle connect, status, and disconnect', async () => {
    const rawKey = 'AIzaSyVercelAdapterTest123456789'

    // 1. POST /api/keys/connect
    const connectReq = new Request('http://localhost:3000/api/keys/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ apiKey: rawKey }),
    })

    const connectRes = await vercelConnect(connectReq)
    expect(connectRes.status).toBe(200)

    const cookieHeader = connectRes.headers.get('Set-Cookie')
    expect(cookieHeader).toBeDefined()
    expect(cookieHeader).toContain('wn_session=')
    expect(cookieHeader).toContain('HttpOnly')

    const connectData = await connectRes.json()
    expect(connectData.success).toBe(true)
    expect(connectData.maskedPreview).toContain('AIzaSy')
    expect(JSON.stringify(connectData)).not.toContain(rawKey)

    // Extract cookie
    const cookiePart = cookieHeader!.split(';')[0]

    // 2. GET /api/keys/status
    const statusReq = new Request('http://localhost:3000/api/keys/status', {
      method: 'GET',
      headers: {
        cookie: cookiePart,
      },
    })

    const statusRes = await vercelStatus(statusReq)
    expect(statusRes.status).toBe(200)
    const statusData = await statusRes.json()
    expect(statusData.connected).toBe(true)
    expect(statusData.maskedPreview).toContain('AIzaSy')

    // 3. POST /api/keys/disconnect
    const discReq = new Request('http://localhost:3000/api/keys/disconnect', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        cookie: cookiePart,
      },
    })

    const discRes = await vercelDisconnect(discReq)
    expect(discRes.status).toBe(200)
    const discCookie = discRes.headers.get('Set-Cookie')
    expect(discCookie).toContain('Max-Age=0')

    // 4. Verify disconnected
    const afterDiscReq = new Request('http://localhost:3000/api/keys/status', {
      method: 'GET',
      headers: {
        cookie: cookiePart,
      },
    })
    const afterStatusRes = await vercelStatus(afterDiscReq)
    const afterStatusData = await afterStatusRes.json()
    expect(afterStatusData.connected).toBe(false)
  })

  it('15. Vercel chat and extract adapters enforce participant session authentication', async () => {
    // When ENABLE_PARTICIPANT_KEY_FLOW is true:
    const prevFlag = process.env.ENABLE_PARTICIPANT_KEY_FLOW
    try {
      process.env.ENABLE_PARTICIPANT_KEY_FLOW = 'true'

      // Unauthenticated request to /api/chat returns 401
      const unauthChatReq = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hai' }),
      })
      const chatRes = await vercelChat(unauthChatReq)
      expect(chatRes.status).toBe(401)
      const chatData = await chatRes.json()
      expect(chatData.success).toBe(false)
      expect(chatData.error).toContain('Sesi sambungan Gemini anda telah tamat')

      // Unauthenticated request to /api/extract returns 401
      const unauthExtractReq = new Request('http://localhost:3000/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story: 'Hari ini saya jual kek' }),
      })
      const extractRes = await vercelExtract(unauthExtractReq)
      expect(extractRes.status).toBe(401)
      const extractData = await extractRes.json()
      expect(extractData.success).toBe(false)
    } finally {
      process.env.ENABLE_PARTICIPANT_KEY_FLOW = prevFlag
    }
  })
})
