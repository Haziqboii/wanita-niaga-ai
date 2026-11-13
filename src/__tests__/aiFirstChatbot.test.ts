import { describe, it, expect, vi, beforeEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import * as XLSX from 'xlsx'
import { getAssistantResponse, tryLocalCalculation } from '../services/aiAssistant'
import { calculateSales } from '../calc/sales'
import { validateRecords } from '../data/validate'
import { autoDetectMapping, applyMapping, findHeaderRowIndex } from '../data/parse'
import { buildSystemInstruction } from '../../server/chatHandler'
import type { SalesResult, ChatMessage } from '../types'

describe('Task 3: AI-First Chatbot with Verified Business Data', () => {
  let smeResult: SalesResult

  beforeEach(() => {
    vi.restoreAllMocks()

    // Load 1,000-row SME test dataset
    const fixturePath = path.resolve(process.cwd(), 'src/__tests__/fixtures/Wanita_Niaga_AI_1000_Rekod_Jualan_SME_Sep_Okt_2026.xlsx')
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
      headers.forEach((h, idx) => { obj[h] = rowData[idx] ?? '' })
      rawRows.push(obj)
    }
    const { records } = applyMapping(rawRows, mapping)
    const { valid } = validateRecords(records)
    smeResult = calculateSales(valid)
  })

  // TEST A: Numerical lookup
  it('TEST A: "Berapa untung kasar Brownies?" returns fast, deterministic numerical answer', async () => {
    const res = await getAssistantResponse('Berapa untung kasar Brownies?', smeResult)
    expect(res.isLocalCalculation).toBe(true)
    expect(res.source).toBe('local')
    expect(res.answer).toContain('Brownies')
    expect(res.answer).toContain('RM2,556.40')
    expect(res.answer).toContain('RM4,928.00')
  })

  // TEST B: Calculation explanation routes to Gemini with full product formula context
  it('TEST B: "Macam mana kamu kira untung kasar Brownies?" routes to Gemini with verified unit calculations', async () => {
    let capturedBody: any = null
    const mockFetch = vi.fn().mockImplementation((_url, opts) => {
      capturedBody = JSON.parse(opts.body)
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          answer:
            'Untung kasar Brownies dikira dengan menolak kos produk daripada hasil jualan:\n\n' +
            'Jualan: 616 unit × RM8.00 = RM4,928.00\n' +
            'Kos produk: 616 unit × RM3.85 = RM2,371.60\n' +
            'Untung kasar: RM4,928.00 − RM2,371.60 = RM2,556.40.',
          model: 'gemini-3.5-flash-lite',
        }),
      })
    })
    global.fetch = mockFetch

    const res = await getAssistantResponse(
      'Macam mana kamu kira untung kasar Brownies?',
      smeResult
    )

    // Must NOT be intercepted by local numerical calculation
    expect(res.isLocalCalculation).toBe(false)
    expect(res.source).toBe('gemini')
    expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.anything())

    // Verify context sent to backend
    expect(capturedBody.context.recordCount).toBe(1000)
    const browniesCtx = capturedBody.context.products.find((p: any) => p.produk === 'Brownies')
    expect(browniesCtx).toBeDefined()
    expect(browniesCtx.kuantiti).toBe(616)
    expect(browniesCtx.revenue).toBe(4928)
    expect(browniesCtx.cost).toBe(2371.6)
    expect(browniesCtx.grossProfit).toBe(2556.4)
    expect(browniesCtx.avgPrice).toBe(8)
    expect(browniesCtx.avgCost).toBe(3.85)

    // Verify prompt instructions built for Gemini
    const prompt = buildSystemInstruction(capturedBody.context)
    expect(prompt).toContain('SENARAI PRODUK DISAHKAN')
    expect(prompt).toContain('Brownies: 616 unit, Jualan: RM4928.00 (RM8.00 seunit), Kos: RM2371.60 (RM3.85 seunit), Untung Kasar: RM2556.40')
    expect(prompt).toContain('Untung Kasar = Hasil Jualan − Jumlah Kos Produk')
  })

  // TEST C: Data provenance question
  it('TEST C: "Data apa yang digunakan?" routes to Gemini with provenance instructions', async () => {
    let capturedBody: any = null
    const mockFetch = vi.fn().mockImplementation((_url, opts) => {
      capturedBody = JSON.parse(opts.body)
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          answer:
            'Kiraan ini menggunakan data yang direkodkan bagi produk Brownies: kuantiti terjual (616 unit), harga jualan seunit (RM8.00), dan kos modal seunit (RM3.85).',
          model: 'gemini-3.5-flash-lite',
        }),
      })
    })
    global.fetch = mockFetch

    const history: ChatMessage[] = [
      { id: '1', sender: 'user', text: 'Berapa untung kasar Brownies?', timestamp: '1' },
      { id: '2', sender: 'bot', text: 'RM2,556.40', timestamp: '2' },
    ]

    const res = await getAssistantResponse('Data apa yang digunakan?', smeResult, history)
    expect(res.isLocalCalculation).toBe(false)
    expect(res.source).toBe('gemini')

    // Verify history was passed to preserve conversational context
    expect(capturedBody.history.length).toBe(2)
    expect(capturedBody.history[0].text).toBe('Berapa untung kasar Brownies?')
  })

  // TEST D: Hypothetical scenario question
  it('TEST D: "Kalau saya naikkan harga Brownies RM1, apa jadi?" routes to Gemini', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        answer:
          'Jika Puan naikkan harga Brownies sebanyak RM1 (kepada RM9.00 seunit), dengan andaian jualan kekal 616 unit, hasil jualan akan bertambah RM616.00 kepada RM5,544.00, menjadikan untung kasar baharu sekitar RM3,172.40.',
        model: 'gemini-3.5-flash-lite',
      }),
    })
    global.fetch = mockFetch

    const res = await getAssistantResponse(
      'Kalau saya naikkan harga Brownies RM1, apa jadi?',
      smeResult
    )
    expect(res.isLocalCalculation).toBe(false)
    expect(res.source).toBe('gemini')
  })

  // TEST E: Highest sales revenue product
  it('TEST E: "Produk apa got the highest sales?" deterministically answers Brownies', async () => {
    const res = await getAssistantResponse('produk apa got the highest sales?', smeResult)
    expect(res.isLocalCalculation).toBe(true)
    expect(res.source).toBe('local')
    expect(res.answer).toContain('Brownies')
    expect(res.answer).toContain('RM4,928.00')
  })

  // TEST F: Best seller by quantity
  it('TEST F: "Produk mana paling laris?" deterministically answers Karipap', async () => {
    const res = await getAssistantResponse('Produk mana paling laris?', smeResult)
    expect(res.isLocalCalculation).toBe(true)
    expect(res.source).toBe('local')
    expect(res.answer).toContain('Karipap')
    expect(res.answer).toContain('1,573 unit')
  })

  // TEST G: Open-ended advice
  it('TEST G: "How can I increase sales?" routes to Gemini advice flow without numerical lookup', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        answer: 'Puan boleh fokus pada produk paling laris iaitu Karipap (1,573 unit terjual) dan kembangkan promosi di saluran Gerai dan WhatsApp. 😊',
        model: 'gemini-3.5-flash-lite',
      }),
    })
    global.fetch = mockFetch

    const res = await getAssistantResponse('How can I increase sales?', smeResult)
    expect(res.isLocalCalculation).toBe(false)
    expect(res.source).toBe('gemini')
    expect(mockFetch).toHaveBeenCalled()
  })

  // TEST H: Product Existence Checks (Task 3.1 Issue 1)
  it('TEST H: Product existence questions accurately report presence or absence without false total revenue match', () => {
    // 1. Nonexistent product: "Adakah Popia Sira termasuk dalam jualan saya?"
    const ansAbsence = tryLocalCalculation('Adakah Popia Sira termasuk dalam jualan saya?', smeResult)
    expect(ansAbsence).toBe('Tidak Puan, produk Popia Sira tidak ditemui dalam rekod jualan semasa.')

    // 2. English nonexistent: "Is Popia Sira in my sales?"
    const ansAbsenceEn = tryLocalCalculation('Is Popia Sira in my sales?', smeResult)
    expect(ansAbsenceEn).toBe('Tidak Puan, produk Popia Sira tidak ditemui dalam rekod jualan semasa.')

    // 3. Known product existence: "Adakah Karipap termasuk dalam jualan saya?"
    const ansPresence = tryLocalCalculation('Adakah Karipap termasuk dalam jualan saya?', smeResult)
    expect(ansPresence).toContain('Ya Puan, produk Karipap ada dalam rekod jualan Puan')
    expect(ansPresence).toContain('1,573 unit')
    expect(ansPresence).toContain('RM3,146.00')

    // 4. Casual phrasing: "Ada jual Popia Sira ke?"
    const ansCasualAbsent = tryLocalCalculation('Ada jual Popia Sira ke?', smeResult)
    expect(ansCasualAbsent).toBe('Tidak Puan, produk Popia Sira tidak ditemui dalam rekod jualan semasa.')

    // 5. Total business revenue remains completely intact and unaffected
    const ansTotal = tryLocalCalculation('Berapa total sales saya?', smeResult)
    expect(ansTotal).toContain('RM33,382.10')
  })

  // TEST I: Incomplete product costs or missing operating expenses
  it('TEST I: Incomplete costs and missing operating expenses do not fabricate profits', () => {
    // Missing operating expenses
    const netProfitAns = tryLocalCalculation('Berapa untung bersih?', smeResult)
    expect(netProfitAns).toContain('perbelanjaan operasi') // explains opex requirement

    // Incomplete cost dataset
    const noCostResult = { ...smeResult, hasCostData: false, costComplete: false, grossProfit: null }
    const noCostAns = tryLocalCalculation('Produk mana paling untung?', noCostResult)
    expect(noCostAns).toContain('Maklumat kos diperlukan')
  })

  // TEST J: Conversational follow-up
  it('TEST J: Conversational follow-up "Macam mana kira?" routes to Gemini with history intact', async () => {
    let capturedBody: any = null
    const mockFetch = vi.fn().mockImplementation((_url, opts) => {
      capturedBody = JSON.parse(opts.body)
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          answer: 'Kiraannya adalah dengan menolak kos daripada harga jualan Brownies.',
          model: 'gemini-3.5-flash-lite',
        }),
      })
    })
    global.fetch = mockFetch

    const history: ChatMessage[] = [
      { id: '1', sender: 'user', text: 'Berapa untung Brownies?', timestamp: '1' },
      { id: '2', sender: 'bot', text: 'RM2,556.40', timestamp: '2' },
    ]

    const res = await getAssistantResponse('Macam mana kira?', smeResult, history)
    expect(res.isLocalCalculation).toBe(false)
    expect(res.source).toBe('gemini')
    expect(capturedBody.history.length).toBe(2)
  })

  // TEST K: System Prompt Consistency for Hypotheticals (Task 3.1 Issue 2)
  it('TEST K: System prompt instructs Gemini to use consistent prices and assumptions in hypotheticals', () => {
    let capturedBody: any = null
    const mockFetch = vi.fn().mockImplementation((_url, opts) => {
      capturedBody = JSON.parse(opts.body)
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, answer: 'ok', model: 'gemini-3.5-flash-lite' }),
      })
    })
    global.fetch = mockFetch

    getAssistantResponse('Kalau saya naikkan harga Brownies RM1, apa jadi?', smeResult)
    const prompt = buildSystemInstruction(capturedBody.context)

    expect(prompt).toContain('SENARIO ANDAIAN / HYPOTHETICAL')
    expect(prompt).toContain('Kira harga baharu dengan tepat (Harga Asal + Kenaikan = cth: RM8.00 + RM1.00 = RM9.00 seunit)')
    expect(prompt).toContain('Anggaran Jualan Baharu: Kuantiti Asal × Harga Baharu')
    expect(prompt).toContain('Anggaran Untung Kasar Baharu: Jualan Baharu − Kos Produk Asal')
    expect(prompt).toContain('Wajib nyatakan andaian: "Kiraan ini adalah anggaran andaian dengan andaian kuantiti jualan kekal')
  })

  // TEST L: Data Source Grounding for Specific Previous Product (Task 3.1 Issue 3)
  it('TEST L: System prompt guides Gemini to explain specific data provenance of previous product', () => {
    let capturedBody: any = null
    const mockFetch = vi.fn().mockImplementation((_url, opts) => {
      capturedBody = JSON.parse(opts.body)
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, answer: 'ok', model: 'gemini-3.5-flash-lite' }),
      })
    })
    global.fetch = mockFetch

    getAssistantResponse('Data apa yang kamu gunakan?', smeResult)
    const prompt = buildSystemInstruction(capturedBody.context)

    expect(prompt).toContain('PENERANGAN ASAL USUL DATA & SUMBER KIRAAN')
    expect(prompt).toContain('JELASKAN SUMBER DATA SPESIFIK PRODUK TERSEBUT SECARA NYATA')
    expect(prompt).toContain('Kuantiti terjual yang direkodkan (cth: 616 unit)')
    expect(prompt).toContain('Harga jualan seunit (cth: RM8.00)')
    expect(prompt).toContain('Kos seunit (cth: RM3.85)')
    expect(prompt).toContain('rekod jualan aktif semasa yang dimasukkan/dimuat naik')
  })
})
