/**
 * Workshop-Ready Concurrency & Queue Manager for Google Gemini API
 * 
 * Specially optimized for SULAM workshops (30-50 simultaneous smartphone participants):
 * 1. Global Concurrency Limiter: Caps active requests to Gemini (e.g. max 2-3 concurrent) to prevent 429 bursts.
 * 2. FIFO Request Queue: Smoothly queues concurrent participant requests and processes them in order.
 * 3. Rate-Limiting per Client Session: Uses unique client session ID rather than shared Wi-Fi IP.
 * 4. Graceful Degradation: If queue is saturated, responds with friendly Bahasa Melayu messages.
 */

export interface QueueOptions {
  maxConcurrent?: number
  maxQueueLength?: number
  queueTimeoutMs?: number
}

interface QueuedTask<T> {
  id: string
  clientId: string
  fn: () => Promise<T>
  resolve: (value: T) => void
  reject: (reason: any) => void
  enqueuedAt: number
}

export class GeminiQueueManager {
  private activeCount = 0
  private queue: QueuedTask<any>[] = []
  private maxConcurrent: number
  private maxQueueLength: number
  private queueTimeoutMs: number

  // Client rate tracking by unique Session ID
  private clientRateMap = new Map<string, { lastRequest: number; timestamps: number[] }>()

  constructor(options: QueueOptions = {}) {
    this.maxConcurrent = options.maxConcurrent ?? 3
    this.maxQueueLength = options.maxQueueLength ?? 25
    this.queueTimeoutMs = options.queueTimeoutMs ?? 25000 // 25s
  }

  /**
   * Check rate limit for an individual participant by unique sessionId.
   * Prevents spam while ensuring 40 participants on the same Wi-Fi IP have isolated buckets.
   */
  public checkClientRate(sessionId: string): { allowed: boolean; waitSeconds?: number; reason?: string } {
    const now = Date.now()
    const record = this.clientRateMap.get(sessionId) || { lastRequest: 0, timestamps: [] }

    // Minimum interval between calls from the same phone (1.2 seconds)
    if (now - record.lastRequest < 1200) {
      const waitSeconds = Math.ceil((1200 - (now - record.lastRequest)) / 1000)
      return {
        allowed: false,
        waitSeconds,
        reason: 'Sila tunggu sebentar sebelum menghantar permintaan seterusnya.',
      }
    }

    // Rolling window check (max 20 requests per client per minute)
    record.timestamps = record.timestamps.filter((t) => now - t < 60000)
    if (record.timestamps.length >= 20) {
      const oldest = record.timestamps[0]
      const waitSeconds = Math.ceil((60000 - (now - oldest)) / 1000)
      return {
        allowed: false,
        waitSeconds,
        reason: `Had soalan AI dicapai untuk minit ini. Sila tunggu ${waitSeconds} saat.`,
      }
    }

    record.lastRequest = now
    record.timestamps.push(now)
    this.clientRateMap.set(sessionId, record)

    // Periodic cleanup of stale sessions
    if (this.clientRateMap.size > 500) {
      for (const [id, rec] of this.clientRateMap.entries()) {
        if (now - rec.lastRequest > 120000) {
          this.clientRateMap.delete(id)
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Enqueue a Gemini API task.
   * If concurrency allows, executes immediately. Otherwise waits in FIFO queue.
   */
  public async enqueue<T>(clientId: string, fn: () => Promise<T>): Promise<T> {
    // If queue is full, reject immediately with friendly Bahasa Melayu response
    if (this.queue.length >= this.maxQueueLength) {
      const busyError: any = new Error(
        'Pelayan AI sedang sibuk melayani giliran peserta bengkel yang lain. Sila tekan butang sekali lagi dalam 15 saat.'
      )
      busyError.status = 503
      busyError.isBusy = true
      throw busyError
    }

    return new Promise<T>((resolve, reject) => {
      const task: QueuedTask<T> = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        clientId,
        fn,
        resolve,
        reject,
        enqueuedAt: Date.now(),
      }

      this.queue.push(task)
      this.processNext()
    })
  }

  private async processNext() {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    const task = this.queue.shift()
    if (!task) return

    // Check if task timed out while waiting in queue
    const waitedMs = Date.now() - task.enqueuedAt
    if (waitedMs > this.queueTimeoutMs) {
      const timeoutError: any = new Error(
        'Giliran AI mengambil masa terlalu lama kerana sambungan sibuk. Sila cuba lagi.'
      )
      timeoutError.status = 504
      task.reject(timeoutError)
      this.processNext()
      return
    }

    this.activeCount++

    try {
      const result = await task.fn()
      task.resolve(result)
    } catch (err) {
      task.reject(err)
    } finally {
      this.activeCount--
      // Small 150ms buffer between completions to avoid hard burst collisions on Google API
      setTimeout(() => {
        this.processNext()
      }, 150)
    }
  }

  public getStats() {
    return {
      activeCount: this.activeCount,
      queuedCount: this.queue.length,
      trackedSessions: this.clientRateMap.size,
      maxConcurrent: this.maxConcurrent,
      maxQueueLength: this.maxQueueLength,
    }
  }

  public reset() {
    this.activeCount = 0
    this.queue = []
    this.clientRateMap.clear()
  }
}

export const globalGeminiQueue = new GeminiQueueManager({
  maxConcurrent: 3, // Safe concurrency limit for workshop
  maxQueueLength: 30, // Max pending queue before rejecting with friendly message
  queueTimeoutMs: 25000,
})
