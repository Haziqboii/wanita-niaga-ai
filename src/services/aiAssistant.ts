import type { SalesResult, ChatMessage } from '../types'
import { formatRM } from '../data/validate'
import { getClientSessionId } from './session'

export interface SuggestedQuestion {
  id: string
  text: string
  isNumerical: boolean
}

export const BASE_SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { id: 'q1', text: 'Produk mana paling laris?', isNumerical: true },
  { id: 'q2', text: 'Berapakah jumlah jualan saya?', isNumerical: true },
  { id: 'q3', text: 'Produk mana paling banyak memberi keuntungan?', isNumerical: true },
  { id: 'q4', text: 'Bagaimana saya boleh tingkatkan keuntungan?', isNumerical: false },
  { id: 'q5', text: 'Patutkah saya tambah stok?', isNumerical: false },
]

/**
 * Returns adaptive suggested questions based on the user's uploaded/entered sales data.
 */
export function getAdaptiveSuggestedQuestions(result: SalesResult): SuggestedQuestion[] {
  const list = [...BASE_SUGGESTED_QUESTIONS]

  if (result.hasChannelData && result.channels.length > 1) {
    list.push({
      id: 'q_channel',
      text: 'Saluran jualan mana patut saya beri tumpuan?',
      isNumerical: false,
    })
  }

  if (result.operatingExpenses !== null && result.grossProfit !== null) {
    list.push({
      id: 'q_opex',
      text: 'Adakah perbelanjaan operasi saya wajar berbanding untung?',
      isNumerical: false,
    })
  }

  if (!result.hasCostData) {
    list.push({
      id: 'q_cost_tip',
      text: 'Kenapa penting untuk saya catat kos seunit?',
      isNumerical: false,
    })
  }

  return list
}

export interface AssistantResponse {
  answer: string
  isLocalCalculation: boolean
  model?: string
  source: 'local' | 'gemini' | 'error'
  followUps?: string[]
}

/**
 * Derives up to 3 short contextual follow-up chips based on the question and answer content.
 */
export function generateContextualFollowUps(
  question: string,
  answer: string
): string[] {
  const combined = (question + ' ' + answer).toLowerCase()

  if (
    combined.includes('stok') ||
    combined.includes('habis') ||
    combined.includes('baki') ||
    combined.includes('tambah stok')
  ) {
    return ['Terangkan lagi', 'Selalu habis', 'Masih berbaki']
  }

  if (
    combined.includes('untung') ||
    combined.includes('margin') ||
    combined.includes('kos') ||
    combined.includes('jimat') ||
    combined.includes('opex')
  ) {
    return ['Terangkan lagi', 'Macam mana jimat kos?', 'Produk mana untung tinggi?']
  }

  if (
    combined.includes('saluran') ||
    combined.includes('booth') ||
    combined.includes('online') ||
    combined.includes('promosi') ||
    combined.includes('laris')
  ) {
    return ['Terangkan lagi', 'Cara promosi di WhatsApp', 'Fokus booth atau online?']
  }

  return ['Terangkan lagi', 'Cadangan produk lain', 'Apa tindakan seterusnya?']
}

/**
 * Checks if a question can be answered deterministically using local Phase 1 calculations.
 */
export function tryLocalCalculation(
  question: string,
  result: SalesResult
): string | null {
  const q = question.trim().toLowerCase()

  // 1. Produk mana paling laris?
  if (
    q.includes('paling laris') ||
    q.includes('paling laku') ||
    q.includes('terlaris') ||
    q.includes('best seller')
  ) {
    if (!result.bestSeller || result.products.length === 0) {
      return 'Tiada rekod produk ditemui untuk menentukan produk paling laris.'
    }
    const bs = result.bestSeller
    return `Produk paling laris ialah ${bs.produk} dengan ${bs.kuantiti.toLocaleString()} unit terjual (menghasilkan jumlah jualan ${formatRM(bs.revenue)}).`
  }

  // 2. Berapakah jumlah jualan saya?
  if (
    q.includes('jumlah jualan') ||
    q.includes('berapa jualan') ||
    q.includes('total jualan') ||
    q.includes('hasil jualan') ||
    q.includes('jumlah pendapatan')
  ) {
    return `Jumlah jualan anda ialah ${formatRM(result.totalRevenue)} dengan sejumlah ${result.totalKuantiti.toLocaleString()} unit produk terjual merentasi ${result.recordCount} rekod transaksi.`
  }

  // 3. Produk mana paling banyak memberi keuntungan?
  if (
    (q.includes('untung') || q.includes('keuntungan') || q.includes('profit')) &&
    (q.includes('paling banyak') || q.includes('tertinggi') || /\bmana\b/.test(q)) &&
    !q.includes('bagaimana') &&
    !q.includes('cara') &&
    !q.includes('tingkat')
  ) {
    if (!result.hasCostData || !result.costComplete) {
      return 'Maklumat kos diperlukan untuk mengira keuntungan. Sila masukkan atau lengkapkan kos seunit bagi setiap produk dalam data jualan anda.'
    }

    if (!result.highestProfit) {
      return 'Tiada data keuntungan produk yang mencukupi untuk dihitung.'
    }

    const hp = result.highestProfit
    const marginStr =
      hp.profitMarginPercent !== null
        ? ` dengan margin untung kasar sekitar ${hp.profitMarginPercent.toFixed(1)}%`
        : ''

    return `Produk yang paling banyak memberi keuntungan ialah ${hp.produk} dengan anggaran untung kasar sebanyak ${formatRM(hp.grossProfit)}${marginStr} (Jualan: ${formatRM(hp.revenue)}, Anggaran Kos: ${formatRM(hp.cost)}).`
  }

  return null
}

/**
 * Prepares privacy-safe aggregated business payload for Gemini context.
 * No customer personal data is ever collected or sent.
 */
function prepareBusinessContext(result: SalesResult) {
  return {
    totalRevenue: result.totalRevenue,
    totalKuantiti: result.totalKuantiti,
    grossProfit: result.grossProfit,
    operatingExpenses: result.operatingExpenses,
    estimatedNetProfit: result.estimatedNetProfit,
    hasCostData: result.hasCostData,
    costComplete: result.costComplete,
    hasDateData: result.hasDateData,
    hasChannelData: result.hasChannelData,
    recordCount: result.recordCount,
    products: result.products.map((p) => ({
      produk: p.produk,
      kuantiti: p.kuantiti,
      revenue: p.revenue,
      cost: p.cost,
      grossProfit: p.grossProfit,
      profitMarginPercent: p.profitMarginPercent,
    })),
    channels: result.channels.map((c) => ({
      saluran: c.saluran,
      kuantiti: c.kuantiti,
      revenue: c.revenue,
      percentage: c.percentage,
    })),
    trends: result.trends.map((t) => ({
      tarikh: t.tarikh,
      displayTarikh: t.displayTarikh,
      revenue: t.revenue,
      kuantiti: t.kuantiti,
    })),
  }
}

/**
 * Unified assistant handler:
 * 1. Checks local calculation engine for simple arithmetic questions.
 * 2. Routes open-ended recommendations, advice, and explanations to Gemini API backend.
 */
export async function getAssistantResponse(
  question: string,
  result: SalesResult,
  chatHistory: ChatMessage[] = []
): Promise<AssistantResponse> {
  const trimmed = question.trim()

  // 1. Check local engine first (saves API quota and responds instantly)
  const localAnswer = tryLocalCalculation(trimmed, result)
  if (localAnswer) {
    // Brief artificial delay for smooth transition
    await new Promise((r) => setTimeout(r, 200))
    const followUps = generateContextualFollowUps(trimmed, localAnswer)
    return {
      answer: localAnswer,
      isLocalCalculation: true,
      source: 'local',
      followUps,
    }
  }

  // 2. Call backend Gemini API endpoint
  try {
    const historyPayload = chatHistory.slice(-6).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      text: msg.text,
    }))

    const contextPayload = prepareBusinessContext(result)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25s timeout

    const sessionId = getClientSessionId()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-session-id': sessionId,
    }
    const customKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null
    if (customKey && customKey.trim()) {
      headers['x-gemini-api-key'] = customKey.trim()
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: trimmed,
        sessionId,
        history: historyPayload,
        context: contextPayload,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok || !data.success) {
      const errorMsg =
        data.error ||
        'Maaf, pelayan AI menghadapi masalah sementara. Sila cuba lagi kemudian.'
      return {
        answer: errorMsg,
        isLocalCalculation: false,
        source: 'error',
      }
    }

    const followUps = generateContextualFollowUps(trimmed, data.answer)
    return {
      answer: data.answer,
      isLocalCalculation: false,
      model: data.model,
      source: 'gemini',
      followUps,
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        answer:
          'Permintaan mengambil masa terlalu lama (tamat masa). Sila periksa rangkaian internet anda dan cuba lagi.',
        isLocalCalculation: false,
        source: 'error',
      }
    }

    return {
      answer:
        'Tidak dapat menghubungi pelayan AI. Pastikan pelayan aplikasi sedang berjalan dan sambungan internet aktif.',
      isLocalCalculation: false,
      source: 'error',
    }
  }
}
