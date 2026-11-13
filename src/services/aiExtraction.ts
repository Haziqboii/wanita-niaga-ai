import type { RawSale } from '../types'
import { getClientSessionId } from './session'

export interface ExtractionResponse {
  success: boolean
  hasSufficientData: boolean
  clarificationMessage: string
  operatingExpenses: number | null
  records: RawSale[]
  originalStory: string
  error?: string
}

export async function extractSalesFromStory(
  storyText: string
): Promise<ExtractionResponse> {
  const trimmed = storyText.trim()
  if (!trimmed) {
    return {
      success: false,
      hasSufficientData: false,
      clarificationMessage: 'Sila ceritakan serba sedikit tentang jualan anda terlebih dahulu.',
      operatingExpenses: null,
      records: [],
      originalStory: '',
      error: 'Sila tulis cerita jualan anda.',
    }
  }

  try {
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

    const response = await fetch('/api/extract', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: JSON.stringify({ story: trimmed, sessionId }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok || !data.success) {
      const errorMsg =
        data.error ||
        'Maaf, pelayan AI menghadapi masalah memproses cerita anda. Sila cuba lagi sebentar lagi.'
      return {
        success: false,
        hasSufficientData: false,
        clarificationMessage: '',
        operatingExpenses: null,
        records: [],
        originalStory: trimmed,
        error: errorMsg,
      }
    }

    // Convert extracted records to RawSale[] format
    const rawSales: RawSale[] = (data.records || []).map((r: any) => ({
      produk: String(r.produk || '').trim(),
      kuantiti: Number(r.kuantiti),
      harga: Number(r.harga),
      kos: r.kos !== null && r.kos !== undefined && r.kos !== '' ? Number(r.kos) : null,
      tarikh: r.tarikh || null,
      saluran: r.saluran || null,
    }))

    return {
      success: true,
      hasSufficientData: Boolean(data.hasSufficientData),
      clarificationMessage: data.clarificationMessage || '',
      operatingExpenses:
        data.operatingExpenses !== null && data.operatingExpenses !== undefined
          ? Number(data.operatingExpenses)
          : null,
      records: rawSales,
      originalStory: trimmed,
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        hasSufficientData: false,
        clarificationMessage: '',
        operatingExpenses: null,
        records: [],
        originalStory: trimmed,
        error:
          'Permintaan mengambil masa terlalu lama (tamat masa). Sila periksa rangkaian internet anda dan cuba lagi.',
      }
    }

    return {
      success: false,
      hasSufficientData: false,
      clarificationMessage: '',
      operatingExpenses: null,
      records: [],
      originalStory: trimmed,
      error:
        'Tidak dapat menghubungi pelayan AI. Pastikan pelayan aplikasi sedang berjalan.',
    }
  }
}
