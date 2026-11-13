import { GoogleGenAI } from '@google/genai'
import fs from 'node:fs'
import path from 'node:path'
import { globalGeminiQueue } from './queueManager.ts'

export interface ChatHistoryItem {
  role: 'user' | 'model' | 'bot'
  text: string
}

export interface BusinessContextPayload {
  totalRevenue: number
  totalKuantiti: number
  grossProfit: number | null
  operatingExpenses: number | null
  estimatedNetProfit: number | null
  hasCostData: boolean
  costComplete: boolean
  hasDateData: boolean
  hasChannelData: boolean
  recordCount: number
  products: Array<{
    produk: string
    kuantiti: number
    revenue: number
    cost: number | null
    grossProfit: number | null
    profitMarginPercent?: number | null
  }>
  channels?: Array<{
    saluran: string
    kuantiti: number
    revenue: number
    percentage: number
  }>
  trends?: Array<{
    tarikh: string
    displayTarikh: string
    revenue: number
    kuantiti: number
  }>
}

export interface ChatRequestBody {
  message: string
  sessionId?: string
  history?: ChatHistoryItem[]
  context?: BusinessContextPayload
}

// In-memory sliding-window rate limiter for workshop protection (30 participants)
interface ClientRateRecord {
  lastRequestTime: number
  requestTimestamps: number[]
}

const clientRateMap = new Map<string, ClientRateRecord>()
const RATE_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 25 // 25 requests per client per minute
const MIN_INTERVAL_MS = 1200 // minimum 1.2 seconds between requests

export function checkRateLimit(clientId: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now()
  const record = clientRateMap.get(clientId) || {
    lastRequestTime: 0,
    requestTimestamps: [],
  }

  // 1. Min interval check (prevents double-click spam)
  if (now - record.lastRequestTime < MIN_INTERVAL_MS) {
    return { allowed: false, waitSeconds: Math.ceil((MIN_INTERVAL_MS - (now - record.lastRequestTime)) / 1000) }
  }

  // 2. Sliding window check
  record.requestTimestamps = record.requestTimestamps.filter((t) => now - t < RATE_WINDOW_MS)
  if (record.requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = record.requestTimestamps[0]
    const waitSeconds = Math.ceil((RATE_WINDOW_MS - (now - oldest)) / 1000)
    return { allowed: false, waitSeconds }
  }

  record.lastRequestTime = now
  record.requestTimestamps.push(now)
  clientRateMap.set(clientId, record)

  // Clean old keys occasionally
  if (clientRateMap.size > 200) {
    for (const [id, rec] of clientRateMap.entries()) {
      if (now - rec.lastRequestTime > RATE_WINDOW_MS * 2) {
        clientRateMap.delete(id)
      }
    }
  }

  return { allowed: true }
}

/**
 * Dynamically resolves the Gemini API key.
 * Checks process.env, .env, .env.local, and .env.example.
 */
export function getGeminiApiKey(override?: string | null): string | null {
  if (override !== undefined) return override
  if (process.env.GEMINI_API_KEY === 'NONE') return null

  if (
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    !process.env.GEMINI_API_KEY.includes('masukkan_gemini_api_key')
  ) {
    return process.env.GEMINI_API_KEY.trim()
  }

  const filesToScan = ['.env', '.env.local', '.env.example']
  for (const f of filesToScan) {
    const fullPath = path.resolve(process.cwd(), f)
    if (fs.existsSync(fullPath)) {
      try {
        const raw = fs.readFileSync(fullPath, 'utf-8')
        const match = raw.match(/^\s*GEMINI_API_KEY\s*=\s*(.+)$/m)
        if (match && match[1]) {
          const val = match[1].trim().replace(/^['"]|['"]$/g, '')
          if (val && !val.includes('masukkan_gemini_api_key')) {
            process.env.GEMINI_API_KEY = val
            return val
          }
        }
      } catch {
        // ignore read error
      }
    }
  }

  return null
}

export function getGeminiModel(): string {
  if (process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim() !== '') {
    return process.env.GEMINI_MODEL.trim()
  }

  const filesToScan = ['.env', '.env.local', '.env.example']
  for (const f of filesToScan) {
    const fullPath = path.resolve(process.cwd(), f)
    if (fs.existsSync(fullPath)) {
      try {
        const raw = fs.readFileSync(fullPath, 'utf-8')
        const match = raw.match(/^\s*GEMINI_MODEL\s*=\s*(.+)$/m)
        if (match && match[1]) {
          const val = match[1].trim().replace(/^['"]|['"]$/g, '')
          if (val) {
            process.env.GEMINI_MODEL = val
            return val
          }
        }
      } catch {
        // ignore
      }
    }
  }

  return 'gemini-3.5-flash-lite'
}

export function buildSystemInstruction(context?: BusinessContextPayload): string {
  let ctxSummary = 'Tiada data jualan aktif dimuat naik buat masa ini.'

  if (context && context.recordCount > 0) {
    const lines: string[] = []
    lines.push(`Jumlah Jualan: RM${context.totalRevenue.toFixed(2)}, Kuantiti: ${context.totalKuantiti} unit, Transaksi: ${context.recordCount}`)

    if (context.hasCostData && context.costComplete && context.grossProfit !== null) {
      lines.push(`Untung Kasar: RM${context.grossProfit.toFixed(2)}`)
      if (context.operatingExpenses !== null && context.estimatedNetProfit !== null) {
        lines.push(`Opex: RM${context.operatingExpenses.toFixed(2)}, Untung Bersih: RM${context.estimatedNetProfit.toFixed(2)}`)
      }
    } else {
      lines.push('Maklumat Kos: Tidak lengkap atau tidak disediakan.')
    }

    if (context.products && context.products.length > 0) {
      lines.push('Produk Terjual:')
      context.products.forEach((p) => {
        const profit = p.grossProfit !== null ? `, Untung RM${p.grossProfit.toFixed(2)}` : ''
        lines.push(`- ${p.produk}: ${p.kuantiti} unit, Jualan RM${p.revenue.toFixed(2)}${profit}`)
      })
    }

    if (context.channels && context.channels.length > 0) {
      lines.push('Saluran Jualan:')
      context.channels.forEach((c) => {
        lines.push(`- ${c.saluran}: ${c.kuantiti} unit, RM${c.revenue.toFixed(2)} (${c.percentage.toFixed(0)}%)`)
      })
    }

    ctxSummary = lines.join('\n')
  }

  return `Anda adalah Pembantu AI Wanita Niaga, pembantu perniagaan mesra untuk usahawan wanita Malaysia dalam program SULAM 'Wanita with AI'.

DATA JUALAN DISAHKAN:
======================
${ctxSummary}
======================

PERATURAN JAWAPAN (SANGAT PENTING):
1. Sasaran Panjang Jawapan: 50–90 patah perkataan sahaja untuk soalan biasa. Sentiasa ringkas, padat, dan dioptimumkan untuk skrin telefon pintar. Berikan penjelasan panjang HANYA apabila pengguna secara eksplisit meminta "Terangkan lagi".
2. Struktur:
   - Mulakan terus dengan jawapan langsung (direct answer).
   - Berikan maksimum sehingga 3 poin sokongan pendek HANYA jika berguna.
   - Sebutkan hanya angka perniagaan yang paling relevan (jangan ulang seluruh papan pemuka).
   - Akhiri dengan MAKSIMUM SATU soalan susulan yang relevan jika maklumat tambahan dapat membantu cadangan anda.
3. Gaya & Nada:
   - Sapa pengguna dengan sopan sebagai "Puan".
   - Gunakan Bahasa Melayu harian yang mesra, mudah difahami dan tiada istilah teknikal/akademik.
   - Gunakan emoji secara sederhana (cth: 😊).
4. Elakkan Sama Sekali:
   - JANGAN buat pengenalan panjang, rumusan berulang, atau ucapan pembuka yang meleret-leret.
   - JANGAN gunakan tajuk-tajuk besar seperti "Analisis FAKTA Data Terkini".
   - JANGAN mereka-reka data yang tiada (tahap stok semasa, ramalan permintaan, atau kos yang tidak direkodkan). Kekal berasaskan fakta yang disahkan.`
}

export async function handleChatMessage(
  body: ChatRequestBody,
  clientIp = 'default'
): Promise<{ success: boolean; answer?: string; model?: string; error?: string; status?: number }> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    return {
      success: false,
      status: 503,
      error:
        'Kunci API Gemini belum dikonfigurasi di pelayan. Sila pastikan GEMINI_API_KEY telah dimasukkan dalam fail .env persekitaran.',
    }
  }

  const userMessage = (body.message || '').trim()
  if (!userMessage) {
    return {
      success: false,
      status: 400,
      error: 'Sila masukkan soalan anda.',
    }
  }

  // Workshop rate limiter check (uses client session ID rather than shared Wi-Fi IP)
  const clientId = body.sessionId || clientIp
  const rateCheck = globalGeminiQueue.checkClientRate(clientId)
  if (!rateCheck.allowed) {
    return {
      success: false,
      status: 429,
      error: rateCheck.reason || `Sila tunggu ${rateCheck.waitSeconds ?? 2} saat sebelum menghantar soalan seterusnya untuk kelancaran bengkel.`,
    }
  }

  const primaryModel = getGeminiModel()
  const candidateModels = [
    primaryModel,
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-3.5-flash',
  ]
  // Remove duplicates while preserving order
  const modelsToTry = Array.from(new Set(candidateModels))

  const systemInstruction = buildSystemInstruction(body.context)

  // Construct conversation contents for @google/genai
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []

  // Add conversation history if present (up to last 6 messages to keep tokens lean)
  if (body.history && Array.isArray(body.history)) {
    const recentHistory = body.history.slice(-6)
    for (const h of recentHistory) {
      if (!h.text || h.text.trim() === '') continue
      const role = h.role === 'model' || h.role === 'bot' ? 'model' : 'user'
      contents.push({
        role,
        parts: [{ text: h.text.trim() }],
      })
    }
  }

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  })

  const ai = new GoogleGenAI({ apiKey })

  try {
    return await globalGeminiQueue.enqueue(clientId, async () => {
      let lastError: any = null

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
              maxOutputTokens: 450,
            },
          })

          const answer = response.text || 'Maaf, tiada teks jawapan diterima daripada model AI.'
          return {
            success: true,
            answer,
            model: modelName,
          }
        } catch (err: any) {
          lastError = err
          const errMsg = String(err?.message || err).toLowerCase()
          if (
            errMsg.includes('404') ||
            errMsg.includes('not found') ||
            errMsg.includes('503') ||
            errMsg.includes('unavailable') ||
            errMsg.includes('high demand')
          ) {
            console.warn(`[Gemini API] Model ${modelName} returned temporary error. Trying next fallback...`)
            continue
          }
          break
        }
      }

      console.error('[Gemini API Final Error]', lastError)
      const errorStr = String(lastError?.message || lastError)

      if (errorStr.includes('429') || errorStr.toLowerCase().includes('quota') || errorStr.toLowerCase().includes('rate limit')) {
        return {
          success: false,
          status: 429,
          error:
            'Had penggunaan AI semasa telah dicapai buat seketika. Sila tunggu 1 minit sebelum mencuba semula soalan ini.',
        }
      }

      if (errorStr.includes('API key') || errorStr.includes('401') || errorStr.includes('403')) {
        return {
          success: false,
          status: 403,
          error:
            'Kunci API Gemini tidak sah atau tiada kebenaran. Sila semak GEMINI_API_KEY anda.',
        }
      }

      if (errorStr.includes('timeout') || errorStr.includes('ETIMEDOUT') || errorStr.includes('fetch failed')) {
        return {
          success: false,
          status: 504,
          error:
            'Rangkaian terputus atau pelayan mengambil masa terlalu lama. Sila periksa sambungan internet anda dan cuba lagi.',
        }
      }

      return {
        success: false,
        status: 500,
        error:
          'Maaf, perkhidmatan AI mengalami ralat pemprosesan sementara. Sila cuba lagi sebentar lagi.',
      }
    })
  } catch (queueErr: any) {
    if (queueErr.isBusy || queueErr.status === 503) {
      return {
        success: false,
        status: 503,
        error: queueErr.message || 'Pelayan AI sedang sibuk melayani giliran peserta bengkel. Sila cuba lagi dalam beberapa saat.',
      }
    }
    return {
      success: false,
      status: queueErr.status || 500,
      error: queueErr.message || 'Ralat giliran pelayan.',
    }
  }
}
