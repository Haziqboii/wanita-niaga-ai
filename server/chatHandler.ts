import { GoogleGenAI } from '@google/genai'
import fs from 'node:fs'
import path from 'node:path'
import { globalGeminiQueue } from './queueManager.ts'

export interface ChatHistoryItem {
  role: 'user' | 'model' | 'bot'
  text: string
}

export interface BusinessContextPayload {
  selectedPeriod?: string
  isFilteredPeriod?: boolean
  allTimeRevenue?: number | null
  monthlyComparison?: {
    summaryText: string
    currentMonth?: string
    currentRevenue?: number
    previousMonth?: string | null
    previousRevenue?: number | null
    diffRevenue?: number | null
    percentageChange?: number | null
  } | null
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
    avgPrice?: number | null
    avgCost?: number | null
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
  categories?: Array<{
    kategori: string
    kuantiti: number
    revenue: number
    percentage: number
  }>
  paymentMethods?: Array<{
    kaedah: string
    transaksi: number
    revenue: number
    percentage: number
  }>
  multiMonthBreakdown?: Array<{
    key: string
    label: string
    fullName: string
    revenue: number
    kuantiti: number
    recordCount: number
    grossProfit: number | null
    bestSellerQty?: { produk: string; kuantiti: number } | null
    bestSellerRev?: { produk: string; revenue: number } | null
  }>
  weekdayAnalytics?: {
    highestRevenueDay?: { nameMY: string; revenue: number; avgRevenuePerDate: number; distinctDatesCount: number } | null
    highestAvgDay?: { nameMY: string; avgRevenuePerDate: number } | null
    weekendRevenue?: number
    weekdayRevenue?: number
    weekendPercentage?: number
    avgWeekendDailyRevenue?: number
    avgWeekdayDailyRevenue?: number
    isWeekendMoreProfitable?: boolean
    days?: Array<{ nameMY: string; revenue: number; avgRevenuePerDate: number; distinctDatesCount: number; recordCount?: number }>
  } | null
  dailyAnalytics?: {
    totalRecordedDates?: number
    highestRevenueDate?: { tarikh: string; displayTarikh: string; revenue: number; kuantiti: number } | null
    lowestRevenueDate?: { tarikh: string; displayTarikh: string; revenue: number; kuantiti: number } | null
    avgDailyRevenue?: number
    dateRange?: { start: string; end: string } | null
  } | null
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
    if (context.isFilteredPeriod && context.selectedPeriod) {
      lines.push(`TEMPOH LAPORAN DIPILIH: ${context.selectedPeriod} (Pengguna sedang meneliti data khusus bagi bulan ${context.selectedPeriod})`)
      if (context.allTimeRevenue !== null && context.allTimeRevenue !== undefined) {
        lines.push(`Jumlah Jualan Keseluruhan (Semua Bulan): RM${context.allTimeRevenue.toFixed(2)}`)
      }
      if (context.monthlyComparison?.summaryText) {
        lines.push(`Perbandingan Prestasi Bulanan: ${context.monthlyComparison.summaryText}`)
      }
    }
    const periodTag = context.selectedPeriod ? ` (${context.selectedPeriod})` : ''
    lines.push(`Jumlah Jualan${periodTag}: RM${context.totalRevenue.toFixed(2)}, Kuantiti Terjual: ${context.totalKuantiti} unit, Transaksi: ${context.recordCount} rekod, Jenis Produk: ${context.products?.length || 0}`)

    if (context.hasCostData && context.costComplete && context.grossProfit !== null) {
      lines.push(`Untung Kasar Keseluruhan: RM${context.grossProfit.toFixed(2)}`)
      if (context.operatingExpenses !== null && context.estimatedNetProfit !== null) {
        lines.push(`Perbelanjaan Operasi (Opex): RM${context.operatingExpenses.toFixed(2)}, Anggaran Untung Bersih: RM${context.estimatedNetProfit.toFixed(2)}`)
      }
    } else {
      lines.push('Maklumat Kos: Tidak lengkap atau tidak disediakan untuk semua produk.')
    }

    if (context.products && context.products.length > 0) {
      lines.push('\nSENARAI PRODUK DISAHKAN:')
      context.products.forEach((p) => {
        const unitPrice = p.avgPrice ?? (p.kuantiti > 0 ? p.revenue / p.kuantiti : null)
        const unitCost = p.avgCost ?? (p.cost !== null && p.kuantiti > 0 ? p.cost / p.kuantiti : null)
        const priceStr = unitPrice !== null ? ` (RM${unitPrice.toFixed(2)} seunit)` : ''
        const costStr =
          p.cost !== null && unitCost !== null
            ? `, Kos: RM${p.cost.toFixed(2)} (RM${unitCost.toFixed(2)} seunit), Untung Kasar: RM${(p.grossProfit ?? 0).toFixed(2)}${p.profitMarginPercent !== null && p.profitMarginPercent !== undefined ? ` (Margin ${p.profitMarginPercent.toFixed(1)}%)` : ''}`
            : ', Kos: Tidak direkodkan'
        lines.push(`- ${p.produk}: ${p.kuantiti} unit, Jualan: RM${p.revenue.toFixed(2)}${priceStr}${costStr}`)
      })
    }

    if (context.channels && context.channels.length > 0) {
      lines.push('\nSALURAN JUALAN:')
      context.channels.forEach((c) => {
        lines.push(`- ${c.saluran}: ${c.kuantiti} unit, RM${c.revenue.toFixed(2)} (${c.percentage.toFixed(0)}%)`)
      })
    }

    if (context.categories && context.categories.length > 0) {
      lines.push('\nKATEGORI PRODUK:')
      context.categories.forEach((cat) => {
        lines.push(`- ${cat.kategori}: ${cat.kuantiti} unit, RM${cat.revenue.toFixed(2)} (${cat.percentage.toFixed(0)}%)`)
      })
    }

    if (context.paymentMethods && context.paymentMethods.length > 0) {
      lines.push('\nKAEDAH BAYARAN:')
      context.paymentMethods.forEach((pm) => {
        lines.push(`- ${pm.kaedah}: ${pm.transaksi} transaksi, RM${pm.revenue.toFixed(2)} (${pm.percentage.toFixed(0)}%)`)
      })
    }

    if (context.multiMonthBreakdown && context.multiMonthBreakdown.length > 0) {
      lines.push('\nPECAHAN PRESTASI MENGIKUT BULAN (SEMUA BULAN DALAM DATASET):')
      context.multiMonthBreakdown.forEach((m) => {
        const profitStr = m.grossProfit !== null ? `, Untung Kasar: RM${m.grossProfit.toFixed(2)}` : ''
        const bestQtyStr = m.bestSellerQty ? `, Terlaris (Kuantiti): ${m.bestSellerQty.produk} (${m.bestSellerQty.kuantiti} unit)` : ''
        const bestRevStr = m.bestSellerRev ? `, Hasil Tertinggi: ${m.bestSellerRev.produk} (RM${m.bestSellerRev.revenue.toFixed(2)})` : ''
        lines.push(`- ${m.fullName} (${m.key}): RM${m.revenue.toFixed(2)}, ${m.kuantiti} unit, ${m.recordCount} rekod${profitStr}${bestQtyStr}${bestRevStr}`)
      })
    }

    if (context.weekdayAnalytics && context.weekdayAnalytics.days && context.weekdayAnalytics.days.length > 0) {
      const w = context.weekdayAnalytics
      lines.push('\nANALISIS HARI & HUJUNG MINGGU (WEEKDAY INTELLIGENCE):')
      if (w.highestRevenueDay) {
        lines.push(`- Hari Hasil Tertinggi: ${w.highestRevenueDay.nameMY} (Jumlah RM${w.highestRevenueDay.revenue.toFixed(2)}, Purata RM${w.highestRevenueDay.avgRevenuePerDate.toFixed(2)}/hari daripada ${w.highestRevenueDay.distinctDatesCount} tarikh)`)
      }
      if (w.highestAvgDay && w.highestAvgDay.nameMY !== w.highestRevenueDay?.nameMY) {
        lines.push(`- Hari Purata Jualan Tertinggi: ${w.highestAvgDay.nameMY} (Purata RM${w.highestAvgDay.avgRevenuePerDate.toFixed(2)}/hari)`)
      }
      if (w.weekendRevenue !== undefined && w.weekdayRevenue !== undefined) {
        lines.push(`- Hujung Minggu vs Hari Bekerja: Hujung Minggu RM${w.weekendRevenue.toFixed(2)} (Purata RM${(w.avgWeekendDailyRevenue ?? 0).toFixed(2)}/hari) vs Hari Bekerja RM${w.weekdayRevenue.toFixed(2)} (Purata RM${(w.avgWeekdayDailyRevenue ?? 0).toFixed(2)}/hari). ${w.isWeekendMoreProfitable ? 'Hujung minggu mencatatkan purata jualan harian lebih tinggi.' : 'Hari bekerja mencatatkan purata jualan harian lebih tinggi atau setara.'}`)
      }
      if (w.days) {
        lines.push('- Pecahan Setiap Hari: ' + w.days.map((d) => `${d.nameMY}: RM${d.revenue.toFixed(2)} (purata RM${d.avgRevenuePerDate.toFixed(2)}/hari)`).join(', '))
      }
    }

    if (context.dailyAnalytics && context.dailyAnalytics.totalRecordedDates) {
      const d = context.dailyAnalytics
      lines.push('\nANALISIS TARIKH & TREND HARIAN:')
      lines.push(`- Jumlah Hari Direkodkan: ${d.totalRecordedDates} hari unik`)
      if (d.dateRange?.start && d.dateRange?.end) {
        lines.push(`- Julat Tarikh: ${d.dateRange.start} hingga ${d.dateRange.end}`)
      }
      if (d.highestRevenueDate) {
        lines.push(`- Tarikh Jualan Tertinggi: ${d.highestRevenueDate.displayTarikh} (${d.highestRevenueDate.tarikh}) dengan jualan RM${d.highestRevenueDate.revenue.toFixed(2)} (${d.highestRevenueDate.kuantiti} unit)`)
      }
      if (d.lowestRevenueDate) {
        lines.push(`- Tarikh Jualan Terendah: ${d.lowestRevenueDate.displayTarikh} (${d.lowestRevenueDate.tarikh}) dengan jualan RM${d.lowestRevenueDate.revenue.toFixed(2)} (${d.lowestRevenueDate.kuantiti} unit)`)
      }
      if (d.avgDailyRevenue) {
        lines.push(`- Purata Jualan Sehari: RM${d.avgDailyRevenue.toFixed(2)}`)
      }
    }

    ctxSummary = lines.join('\n')
  }

  return `Anda adalah Pembantu AI Wanita Niaga, pembantu perniagaan mesra, bijak, dan berfakta untuk usahawan wanita Malaysia dalam program SULAM 'Wanita with AI'.

DATA PERNIAGAAN DISAHKAN (SUMBER REKOD JUALAN SEMASA):
======================================================
${ctxSummary}
======================================================

PANDUAN & PERATURAN JAWAPAN (SANGAT PENTING):

1. PENJELASAN PENGIRAAN KEWANGAN:
   - Apabila pengguna bertanya bagaimana sesuatu angka dikira (cth: "Macam mana kamu kira untung kasar [produk]?"):
     Jelaskan langkah demi langkah menggunakan formula:
     * Untung Kasar = Hasil Jualan − Jumlah Kos Produk
     * Tunjukkan kiraan: Jualan (Kuantiti × Harga seunit) ditolak Kos Produk (Kuantiti × Kos seunit).
   - Bezakan dengan jelas antara Untung Kasar (sebelum tolak opex) dan Untung Bersih (selepas tolak opex).
   - Jangan sekali-kali menggantikan angka yang telah dikira dengan andaian sendiri.

2. PENERANGAN ASAL USUL DATA & SUMBER KIRAAN (DATA PROVENANCE):
   - Apabila ditanya "Data apa yang kamu gunakan?", "Dari mana data ini?", atau "Sumber kiraan dari mana?":
     * Semak sejarah mesej sebelumnya (history): Jika perbualan sebelumnya membincangkan sesuatu produk atau kiraan (contohnya Brownies):
       JELASKAN SUMBER DATA SPESIFIK PRODUK TERSEBUT SECARA NYATA daripada rekod yang disahkan di atas:
       - Nama produk yang dirujuk (cth: Brownies)
       - Kuantiti terjual yang direkodkan (cth: 616 unit)
       - Harga jualan seunit (cth: RM8.00)
       - Kos seunit (cth: RM3.85) dan jumlah kos produk (cth: RM2,371.60)
       - Jumlah hasil jualan yang terhasil (cth: RM4,928.00)
       - Untung kasar yang dikira (cth: RM2,556.40)
     * Nyatakan bahawa data ini diperoleh terus daripada rekod jualan aktif semasa yang dimasukkan/dimuat naik ke dalam sistem Wanita Niaga AI. Jangan mereka-reka sumber luar atau mendedahkan data sulit pelanggan.

3. SENARIO ANDAIAN / HYPOTHETICAL (PERUBAHAN HARGA):
   - Apabila pengguna bertanya senario andaian "Kalau..." (cth: "Kalau saya naikkan harga [produk] RM1, apa jadi?"):
     * Kenal pasti harga asal seunit produk tersebut daripada DATA PERNIAGAAN DISAHKAN (cth: RM8.00 seunit).
     * Kira harga baharu dengan tepat (Harga Asal + Kenaikan = cth: RM8.00 + RM1.00 = RM9.00 seunit). JANGAN sesekali menyebut angka bercanggah atau keliru (seperti "jadi RM9.50 RM9.00").
     * Bentangkan kiraan secara konsisten dan teratur:
       1. Harga Baharu: Harga Asal + Kenaikan (cth: RM8.00 + RM1.00 = RM9.00 seunit).
       2. Anggaran Jualan Baharu: Kuantiti Asal × Harga Baharu (cth: 616 unit × RM9.00 = RM5,544.00, pertambahan hasil RM616.00).
       3. Anggaran Untung Kasar Baharu: Jualan Baharu − Kos Produk Asal (cth: RM5,544.00 − RM2,371.60 = RM3,172.40, pertambahan untung RM616.00).
     * Wajib nyatakan andaian: "Kiraan ini adalah anggaran andaian dengan andaian kuantiti jualan kekal (cth: 616 unit) dan kos produk tidak berubah. Permintaan pasaran sebenar pelanggan mungkin terkesan akibat kenaikan harga."

4. KESEDARAN KESELURUHAN DATASET & TEMPOH BULANAN (COMPLETE BUSINESS DATA AWARENESS):
   - Anda mempunyai akses penuh kepada SEMUA data jualan perniagaan yang disahkan, termasuk semua bulan dalam dataset (lihat PECAHAN PRESTASI MENGIKUT BULAN), analisis hari/tarikh (lihat ANALISIS HARI & HUJUNG MINGGU dan ANALISIS TARIKH).
   - JANGAN SESEKALI mengatakan anda "hanya tahu satu bulan" atau "tiada data bulan lain" jika rekod bulan lain wujud dalam PECAHAN PRESTASI MENGIKUT BULAN.
   - Jika pengguna bertanya tentang bulan lain (cth: "Berapa jualan September?" walaupun papan pemuka sedang memaparkan Oktober), jawab terus menggunakan angka bulan September yang disahkan.
   - Jika pengguna bertanya mengenai kedua-dua bulan atau meminta perbandingan (cth: "Bandingkan Sep dan Okt" atau "Do you have data for both months?"), terangkan kedua-dua bulan dan bezakan prestasi mereka dengan tepat (cth: Okt meningkat RM6,514.70 / 37.4% berbanding Sep).
   - Jika pengguna bertanya mengenai hari terlaris atau tarikh tertinggi, rujuk data ANALISIS HARI & HUJUNG MINGGU atau ANALISIS TARIKH. JANGAN SESEKALI mereka-reka corak hari jika tiada data tarikh (maklumkan tiada tarikh direkodkan).
   - Jaga privasi perniagaan: Jangan sebut nombor telefon, ID transaksi mentah, atau nota sulit peribadi.

5. KONTEKS PERBUALAN & SOALAN SUSULAN (FOLLOW-UPS):
   - Fahami rujukan perbualan sebelumnya. Jika pengguna baru sahaja bertanyakan tentang satu produk (contoh: Brownies), soalan susulan seperti "Macam mana kamu kira?", "Kenapa macam tu?", atau "Kalau naik RM1?" merujuk kepada produk tersebut.

6. PERATURAN ANTI-HALUSINASI KETAT (GROUNDING):
   - JANGAN SESEKALI mencipta nama produk atau menu yang tiada dalam DATA PERNIAGAAN DISAHKAN di atas.
   - JANGAN mereka-reka data, nombor jualan, kos, atau keuntungan yang tiada.
   - Jika maklumat tiada dalam rekod (cth: tiada kos atau tiada rekod perbelanjaan operasi), maklumkan secara sopan dan jujur kepada Puan bahawa data tersebut tidak disediakan.
   - Cadangan perniagaan mestilah jelas dibezakan sebagai nasihat/strategi, bukan fakta jualan masa lalu.

7. GAYA, NADA & BAHASA:
   - Sapa pengguna dengan sopan sebagai "Puan".
   - Mulakan terus dengan jawapan langsung (direct answer).
   - Gunakan Bahasa Melayu yang santai, mesra, mudah difahami, bebas jargon teknikal. (Jika pengguna bertanya dalam Bahasa Inggeris atau Manglish, jawab dengan bahasa yang sesuai dan mesra).
   - Sasarkan 50–90 patah perkataan untuk soalan lazim. Jika pengguna meminta "Terangkan lagi" / penjelasan panjang, berikan huraian berbutir yang terperinci dan jelas.
   - Akhiri dengan MAKSIMUM SATU soalan susulan yang membina jika sesuai.`
}

export async function handleChatMessage(
  body: ChatRequestBody,
  clientIp = 'default',
  apiKeyOverride?: string | null
): Promise<{ success: boolean; answer?: string; model?: string; error?: string; status?: number }> {
  const apiKey = getGeminiApiKey(apiKeyOverride)
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
