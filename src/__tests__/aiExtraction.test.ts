import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleExtraction } from '../../server/extractionHandler'
import { extractSalesFromStory } from '../services/aiExtraction'
import { calculateSales } from '../calc/sales'
import { validateRecords } from '../data/validate'
import type { RawSale } from '../types'

describe('Phase 2B: Natural Language AI Data Extraction Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // 1. Correct extraction of the Karipap/Brownies example
  it('1. Correctly extracts Karipap and Brownies with quantities, prices and costs', async () => {
    const mockJson = JSON.stringify({
      hasSufficientData: true,
      clarificationMessage: '',
      operatingExpenses: null,
      records: [
        {
          produk: 'Karipap',
          kuantiti: 50,
          harga: 2.0,
          kos: 0.8,
          tarikh: null,
          saluran: null,
        },
        {
          produk: 'Brownies',
          kuantiti: 20,
          harga: 8.0,
          kos: 4.0,
          tarikh: null,
          saluran: null,
        },
      ],
    })

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, ...JSON.parse(mockJson) }),
    })
    global.fetch = mockFetch

    const result = await extractSalesFromStory(
      'Saya jual karipap RM2 satu. Semalam saya jual 50 biji. Brownies RM8 satu, terjual 20 biji. Kos karipap RM0.80 dan brownies RM4 sebiji.'
    )

    expect(result.success).toBe(true)
    expect(result.hasSufficientData).toBe(true)
    expect(result.records.length).toBe(2)

    const karipap = result.records.find((r) => r.produk === 'Karipap')
    expect(karipap).toBeDefined()
    expect(karipap?.kuantiti).toBe(50)
    expect(karipap?.harga).toBe(2.0)
    expect(karipap?.kos).toBe(0.8)

    const brownies = result.records.find((r) => r.produk === 'Brownies')
    expect(brownies).toBeDefined()
    expect(brownies?.kuantiti).toBe(20)
    expect(brownies?.harga).toBe(8.0)
    expect(brownies?.kos).toBe(4.0)

    // Profit terminology verification: Gross Profit (RM140) is calculated, Net Profit is null when opex is missing
    const { valid } = validateRecords(result.records)
    const calc = calculateSales(valid, result.operatingExpenses)
    expect(calc.totalRevenue).toBe(260.0)
    expect(calc.totalCost).toBe(120.0)
    expect(calc.grossProfit).toBe(140.0) // Untung Kasar
    expect(calc.operatingExpenses).toBe(null)
    expect(calc.estimatedNetProfit).toBe(null) // Anggaran Untung Bersih is null when expenses are missing
  })

  // 2. Missing costs remain missing (null, not 0)
  it('2. Missing costs remain null and do not create fake profits', async () => {
    const mockJson = JSON.stringify({
      hasSufficientData: true,
      clarificationMessage: '',
      operatingExpenses: null,
      records: [
        {
          produk: 'Karipap',
          kuantiti: 50,
          harga: 2.0,
          kos: null,
          tarikh: null,
          saluran: null,
        },
      ],
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, ...JSON.parse(mockJson) }),
    })

    const result = await extractSalesFromStory('Karipap RM2, terjual 50 biji.')
    expect(result.records[0].kos).toBe(null)

    // Pass into calculation engine
    const { valid } = validateRecords(result.records)
    const calc = calculateSales(valid)
    expect(calc.totalRevenue).toBe(100) // 50 * 2
    expect(calc.totalCost).toBe(null)
    expect(calc.grossProfit).toBe(null)
    expect(calc.hasCostData).toBe(false)
  })

  // 3. Missing quantities or prices trigger clarification
  it('3. General descriptions without quantities or prices trigger clarification', async () => {
    const mockJson = JSON.stringify({
      hasSufficientData: false,
      clarificationMessage:
        'Boleh Puan beritahu berapa bungkus nasi lemak dan kuih yang terjual serta harga seunit?',
      operatingExpenses: null,
      records: [],
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, ...JSON.parse(mockJson) }),
    })

    const result = await extractSalesFromStory('Saya jual nasi lemak dan kuih di pasar malam.')
    expect(result.hasSufficientData).toBe(false)
    expect(result.records.length).toBe(0)
    expect(result.clarificationMessage).toContain('Boleh Puan beritahu')
  })

  // 4. Services accepted as sales items without physical stock
  it('4. Services (e.g. Servis Jahit Baju) are accepted as valid sales items', async () => {
    const mockJson = JSON.stringify({
      hasSufficientData: true,
      clarificationMessage: '',
      operatingExpenses: null,
      records: [
        {
          produk: 'Servis Jahit Baju',
          kuantiti: 8,
          harga: 20.0,
          kos: null,
          tarikh: null,
          saluran: null,
        },
      ],
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, ...JSON.parse(mockJson) }),
    })

    const result = await extractSalesFromStory(
      'Saya buat servis jahit baju RM20 satu tempahan, minggu lepas dapat 8 tempahan.'
    )

    expect(result.success).toBe(true)
    expect(result.records.length).toBe(1)
    expect(result.records[0].produk).toBe('Servis Jahit Baju')
    expect(result.records[0].kuantiti).toBe(8)
    expect(result.records[0].harga).toBe(20.0)

    const { valid } = validateRecords(result.records)
    const calc = calculateSales(valid)
    expect(calc.totalRevenue).toBe(160) // 8 * 20
    expect(calc.totalKuantiti).toBe(8)
  })

  // 5. Operating expenses extracted when specified
  it('5. Operating expenses are extracted when explicitly specified by the user', async () => {
    const mockJson = JSON.stringify({
      hasSufficientData: true,
      clarificationMessage: '',
      operatingExpenses: 50.0,
      records: [
        {
          produk: 'Nasi Lemak',
          kuantiti: 40,
          harga: 3.0,
          kos: 1.5,
          tarikh: null,
          saluran: 'Booth',
        },
      ],
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, ...JSON.parse(mockJson) }),
    })

    const result = await extractSalesFromStory(
      'Saya jual nasi lemak RM3 sebungkus, laku 40 bungkus di gerai. Kos RM1.50 sebungkus dan sewa tapak RM50.'
    )

    expect(result.operatingExpenses).toBe(50.0)
    const { valid } = validateRecords(result.records)
    const calc = calculateSales(valid, result.operatingExpenses)
    // Revenue: 40 * 3 = 120, Cost: 40 * 1.5 = 60, Gross Profit: 60, Net Profit: 60 - 50 = 10
    expect(calc.totalRevenue).toBe(120)
    expect(calc.grossProfit).toBe(60)
    expect(calc.estimatedNetProfit).toBe(10)
  })

  // 6. Extracted values can be edited before confirming
  it('6. Extracted records can be edited manually before generating dashboard', () => {
    const extracted: RawSale[] = [
      { produk: 'Karipap', kuantiti: 50, harga: 2.0, kos: 0.8 },
    ]

    // User edits quantity from 50 to 60 and price from 2.0 to 2.50
    const edited: RawSale[] = [
      { ...extracted[0], kuantiti: 60, harga: 2.5 },
    ]

    const { valid } = validateRecords(edited)
    const calc = calculateSales(valid)
    expect(calc.totalRevenue).toBe(150) // 60 * 2.5
    expect(calc.totalKuantiti).toBe(60)
    expect(calc.grossProfit).toBe(150 - 60 * 0.8) // 150 - 48 = 102
  })

  // 7. Malformed AI output is handled gracefully without crashing
  it('7. Malformed server response produces understandable error message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Had penggunaan AI dicapai buat masa ini. Sila tunggu 1 minit.',
      }),
    })

    const result = await extractSalesFromStory('Saya jual kuih.')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Had penggunaan AI')
  })

  // 8. Server-side empty API key validation
  it('8. Server handler returns 503 error when GEMINI_API_KEY is not configured', async () => {
    const origKey = process.env.GEMINI_API_KEY
    process.env.GEMINI_API_KEY = 'NONE'

    const res = await handleExtraction('Saya jual karipap 50 biji RM2', 'test-ip')
    expect(res.success).toBe(false)
    expect(res.status).toBe(503)
    expect(res.error).toContain('Kunci API Gemini belum dikonfigurasi')

    process.env.GEMINI_API_KEY = origKey
  })
})
