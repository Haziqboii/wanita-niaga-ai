/**
 * WANITA NIAGA AI — Server-side Intelligent Insights Handler
 *
 * Coordinates Gemini AI interpretation of verified deterministic business insights.
 * Enforces strict anti-hallucination validation before returning results.
 */

import { GoogleGenAI } from '@google/genai'
import { getGeminiApiKey, getGeminiModel } from './chatHandler.ts'
import { globalGeminiQueue } from './queueManager.ts'
import { evaluateInsightQuality, type BusinessReasoningContext } from '../src/calc/insightQuality.ts'

export interface InsightCandidatePayload {
  id: string
  category: string
  title: string
  text: string
  evidence?: {
    products?: string[]
    metrics?: Record<string, any>
  }
}

export interface InterpretedInsight {
  id: string
  category: string
  title: string
  text: string
  icon: 'trending-up' | 'chart-bar' | 'lightbulb' | 'alert-triangle' | 'shopping-bag'
}

export interface InsightsResultPayload {
  success: boolean
  isAI: boolean
  insights: InterpretedInsight[]
  error?: string
}

const CATEGORY_ICON_MAP: Record<string, InterpretedInsight['icon']> = {
  month_change: 'trending-up',
  margin: 'chart-bar',
  concentration: 'shopping-bag',
  channel: 'shopping-bag',
  timing: 'trending-up',
  action: 'lightbulb',
}

/**
 * Interprets pre-calculated deterministic candidates with Gemini AI.
 * Falls back safely to candidates if Gemini is unavailable or validation fails.
 */
function normalizePuanHonorific(str: string): string {
  return str
    .replace(/\bAkak\b/g, 'Puan')
    .replace(/\bakak\b/g, 'Puan')
    .replace(/\bKak\b/g, 'Puan')
    .replace(/\bkak\b/g, 'Puan')
    .replace(/\bMakcik\b/g, 'Puan')
    .replace(/\bmakcik\b/g, 'Puan')
    .replace(/untung bersih seunit/gi, 'untung kasar seunit')
}

export async function handleGenerateInsights(
  candidates: InsightCandidatePayload[],
  clientIp = 'default',
  apiKeyOverride?: string | null
): Promise<InsightsResultPayload> {
  const apiKey = getGeminiApiKey(apiKeyOverride)

  if (!apiKey || candidates.length === 0) {
    return {
      success: false,
      isAI: false,
      insights: candidates.slice(0, 3).map((c) => ({
        id: c.id,
        category: c.category,
        title: normalizePuanHonorific(c.title),
        text: normalizePuanHonorific(c.text),
        icon: CATEGORY_ICON_MAP[c.category] || 'lightbulb',
      })),
    }
  }

  // Infer business context from candidates
  let totalProducts = 0
  for (const c of candidates) {
    if (c.evidence?.metrics?.totalProducts) {
      totalProducts = Number(c.evidence.metrics.totalProducts)
      break
    }
  }
  if (!totalProducts) {
    const prods = new Set<string>()
    for (const c of candidates) {
      if (c.evidence?.products) {
        c.evidence.products.forEach((p) => prods.add(p))
      }
    }
    totalProducts = prods.size
  }

  const context: BusinessReasoningContext = {
    totalProducts,
    hasCostData: candidates.some((c) => c.category === 'margin'),
    hasDateData: candidates.some((c) => c.category === 'timing'),
    hasChannelData: candidates.some((c) => c.category === 'channel'),
    hasInventoryData: false,
    hasBasketData: false,
  }

  // Known valid products in evidence to detect hallucinations
  const validProducts = new Set<string>()
  for (const c of candidates) {
    if (c.evidence?.products) {
      c.evidence.products.forEach((p) => validProducts.add(p.toLowerCase()))
    }
  }

  const prompt = `Anda adalah penasihat perniagaan PKS pintar untuk usahawan wanita Malaysia (Wanita Niaga AI).
Tugasan anda: Berdasarkan bukti penemuan data jualan yang telah disahkan berikut, pilih dan tuliskan tepat 3 "Penemuan Pintar" dalam Bahasa Melayu harian yang sangat mesra dan mudah difahami oleh peniaga kecil.

KONTEKS PERNIAGAAN PUAN:
- Jumlah menu sedia ada: ${totalProducts > 0 ? totalProducts : 'beberapa'} produk.
- PENTING: Puan sudah mempunyai ${totalProducts > 0 ? totalProducts : 'pelbagai'} menu sedia ada. JANGAN SESEKALI menyuruh Puan menambah atau mencipta produk baharu (ini akan meningkatkan kos dan risiko stok tidak laku). Sebaliknya, cadangkan untuk mengoptimumkan menu sedia ada, menguji set gabungan, atau menyemak menu yang kurang sambutan.
- KESELAMATAN KEWANGAN: JANGAN syorkan menambah modal, perbelanjaan, atau stok semata-mata kerana produk laris. JANGAN anggap tumpuan jualan sebagai bahaya. Utamakan tindakan mampu milik seperti memantau sambutan, menjaga kualiti, atau menyemak produk kurang laris sebelum berbelanja.
- ISTILAH KEWANGAN TEPAT: Gunakan istilah "untung kasar seunit" (BUKAN "untung bersih seunit"). JANGAN kelirukan untung kasar dengan untung bersih.
- Tiada data inventori/stok luput: JANGAN buat dakwaan tentang lebihan stok atau pembaziran bahan.
- Tiada data bakul belian: JANGAN buat dakwaan bahawa pelanggan kerap membeli dua produk bersama.

BUKTI ANALISIS YANG DISAHKAN:
${candidates.map((c, i) => `${i + 1}. [Kategori: ${c.category}] Tajuk Asas: ${c.title}\nKeterangan Asas: ${c.text}\nData Bukti: ${JSON.stringify(c.evidence || {})}`).join('\n\n')}

SYARAT KETAT (TASK 8B.3 & PHASE 4.2):
1. Kembalikan MAKSIMUM 3 penemuan sahaja.
2. PANGGILAN PENGGUNA: Sentiasa gunakan panggilan sopan dan hormat "Puan" (contoh: "Puan disarankan...", "Puan boleh...", "jualan Puan..."). JANGAN SESEKALI gunakan perkataan "akak", "kak", atau "makcik".
3. Setiap penemuan ada tajuk mesra dan ringkas (3 hingga 7 patah perkataan).
4. Penerangan 1-2 ayat pendek sahaja (di bawah 30 patah perkataan).
5. Nyatakan apa yang ditemui dan SATU tindakan praktikal kos rendah (contoh: pantau sambutan, buat set kombo dari menu sedia ada, letak produk di hadapan, semak menu kurang laris).
6. Guna Bahasa Melayu harian biasa. ELAKKAN istilah korporat seperti "margin", "revenue concentration", "channel efficiency", atau "growth percentage". Terangkan dalam bahasa mudah (contoh: "untung kasar seunit terbaik", "3 produk utama jana jualan").
7. JANGAN ulang statistik asas seperti jumlah jualan atau untung kasar keseluruhan.
8. Tebalkan **kata kunci penting** untuk memudahkan pembacaan pantas.
9. JANGAN reka produk atau angka baharu yang tiada dalam data bukti di atas.

Kembalikan jawapan HANYA dalam format JSON berikut tanpa sebarang teks tambahan:
{
  "insights": [
    {
      "category": "kategori_dari_bukti",
      "title": "Tajuk Mesra Ringkas (3-7 perkataan)",
      "text": "Penerangan 1-2 ayat dengan panggilan 'Puan', **kata kunci tebal** dan 1 tindakan mudah."
    }
  ]
}`

  try {
    const aiCall = async (): Promise<string> => {
      const ai = new GoogleGenAI({ apiKey })
      const model = getGeminiModel()
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.2, // low temperature for groundedness
          responseMimeType: 'application/json',
        },
      })
      if (!response.text) {
        throw new Error('Respons kosong daripada Gemini.')
      }
      return response.text
    }

    const rawResponse = await globalGeminiQueue.enqueue(clientIp, aiCall)
    if (!rawResponse || typeof rawResponse !== 'string') {
      throw new Error('Respons kosong daripada Gemini.')
    }

    const parsed = JSON.parse(rawResponse)
    const rawList = Array.isArray(parsed) ? parsed : parsed.insights

    if (!Array.isArray(rawList) || rawList.length === 0) {
      throw new Error('Format JSON Gemini tidak sah.')
    }

    const validated: InterpretedInsight[] = []

    for (let i = 0; i < Math.min(rawList.length, 3); i++) {
      const item = rawList[i]
      if (!item.title || !item.text) continue

      const cleanTitle = normalizePuanHonorific(item.title.trim())
      const cleanText = normalizePuanHonorific(item.text.trim())

      const category = item.category || candidates[i]?.category || 'action'

      // Recommendation Quality Gate check
      const qualityCheck = evaluateInsightQuality(
        { title: cleanTitle, text: cleanText, category },
        context
      )
      if (!qualityCheck.valid) {
        continue
      }

      validated.push({
        id: `ai_insight_${i}_${Date.now()}`,
        category,
        title: cleanTitle,
        text: cleanText,
        icon: CATEGORY_ICON_MAP[category] || 'lightbulb',
      })
    }

    if (validated.length >= 2) {
      return {
        success: true,
        isAI: true,
        insights: validated,
      }
    }

    throw new Error('Bilangan penemuan sah tidak mencukupi.')
  } catch {
    // Graceful fallback to deterministic candidates
    return {
      success: true,
      isAI: false,
      insights: candidates.slice(0, 3).map((c) => ({
        id: c.id,
        category: c.category,
        title: normalizePuanHonorific(c.title),
        text: normalizePuanHonorific(c.text),
        icon: CATEGORY_ICON_MAP[c.category] || 'lightbulb',
      })),
    }
  }
}
