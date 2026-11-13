import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildSystemInstruction,
  checkRateLimit,
  handleChatMessage,
} from '../../server/chatHandler'
import {
  getAdaptiveSuggestedQuestions,
  getAssistantResponse,
  generateContextualFollowUps,
} from '../services/aiAssistant'
import { calculateSales } from '../calc/sales'
import { SAMPLE_SALES } from '../data/sample'
import type { SalesResult } from '../types'

describe('Phase 2A: Gemini AI Integration Test Suite', () => {
  let sampleResult: SalesResult

  beforeEach(() => {
    sampleResult = calculateSales(SAMPLE_SALES, 200)
    vi.restoreAllMocks()
  })

  // 1. System Prompt Construction with 50-90 words target and polite persona
  it('1. buildSystemInstruction constructs concise prompt targeting 50-90 words and Puan greeting', () => {
    const prompt = buildSystemInstruction({
      totalRevenue: sampleResult.totalRevenue,
      totalKuantiti: sampleResult.totalKuantiti,
      grossProfit: sampleResult.grossProfit,
      operatingExpenses: sampleResult.operatingExpenses,
      estimatedNetProfit: sampleResult.estimatedNetProfit,
      hasCostData: sampleResult.hasCostData,
      costComplete: sampleResult.costComplete,
      hasDateData: sampleResult.hasDateData,
      hasChannelData: sampleResult.hasChannelData,
      recordCount: sampleResult.recordCount,
      products: sampleResult.products,
      channels: sampleResult.channels,
      trends: sampleResult.trends,
    })

    expect(prompt).toContain('Jumlah Jualan: RM1530.00')
    expect(prompt).toContain('Karipap')
    expect(prompt).toContain('Brownies')
    expect(prompt).toContain('Kuih Lapis')
    expect(prompt).toContain('50–90 patah perkataan')
    expect(prompt).toContain('Puan')
    expect(prompt).toContain('jawapan langsung (direct answer)')
    expect(prompt).toContain('JANGAN mereka-reka data')
  })

  // 2. Workshop Rate Limiter
  it('2. Rate limiter protects server against rapid repeated clicks from participants', () => {
    const client = 'test-client-1'
    const firstCheck = checkRateLimit(client)
    expect(firstCheck.allowed).toBe(true)

    // Immediate second check (< 1.2s) should be throttled
    const immediateCheck = checkRateLimit(client)
    expect(immediateCheck.allowed).toBe(false)
    expect(immediateCheck.waitSeconds).toBeGreaterThanOrEqual(1)
  })

  // 3. Graceful handling when GEMINI_API_KEY is missing
  it('3. handleChatMessage returns understandable Bahasa Melayu error when API key is missing', async () => {
    const origKey = process.env.GEMINI_API_KEY
    process.env.GEMINI_API_KEY = 'NONE'

    const res = await handleChatMessage(
      { message: 'Bagaimana untung?' },
      'test-client-no-key'
    )
    expect(res.success).toBe(false)
    expect(res.status).toBe(503)
    expect(res.error).toContain('Kunci API Gemini belum dikonfigurasi')

    process.env.GEMINI_API_KEY = origKey
  })

  // 4. Adaptive Suggested Questions
  it('4. getAdaptiveSuggestedQuestions adapts to channels, opex and cost status', () => {
    const questions = getAdaptiveSuggestedQuestions(sampleResult)
    const texts = questions.map((q) => q.text)

    expect(texts).toContain('Produk mana paling laris?')
    expect(texts).toContain('Berapakah jumlah jualan saya?')
    expect(texts).toContain('Produk mana paling banyak memberi keuntungan?')
    expect(texts).toContain('Bagaimana saya boleh tingkatkan keuntungan?')
    expect(texts).toContain('Patutkah saya tambah stok?')
    expect(texts).toContain('Saluran jualan mana patut saya beri tumpuan?')
    expect(texts).toContain('Adakah perbelanjaan operasi saya wajar berbanding untung?')
  })

  // 5. Contextual follow-up chips generation (including "Terangkan lagi", "Selalu habis", etc.)
  it('5. generateContextualFollowUps creates relevant follow-ups based on stock and profit context', () => {
    // Stock discussion
    const stockFollowUps = generateContextualFollowUps(
      'Patutkah saya tambah stok?',
      'Boleh pertimbangkan Puan. Karipap paling laris. Stok Puan biasanya habis atau masih berbaki?'
    )
    expect(stockFollowUps).toContain('Terangkan lagi')
    expect(stockFollowUps).toContain('Selalu habis')
    expect(stockFollowUps).toContain('Masih berbaki')

    // Profit discussion
    const profitFollowUps = generateContextualFollowUps(
      'Bagaimana tingkatkan keuntungan?',
      'Fokus kepada produk dengan margin tinggi.'
    )
    expect(profitFollowUps).toContain('Terangkan lagi')
    expect(profitFollowUps).toContain('Macam mana jimat kos?')
  })

  // 6. Local calculation engine continues answering numerical questions without calling Gemini
  it('6. Local calculation engine intercepts numerical questions directly without calling API', async () => {
    // Q1: Produk mana paling laris?
    const q1 = await getAssistantResponse('Produk mana paling laris?', sampleResult)
    expect(q1.isLocalCalculation).toBe(true)
    expect(q1.source).toBe('local')
    expect(q1.answer).toContain('Karipap')
    expect(q1.answer).toContain('220 unit')

    // Q2: Berapakah jumlah jualan saya?
    const q2 = await getAssistantResponse('Berapakah jumlah jualan saya?', sampleResult)
    expect(q2.isLocalCalculation).toBe(true)
    expect(q2.source).toBe('local')
    expect(q2.answer).toContain('RM1,530.00')

    // Q3: Produk mana paling banyak memberi keuntungan?
    const q3 = await getAssistantResponse(
      'Produk mana paling banyak memberi keuntungan?',
      sampleResult
    )
    expect(q3.isLocalCalculation).toBe(true)
    expect(q3.source).toBe('local')
    expect(q3.answer).toContain('Karipap')
    expect(q3.answer).toContain('RM374.00')
  })

  // 7. Mocked Gemini API response for open-ended advice
  it('7. Open-ended advice questions route to backend Gemini API endpoint with follow-ups', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        answer:
          'Boleh pertimbangkan, Puan! 😊 Karipap paling laris dengan 220 unit terjual. Stok biasanya habis atau masih berbaki?',
        model: 'gemini-3.5-flash-lite',
      }),
    })
    global.fetch = mockFetch

    const res = await getAssistantResponse(
      'Patutkah saya tambah stok?',
      sampleResult,
      []
    )

    expect(res.isLocalCalculation).toBe(false)
    expect(res.source).toBe('gemini')
    expect(res.answer).toContain('Karipap')
    expect(res.followUps).toContain('Selalu habis')
    expect(res.followUps).toContain('Terangkan lagi')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        method: 'POST',
      })
    )
  })

  // 8. Network or Server Error gracefully handled
  it('8. Network error on AI endpoint produces user-friendly Bahasa Melayu message', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const res = await getAssistantResponse(
      'Patutkah saya tambah stok?',
      sampleResult,
      []
    )

    expect(res.source).toBe('error')
    expect(res.answer).toContain('Tidak dapat menghubungi pelayan AI')
  })
})
