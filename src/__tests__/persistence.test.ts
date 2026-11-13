import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import * as XLSX from 'xlsx'
import { autoDetectMapping, applyMapping, findHeaderRowIndex } from '../data/parse'
import { validateRecords } from '../data/validate'
import { calculateSales } from '../calc/sales'
import { filterSalesByMonth, extractAvailableMonths } from '../calc/monthly'
import {
  saveReportToStorage,
  getSavedReportFromStorage,
  clearSavedReportFromStorage,
  sanitizeStateForPersistence,
  generateReportId,
  resetInMemoryStorage,
  type SavedReportState,
} from '../data/storage'
import { getAssistantResponse } from '../services/aiAssistant'
import type { RawSale, ChatMessage } from '../types'

/**
 * Lightweight in-memory IndexedDB mock simulating browser persistence.
 */
function createMockIndexedDB(backingStore: Map<string, any> = new Map()) {
  return {
    open: vi.fn((_dbName: string, _version?: number) => {
      const request: any = {
        result: {
          objectStoreNames: {
            contains: vi.fn(() => true),
          },
          createObjectStore: vi.fn(),
          transaction: vi.fn(() => ({
            objectStore: vi.fn(() => ({
              put: vi.fn((val: any, key: string) => {
                const req: any = {}
                setTimeout(() => {
                  backingStore.set(key, JSON.parse(JSON.stringify(val)))
                  if (req.onsuccess) req.onsuccess()
                }, 0)
                return req
              }),
              get: vi.fn((key: string) => {
                const req: any = {}
                setTimeout(() => {
                  req.result = backingStore.has(key)
                    ? JSON.parse(JSON.stringify(backingStore.get(key)))
                    : undefined
                  if (req.onsuccess) req.onsuccess()
                }, 0)
                return req
              }),
              delete: vi.fn((key: string) => {
                const req: any = {}
                setTimeout(() => {
                  backingStore.delete(key)
                  if (req.onsuccess) req.onsuccess()
                }, 0)
                return req
              }),
            })),
          })),
        },
      }
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: request })
      }, 0)
      return request
    }),
  }
}

describe('WANITA NIAGA AI — TASK 6.2: Persistent Sales Data & AI Chat Suite', () => {
  let backingStore: Map<string, any>

  // Load the 600-record September & October 2026 fixture
  const fixturePath = path.resolve(
    process.cwd(),
    'src/__tests__/fixtures/Wanita_Niaga_AI_600_Rekod_Jualan_Sep_Okt_2026.xlsx'
  )
  const buf = fs.readFileSync(fixturePath)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  const headerRowIdx = findHeaderRowIndex(rows)
  const headers = rows[headerRowIdx].map((h: any) => String(h).trim()).filter(Boolean)
  const mapping = autoDetectMapping(headers)
  const rawRows: Record<string, unknown>[] = []
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const rowData = rows[i]
    if (!rowData || rowData.length === 0) continue
    const obj: Record<string, unknown> = {}
    headers.forEach((h, idx) => {
      obj[h] = rowData[idx] ?? ''
    })
    rawRows.push(obj)
  }
  const { records: fixtureRawSales } = applyMapping(rawRows, mapping)

  beforeEach(() => {
    resetInMemoryStorage()
    backingStore = new Map()
    const mockStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    // Configure window.indexedDB with simulated persistent backing store
    vi.stubGlobal('window', {
      indexedDB: createMockIndexedDB(backingStore),
      localStorage: mockStorage,
    })
    vi.stubGlobal('localStorage', mockStorage)
    vi.restoreAllMocks()
  })

  it('1. Excel sales import survives refresh', async () => {
    const reportId = generateReportId()
    const state: SavedReportState = {
      version: 1,
      reportId,
      updatedAt: new Date().toISOString(),
      records: fixtureRawSales.slice(0, 50),
      operatingExpenses: null,
      selectedMonth: 'ALL',
      isSampleData: false,
      page: 'dashboard',
      chatMessages: [],
    }

    const saved = await saveReportToStorage(state)
    expect(saved).toBe(true)

    // Simulate page reload
    const restored = await getSavedReportFromStorage()
    expect(restored).not.toBeNull()
    expect(restored?.records.length).toBe(50)
    expect(restored?.reportId).toBe(reportId)
    expect(restored?.records[0].produk).toBe(fixtureRawSales[0].produk)
  })

  it('2. All 600 records survive refresh', async () => {
    expect(fixtureRawSales.length).toBe(600)

    const state: SavedReportState = {
      version: 1,
      reportId: generateReportId(),
      updatedAt: new Date().toISOString(),
      records: fixtureRawSales,
      operatingExpenses: 500,
      selectedMonth: 'ALL',
      isSampleData: false,
      page: 'dashboard',
      chatMessages: [],
    }

    await saveReportToStorage(state)

    // Simulate page reload
    const restored = await getSavedReportFromStorage()
    expect(restored).not.toBeNull()
    expect(restored?.records.length).toBe(600)
    expect(restored?.operatingExpenses).toBe(500)
  })

  it('3. Financial totals remain unchanged after refresh', async () => {
    const { valid: validBefore } = validateRecords(fixtureRawSales)
    const resultBefore = calculateSales(validBefore, 500)

    const state: SavedReportState = {
      version: 1,
      reportId: generateReportId(),
      updatedAt: new Date().toISOString(),
      records: fixtureRawSales,
      operatingExpenses: 500,
      selectedMonth: 'ALL',
      isSampleData: false,
      page: 'dashboard',
      chatMessages: [],
    }
    await saveReportToStorage(state)

    // Simulate page refresh
    const restored = await getSavedReportFromStorage()
    const { valid: validAfter } = validateRecords(restored!.records)
    const resultAfter = calculateSales(validAfter, restored!.operatingExpenses)

    expect(resultAfter.totalRevenue).toBe(resultBefore.totalRevenue)
    expect(resultAfter.totalRevenue).toBe(41307.1)
    expect(resultAfter.totalKuantiti).toBe(resultBefore.totalKuantiti)
    expect(resultAfter.totalKuantiti).toBe(8141)
    expect(resultAfter.grossProfit).toBe(resultBefore.grossProfit)
    expect(resultAfter.grossProfit).toBe(22859.0)
    expect(resultAfter.estimatedNetProfit).toBe(22359.0)
  })

  it('4. Selected month survives refresh and maintains accurate filtered calculations', async () => {
    const state: SavedReportState = {
      version: 1,
      reportId: generateReportId(),
      updatedAt: new Date().toISOString(),
      records: fixtureRawSales,
      operatingExpenses: null,
      selectedMonth: '2026-09',
      isSampleData: false,
      page: 'dashboard',
      chatMessages: [],
    }
    await saveReportToStorage(state)

    // Refresh
    const restored = await getSavedReportFromStorage()
    expect(restored?.selectedMonth).toBe('2026-09')

    const { valid } = validateRecords(restored!.records)
    const sepRecords = filterSalesByMonth(valid, restored!.selectedMonth)
    const sepResult = calculateSales(sepRecords)

    expect(sepResult.recordCount).toBe(300)
    expect(sepResult.totalRevenue).toBe(17396.2)
    expect(sepResult.bestSeller?.produk).toBe('Karipap')
    expect(sepResult.bestSeller?.kuantiti).toBe(1274)
  })

  it('5. Chat history survives refresh with order, sender, and timestamps intact', async () => {
    const chatMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        text: 'Berapa jualan bulan September?',
        sender: 'user',
        timestamp: '10:15',
      },
      {
        id: 'msg-2',
        text: 'Jumlah jualan anda bagi bulan September 2026 ialah RM17,396.20.',
        sender: 'bot',
        timestamp: '10:15',
        isLocalCalculation: true,
      },
      {
        id: 'msg-3',
        text: 'Produk apa paling laris?',
        sender: 'user',
        timestamp: '10:16',
      },
      {
        id: 'msg-4',
        text: 'Produk paling laris ialah Karipap dengan 1,274 unit terjual.',
        sender: 'bot',
        timestamp: '10:16',
        isLocalCalculation: true,
      },
    ]

    const state: SavedReportState = {
      version: 1,
      reportId: generateReportId(),
      updatedAt: new Date().toISOString(),
      records: fixtureRawSales,
      operatingExpenses: null,
      selectedMonth: '2026-09',
      isSampleData: false,
      page: 'chat',
      chatMessages,
    }
    await saveReportToStorage(state)

    // Simulate refresh
    const restored = await getSavedReportFromStorage()
    expect(restored?.chatMessages.length).toBe(4)
    expect(restored?.chatMessages[0].text).toBe('Berapa jualan bulan September?')
    expect(restored?.chatMessages[1].sender).toBe('bot')
    expect(restored?.chatMessages[2].text).toBe('Produk apa paling laris?')
    expect(restored?.chatMessages[3].timestamp).toBe('10:16')
  })

  it('6. Chat history survives closing and reopening the browser', async () => {
    const chatMessages: ChatMessage[] = [
      {
        id: 'msg-prev',
        text: 'Bagaimana prestasi jualan saya?',
        sender: 'user',
        timestamp: '14:20',
      },
      {
        id: 'msg-reply',
        text: 'Prestasi perniagaan Puan amat memberangsangkan dengan jumlah RM41,307.10.',
        sender: 'bot',
        timestamp: '14:20',
      },
    ]

    await saveReportToStorage({
      version: 1,
      reportId: 'rpt_persistent_session',
      updatedAt: new Date().toISOString(),
      records: fixtureRawSales.slice(0, 10),
      operatingExpenses: null,
      selectedMonth: 'ALL',
      isSampleData: false,
      page: 'chat',
      chatMessages,
    })

    // Simulate closing and reopening browser: fresh window object, but same persistent IndexedDB backing store
    vi.stubGlobal('window', {
      indexedDB: createMockIndexedDB(backingStore),
    })

    const reopened = await getSavedReportFromStorage()
    expect(reopened).not.toBeNull()
    expect(reopened?.reportId).toBe('rpt_persistent_session')
    expect(reopened?.chatMessages.length).toBe(2)
    expect(reopened?.chatMessages[1].text).toContain('RM41,307.10')
  })

  it('7. Follow-up questions can reference previous conversation and restored business data', async () => {
    const { valid } = validateRecords(fixtureRawSales)
    const result = calculateSales(valid)
    const availableMonths = extractAvailableMonths(valid)

    const restoredChatMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        text: 'Berapa jualan Kek Batik?',
        sender: 'user',
        timestamp: '11:00',
      },
      {
        id: 'msg-2',
        text: 'Hasil jualan bagi Kek Batik ialah RM10,146.00 dengan 1,068 unit terjual.',
        sender: 'bot',
        timestamp: '11:00',
        isLocalCalculation: true,
      },
    ]

    // Mock fetch to simulate Gemini backend
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        answer: 'Kos seunit Kek Batik ialah RM4.20 dan untung kasar adalah RM5,660.40.',
        model: 'gemini-1.5-flash-lite',
      }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    const response = await getAssistantResponse(
      'Macam mana kamu kira?',
      result,
      restoredChatMessages,
      {
        selectedPeriod: 'Semua',
        allResult: result,
        allRecords: valid,
        availableMonths,
      }
    )

    expect(response.source).toBe('gemini')
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Verify previous conversation history was passed in request payload
    const requestBody = JSON.parse(fetchSpy.mock.calls[0][1].body)
    expect(requestBody.history.length).toBeGreaterThanOrEqual(2)
    expect(requestBody.history[0].text).toBe('Berapa jualan Kek Batik?')
    expect(requestBody.context.totalRevenue).toBe(41307.1)
  })

  it('8. Starting a new report does not mix data', async () => {
    // 1. Report A with records and chat history
    const stateA: SavedReportState = {
      version: 1,
      reportId: 'rpt_A',
      updatedAt: new Date().toISOString(),
      records: fixtureRawSales.slice(0, 20),
      operatingExpenses: 300,
      selectedMonth: '2026-09',
      isSampleData: false,
      page: 'dashboard',
      chatMessages: [
        {
          id: 'msg-A',
          text: 'Soalan untuk Laporan A',
          sender: 'user',
          timestamp: '09:00',
        },
      ],
    }
    await saveReportToStorage(stateA)

    // 2. Start new report: clear old storage
    await clearSavedReportFromStorage()

    // 3. Report B with fresh dataset and new ID
    const newSales: RawSale[] = [
      { produk: 'Nasi Minyak', kuantiti: 15, harga: 10, kos: 5, tarikh: '2026-11-01', saluran: 'Gerai' },
    ]
    const stateB: SavedReportState = {
      version: 1,
      reportId: 'rpt_B',
      updatedAt: new Date().toISOString(),
      records: newSales,
      operatingExpenses: null,
      selectedMonth: 'ALL',
      isSampleData: false,
      page: 'dashboard',
      chatMessages: [],
    }
    await saveReportToStorage(stateB)

    const restoredB = await getSavedReportFromStorage()
    expect(restoredB?.reportId).toBe('rpt_B')
    expect(restoredB?.records.length).toBe(1)
    expect(restoredB?.records[0].produk).toBe('Nasi Minyak')
    expect(restoredB?.chatMessages.length).toBe(0)
    expect(restoredB?.operatingExpenses).toBeNull()
  })

  it('9. Clearing saved data works correctly', async () => {
    await saveReportToStorage({
      version: 1,
      reportId: 'rpt_to_delete',
      updatedAt: new Date().toISOString(),
      records: fixtureRawSales.slice(0, 5),
      operatingExpenses: null,
      selectedMonth: 'ALL',
      isSampleData: false,
      page: 'dashboard',
      chatMessages: [],
    })

    const cleared = await clearSavedReportFromStorage()
    expect(cleared).toBe(true)

    const afterClear = await getSavedReportFromStorage()
    expect(afterClear).toBeNull()
  })

  it('10. Corrupted or unavailable browser storage does not crash the app', async () => {
    // Simulate corrupted IndexedDB that throws an exception upon open
    vi.stubGlobal('window', {
      indexedDB: {
        open: vi.fn(() => {
          throw new DOMException('Corrupted database file', 'UnknownError')
        }),
      },
    })

    const sampleState: SavedReportState = {
      version: 1,
      reportId: 'rpt_fallback',
      updatedAt: new Date().toISOString(),
      records: fixtureRawSales.slice(0, 3),
      operatingExpenses: null,
      selectedMonth: 'ALL',
      isSampleData: false,
      page: 'home',
      chatMessages: [],
    }

    // Should not throw or crash
    await expect(saveReportToStorage(sampleState)).resolves.not.toThrow()
    const fallbackRes = await getSavedReportFromStorage()
    expect(fallbackRes?.reportId).toBe('rpt_fallback')
  })

  it('11. No Gemini API requests occur simply from restoring state', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await saveReportToStorage({
      version: 1,
      reportId: 'rpt_silent_restore',
      updatedAt: new Date().toISOString(),
      records: fixtureRawSales,
      operatingExpenses: null,
      selectedMonth: 'ALL',
      isSampleData: false,
      page: 'dashboard',
      chatMessages: [
        {
          id: 'welcome',
          text: 'Salam sejahtera, Puan!',
          sender: 'bot',
          timestamp: '11:05',
        },
      ],
    })

    // Restore state
    const restored = await getSavedReportFromStorage()
    expect(restored).not.toBeNull()

    // Deterministic calculation
    const { valid } = validateRecords(restored!.records)
    const result = calculateSales(valid)
    expect(result.totalRevenue).toBe(41307.1)

    // Verify 0 Gemini API calls were made
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('12. No API keys are persisted', async () => {
    const maliciousOrAccidentalPayload: any = {
      version: 1,
      reportId: 'rpt_security_check',
      updatedAt: new Date().toISOString(),
      records: fixtureRawSales.slice(0, 2),
      operatingExpenses: null,
      selectedMonth: 'ALL',
      isSampleData: false,
      page: 'dashboard',
      chatMessages: [
        {
          id: 'msg-1',
          text: 'Hello',
          sender: 'user',
          timestamp: '12:00',
          apiKey: 'AIzaSyDoNotPersistThisKey',
        },
      ],
      apiKey: 'AIzaSyDoNotPersistTopLevelKey',
      geminiApiKey: 'secret-gemini-key',
      token: 'jwt.token.secret',
      secret: 'supersecret',
    }

    const sanitized = sanitizeStateForPersistence(maliciousOrAccidentalPayload)

    expect((sanitized as any).apiKey).toBeUndefined()
    expect((sanitized as any).geminiApiKey).toBeUndefined()
    expect((sanitized as any).token).toBeUndefined()
    expect((sanitized as any).secret).toBeUndefined()
    expect((sanitized.chatMessages[0] as any).apiKey).toBeUndefined()

    // Test saving
    await saveReportToStorage(maliciousOrAccidentalPayload)
    const stored = await getSavedReportFromStorage()
    expect((stored as any)?.apiKey).toBeUndefined()
    expect((stored as any)?.geminiApiKey).toBeUndefined()
    expect((stored as any)?.token).toBeUndefined()
  })
})
