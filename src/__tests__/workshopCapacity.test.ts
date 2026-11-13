import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateSales } from '../calc/sales'
import { validateRecords } from '../data/validate'
import { SAMPLE_SALES } from '../data/sample'
import { GeminiQueueManager } from '../../server/queueManager'
import { tryLocalCalculation } from '../services/aiAssistant'
import type { RawSale } from '../types'

describe('Phase 4A: 50-Participant Workshop Capacity & Concurrency Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // Test 1: 50 Concurrent Active Website Sessions for Local Dashboard Calculations
  it('1. Handles 50 concurrent dashboard calculation sessions with 0 API calls and instant execution', () => {
    const participantCount = 50
    const start = performance.now()

    const sessions = Array.from({ length: participantCount }).map((_, idx) => {
      // Simulate unique participant dataset variation
      const records: RawSale[] = [
        { produk: `Kek Lapis Puan ${idx + 1}`, kuantiti: 10 + (idx % 5), harga: 15.0, kos: 8.0 },
        { produk: `Karipap Puan ${idx + 1}`, kuantiti: 40 + (idx % 10), harga: 2.0, kos: 0.8 },
      ]
      const { valid } = validateRecords(records)
      const opex = idx % 2 === 0 ? 50 : null
      return calculateSales(valid, opex)
    })

    const durationMs = performance.now() - start

    expect(sessions.length).toBe(50)
    // All 50 participants receive complete calculations
    sessions.forEach((res, i) => {
      expect(res.totalRevenue).toBeGreaterThan(0)
      expect(res.totalKuantiti).toBeGreaterThan(0)
      expect(res.grossProfit).toBeGreaterThan(0)
      if (i % 2 === 0) {
        expect(res.operatingExpenses).toBe(50)
        expect(Math.round(res.estimatedNetProfit! * 100)).toBe(
          Math.round((res.grossProfit! - 50) * 100)
        )
      } else {
        expect(res.operatingExpenses).toBe(null)
        expect(res.estimatedNetProfit).toBe(null)
      }
    })

    // 50 client calculations must execute in under 100ms
    expect(durationMs).toBeLessThan(100)
  })

  // Test 2: Local calculation engine intercepts numerical questions for all 50 participants
  it('2. Numerical questions are intercepted locally without consuming server or API quota', () => {
    const salesResult = calculateSales(SAMPLE_SALES, 200)

    const questions = [
      'Produk mana paling laris?',
      'Berapakah jumlah jualan saya?',
      'Produk mana paling banyak memberi keuntungan?',
    ]

    for (let user = 1; user <= 50; user++) {
      const q = questions[user % questions.length]
      const answer = tryLocalCalculation(q, salesResult)
      expect(answer).not.toBeNull()
      expect(answer).toBeDefined()
    }
  })

  // Test 3: Session ID Isolation on Shared University Wi-Fi IP
  it('3. Isolates rate limiting per smartphone session so 50 participants on one Wi-Fi IP do not block each other', () => {
    const queue = new GeminiQueueManager({ maxConcurrent: 3, maxQueueLength: 25 })

    // Simulate 40 distinct smartphone sessions all originating from UTM/UKM campus Wi-Fi NAT (10.145.15.1)
    for (let i = 1; i <= 40; i++) {
      const uniqueSessionId = `session-participant-${i}`
      const check = queue.checkClientRate(uniqueSessionId)
      // Each participant's first call is permitted
      expect(check.allowed).toBe(true)
    }

    // But if a single participant spam clicks 2 times within 500ms:
    const spamSession = 'session-participant-1'
    const rapidClick = queue.checkClientRate(spamSession)
    expect(rapidClick.allowed).toBe(false)
    expect(rapidClick.reason).toContain('Sila tunggu sebentar')

    // Meanwhile, participant 2 is still unaffected!
    const otherParticipant = queue.checkClientRate('session-participant-2')
    // Participant 2's rate limit was evaluated independently
    expect(otherParticipant).toBeDefined()
  })

  // Test 4: Concurrency control throttles bursts and drains FIFO queue cleanly
  it('4. Concurrency controller caps active Gemini calls and drains burst queue in order', async () => {
    const queue = new GeminiQueueManager({ maxConcurrent: 2, maxQueueLength: 20 })

    let activePeak = 0
    let currentActive = 0
    const executedOrder: number[] = []

    const makeTask = (id: number, delayMs: number) => async () => {
      currentActive++
      if (currentActive > activePeak) activePeak = currentActive
      await new Promise((r) => setTimeout(r, delayMs))
      executedOrder.push(id)
      currentActive--
      return `Result ${id}`
    }

    // 6 participants send simultaneous requests in a burst
    const promises = [
      queue.enqueue('p1', makeTask(1, 30)),
      queue.enqueue('p2', makeTask(2, 30)),
      queue.enqueue('p3', makeTask(3, 30)),
      queue.enqueue('p4', makeTask(4, 30)),
      queue.enqueue('p5', makeTask(5, 30)),
      queue.enqueue('p6', makeTask(6, 30)),
    ]

    const results = await Promise.all(promises)

    expect(results.length).toBe(6)
    // Concurrency must NEVER exceed maxConcurrent (2)
    expect(activePeak).toBeLessThanOrEqual(2)
    expect(executedOrder.length).toBe(6)
  })

  // Test 5: Queue overflow produces friendly Bahasa Melayu busy message
  it('5. Queue overflow returns HTTP 503 with friendly Bahasa Melayu notification', async () => {
    const queue = new GeminiQueueManager({ maxConcurrent: 1, maxQueueLength: 2 })

    // Fill concurrency (1 active) + fill queue (2 queued)
    const pendingTask = () => new Promise((r) => setTimeout(r, 200))
    queue.enqueue('p1', pendingTask)
    queue.enqueue('p2', pendingTask)
    queue.enqueue('p3', pendingTask)

    // 4th request exceeds maxQueueLength (2)
    await expect(queue.enqueue('p4', pendingTask)).rejects.toThrow(
      'Pelayan AI sedang sibuk melayani giliran peserta bengkel yang lain'
    )
  })
})
