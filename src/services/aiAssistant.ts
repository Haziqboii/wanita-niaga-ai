import type {
  SalesResult,
  ChatMessage,
  MonthlyComparison,
  MonthOption,
  ValidatedSale,
} from '../types'
import { formatRM } from '../data/validate'
import { getClientSessionId } from './session'
import {
  calculateWeekdayAnalytics,
  calculateDailyAnalytics,
  calculateMultiMonthBreakdown,
} from '../calc/analytics'

export interface AssistantOptions {
  selectedPeriod?: string
  allResult?: SalesResult
  monthlyComparison?: MonthlyComparison | null
  availableMonths?: MonthOption[]
  allRecords?: ValidatedSale[]
}

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
 * Checks if a question can be answered deterministically using local calculations.
 * Implements strict Intent Hierarchy:
 * Priority A: Product-specific questions (Quantity, Revenue, Profit, or Specific Product)
 * Priority B: Business-wide Financial Metrics (Total Revenue, Total Units, Gross Profit, Net Profit, Product Count)
 * Priority C: Advice / Open-ended / Ambiguous requests -> Return null to allow Gemini fallback
 */
export function tryLocalCalculation(
  question: string,
  result: SalesResult,
  options?: AssistantOptions
): string | null {
  const raw = question.trim()
  if (!raw) return null

  // Normalize text: lowercase, remove punctuation, collapse whitespace
  const norm = raw
    .toLowerCase()
    .replace(/[?!.,;:'"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Guard: Questions requiring explanations, methodology, data provenance, reasoning, hypotheticals, advice, or conversational follow-up
  // MUST be routed to Gemini with full business context and conversation history.
  const isConversationalOrExplanation =
    /\b(bagaimana|macam mana|cara|tips|cadangan|kenapa|mengapa|sebab|why|how (can|do|did|is|to|should|would)|improve|tingkatkan|naikkan|strategi|advice|suggest|pendapat)\b/i.test(
      norm
    ) ||
    /\b(mengira|dikira|calculate|calculated|kiraan|formula)\b/i.test(norm) ||
    /\b(data apa|sumber|dari mana|source|where did you get|rujukan|gunakan|what data)\b/i.test(norm) ||
    /\b(kalau|jika|sekiranya|what if|assuming|andaikan|naik harga|turun harga|naikkan harga|turunkan harga)\b/i.test(norm) ||
    /\b(terangkan|jelaskan|explain|elaborate|huraikan)\b/i.test(norm) ||
    /\b(kenapa macam tu|explain lagi|terangkan lagi|yang tadi|itu sahaja|betul ke|are you sure)\b/i.test(norm)

  if (isConversationalOrExplanation) {
    return null
  }

  // Guard: Empty dataset
  if (!result || result.recordCount === 0 || !result.products || result.products.length === 0) {
    if (
      /\b(jualan|sales|revenue|unit|kuantiti|untung|profit|produk|product)\b/i.test(
        norm
      )
    ) {
      return 'Tiada rekod data jualan ditemui untuk membuat pengiraan.'
    }
    return null
  }

  // Helper to obtain multi-month breakdown
  const getMonthSummaries = () => {
    if (options?.allRecords && options?.availableMonths && options.availableMonths.length > 0) {
      return calculateMultiMonthBreakdown(options.allRecords, options.availableMonths)
    }
    return []
  }

  // 0A. Multi-Month Awareness Intent (e.g. "Do you have sales for both months?", "Ada data untuk kedua-dua bulan?", "Do you have data for both September and October?")
  const isMultiMonthAwareness =
    !/\b(berapa|jumlah|apakah|total|how much)\b/i.test(norm) &&
    (/\b(both months?|dua-dua bulan|kedua-dua bulan|both september and october|kedua bulan|data kedua-dua|data dua-dua)\b/i.test(norm) ||
      (/\b(ada|have|adakah|rekod|data)\b/i.test(norm) &&
        /\b(dua|both|kedua-dua|semua)\b/i.test(norm) &&
        /\b(bulan|month|months)\b/i.test(norm)))

  if (isMultiMonthAwareness) {
    const summaries = getMonthSummaries()
    if (summaries.length > 1) {
      const monthDetails = summaries
        .map((m) => `${m.label}: ${formatRM(m.revenue)} (${m.recordCount} rekod, ${m.kuantiti.toLocaleString()} unit)`)
        .join(' dan ')
      const totalRev = options?.allResult?.totalRevenue ?? result.totalRevenue
      return `Ya Puan, sistem mempunyai data jualan lengkap untuk kedua-dua bulan (${summaries.map((m) => m.label).join(' dan ')}):\n- ${monthDetails}.\nJumlah jualan keseluruhan bagi kedua-dua bulan ialah ${formatRM(totalRev)}.`
    }
    return `Sistem kini memuatkan data bagi tempoh ${options?.selectedPeriod || 'semasa'}.`
  }

  // 0B. Specific Month Sales Intent (e.g. "What were my September sales?", "Berapa jualan bulan September?", "Berapa jualan Oktober?")
  const specificMonthMatch =
    norm.match(/\b(september|oktober|sep|okt)\b/i) &&
    /\b(jualan|sales|revenue|kutipan|berapa|what)\b/i.test(norm) &&
    !/\b(banding|bandingkan|perbandingan|compare|difference|produk|product|laris|juara|terbaik|best)\b/i.test(norm)

  if (specificMonthMatch) {
    const monthTarget = norm.match(/\b(september|oktober|sep|okt)\b/i)![0].toLowerCase()
    const summaries = getMonthSummaries()
    const found = summaries.find((m) =>
      m.label.toLowerCase().includes(monthTarget) || m.fullName.toLowerCase().includes(monthTarget)
    )
    if (found) {
      return `Jumlah jualan anda bagi bulan ${found.fullName} ialah ${formatRM(found.revenue)} dengan sejumlah ${found.kuantiti.toLocaleString()} unit produk terjual merentasi ${found.recordCount} rekod transaksi${found.grossProfit !== null ? ` (Untung Kasar: ${formatRM(found.grossProfit)})` : ''}.`
    }
  }

  // 0C. Monthly Comparison Intent (e.g. "Bandingkan September dan Oktober", "Compare September and October sales", "Perbandingan jualan bulan", "Berapa peningkatan jualan?")
  const isComparisonQuery =
    (/\b(banding|bandingkan|perbandingan|compare|comparison)\b/i.test(norm) &&
      /\b(bulan|month|sep|okt|september|oktober|sales|jualan)\b/i.test(norm)) ||
    (/\b(peningkatan|penurunan|perubahan|difference|increase|decrease)\b/i.test(norm) &&
      /\b(bulan|month|jualan|sales)\b/i.test(norm))

  if (isComparisonQuery) {
    if (options?.monthlyComparison) {
      const mc = options.monthlyComparison
      if (mc.previousMonthLabel && mc.previousRevenue !== null) {
        return `Perbandingan Jualan Bulanan:\n${mc.summaryText} (${mc.currentMonthLabel}: ${formatRM(mc.currentRevenue)}, ${mc.previousMonthLabel}: ${formatRM(mc.previousRevenue)}).`
      }
      return `Perbandingan Jualan Bulanan:\n${mc.summaryText}`
    }
    const summaries = getMonthSummaries()
    if (summaries.length >= 2) {
      const m1 = summaries[0]
      const m2 = summaries[1]
      const diff = m2.revenue - m1.revenue
      const pct = m1.revenue > 0 ? (diff / m1.revenue) * 100 : 0
      const isInc = diff >= 0
      return `Perbandingan Jualan Bulanan:\nJualan bulan ${m2.label} ${isInc ? 'meningkat' : 'menurun'} sebanyak ${formatRM(Math.abs(diff))} (${Math.abs(pct).toFixed(1)}%) berbanding ${m1.label} (${m2.label}: ${formatRM(m2.revenue)}, ${m1.label}: ${formatRM(m1.revenue)}).`
    }
  }

  // 0D. Product Performance in Each Month Intent (e.g. "Which product performed best in each month?", "Produk apa paling laris pada setiap bulan?")
  const isProductPerMonth =
    (/\b(produk|product)\b/i.test(norm) &&
      /\b(setiap bulan|each month|setiap tempoh|every month|per month)\b/i.test(norm) &&
      /\b(terbaik|paling laris|best|laris|tertinggi|performance|prestasi)\b/i.test(norm)) ||
    /\b(which product performed best in each month)\b/i.test(norm)

  if (isProductPerMonth) {
    const summaries = getMonthSummaries()
    if (summaries.length > 0) {
      const lines = summaries.map((m) => {
        const qtyPart = m.bestSellerQty
          ? `Paling Banyak Terjual: ${m.bestSellerQty.produk} (${m.bestSellerQty.kuantiti.toLocaleString()} unit)`
          : 'Paling Banyak Terjual: Tiada rekod'
        const revPart = m.bestSellerRev
          ? `Hasil Jualan Tertinggi: ${m.bestSellerRev.produk} (${formatRM(m.bestSellerRev.revenue)})`
          : 'Hasil Jualan Tertinggi: Tiada rekod'
        return `• ${m.fullName}:\n  - ${qtyPart}\n  - ${revPart}`
      })
      return `Prestasi Produk Terbaik Mengikut Bulan:\n${lines.join('\n')}`
    }
  }

  // 0E. Weekday Intelligence Intent (e.g. "Usually which day of the week has the highest sales?", "Hari apa jualan saya biasanya paling tinggi?", "Adakah hujung minggu lebih menguntungkan?", "Bandingkan Isnin dan Sabtu")
  const isWeekdayQuery =
    (/\b(hari apa|which day|day of the week|hari biasa|hari jualan)\b/i.test(norm) &&
      /\b(tinggi|tertinggi|paling tinggi|highest|best|banyak|most|laris)\b/i.test(norm)) ||
    /\b(hujung minggu|weekend|hari bekerja|weekdays?)\b/i.test(norm) ||
    (/\b(banding|bandingkan|compare)\b/i.test(norm) &&
      /\b(isnin|selasa|rabu|khamis|jumaat|sabtu|ahad|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(norm))

  if (isWeekdayQuery) {
    if (!result.hasDateData && (!options?.allRecords || options.allRecords.every((r) => !r.tarikh))) {
      return 'Tiada data tarikh jualan dalam rekod perniagaan anda untuk menjana analisis hari atau hujung minggu.'
    }
    const weekdayAnalytics = calculateWeekdayAnalytics(options?.allRecords || [])
    if (!weekdayAnalytics.hasDateData || !weekdayAnalytics.highestRevenueDay) {
      return 'Tiada data tarikh jualan yang sah untuk menganalisis jualan mengikut hari.'
    }

    // Checking Isnin vs Sabtu or specific day comparison
    const hasMon = /\b(isnin|monday)\b/i.test(norm)
    const hasSat = /\b(sabtu|saturday)\b/i.test(norm)
    if (hasMon && hasSat) {
      const mon = weekdayAnalytics.days.find((d) => d.dayIndex === 1)
      const sat = weekdayAnalytics.days.find((d) => d.dayIndex === 6)
      const monRev = mon ? formatRM(mon.revenue) : 'RM0.00'
      const satRev = sat ? formatRM(sat.revenue) : 'RM0.00'
      const monAvg = mon ? formatRM(mon.avgRevenuePerDate) : 'RM0.00'
      const satAvg = sat ? formatRM(sat.avgRevenuePerDate) : 'RM0.00'
      return `Perbandingan Hari Isnin dan Sabtu:\n- Isnin: Jumlah ${monRev} (purata ${monAvg} sehari, ${mon?.distinctDatesCount || 0} hari).\n- Sabtu: Jumlah ${satRev} (purata ${satAvg} sehari, ${sat?.distinctDatesCount || 0} hari).`
    }

    // Weekend query
    if (/\b(hujung minggu|weekend|hari bekerja)\b/i.test(norm) && /\b(untung|menguntungkan|profitable|lebih|banding|compare)\b/i.test(norm)) {
      return `Analisis Hujung Minggu vs Hari Bekerja:\n- Jualan Hujung Minggu (Sabtu & Ahad): ${formatRM(weekdayAnalytics.weekendRevenue)} (${weekdayAnalytics.weekendPercentage}% daripada jualan, purata ${formatRM(weekdayAnalytics.avgWeekendDailyRevenue)} sehari bagi ${weekdayAnalytics.weekendRecordedDates} hari).\n- Jualan Hari Bekerja (Isnin - Jumaat): ${formatRM(weekdayAnalytics.weekdayRevenue)} (purata ${formatRM(weekdayAnalytics.avgWeekdayDailyRevenue)} sehari bagi ${weekdayAnalytics.weekdayRecordedDates} hari).\n${weekdayAnalytics.isWeekendMoreProfitable ? 'Ya, hujung minggu mencatatkan purata jualan harian yang lebih tinggi berbanding hari bekerja.' : 'Hari bekerja mencatatkan purata jualan harian yang lebih konsisten atau lebih tinggi berbanding hujung minggu.'}`
    }

    // Highest day query
    const topDay = weekdayAnalytics.highestRevenueDay
    return `Berdasarkan rekod jualan anda, hari yang biasanya mencatatkan jualan paling tinggi ialah ${topDay.nameMY} dengan jumlah jualan sebanyak ${formatRM(topDay.revenue)} (purata ${formatRM(topDay.avgRevenuePerDate)} sehari merentasi ${topDay.distinctDatesCount} hari ${topDay.nameMY} yang direkodkan).`
  }

  // 0F. Date Intelligence Intent (e.g. "Which date generated the highest revenue?", "Tarikh mana mencatatkan jualan tertinggi?")
  const isTopDateQuery =
    /\b(tarikh|date|hari bulan)\b/i.test(norm) &&
    /\b(tertinggi|paling tinggi|highest|top|paling banyak|max|terbanyak)\b/i.test(norm) &&
    /\b(jualan|hasil|revenue|sales)\b/i.test(norm)

  if (isTopDateQuery) {
    if (!result.hasDateData && (!options?.allRecords || options.allRecords.every((r) => !r.tarikh))) {
      return 'Tiada data tarikh jualan dalam rekod perniagaan anda untuk menentukan tarikh jualan tertinggi.'
    }
    const dailyAnalytics = calculateDailyAnalytics(options?.allRecords || [])
    if (!dailyAnalytics.hasDateData || !dailyAnalytics.highestRevenueDate) {
      return 'Tiada data tarikh jualan yang sah untuk menentukan tarikh jualan tertinggi.'
    }
    const td = dailyAnalytics.highestRevenueDate
    return `Tarikh yang mencatatkan jumlah jualan tertinggi ialah pada ${td.displayTarikh} dengan jumlah jualan sebanyak ${formatRM(td.revenue)} (${td.kuantiti.toLocaleString()} unit terjual merentasi ${td.recordCount} rekod transaksi).`
  }

  // =========================================================================
  // PRIORITY A: PRODUCT-SPECIFIC QUESTIONS
  // =========================================================================

  // A0. Product Existence Check (e.g. "Adakah Popia Sira termasuk dalam jualan saya?", "Ada jual Karipap?", "Is Popia Sira in my sales?")
  const existenceMatch =
    norm.match(/^(?:adakah|ada)\s+(?:produk\s+)?(.+?)\s+(?:termasuk dalam|ada dalam|wujud dalam|ada di|dalam)\s+(?:rekod|jualan|data)(?:\s+saya|\s+kami)?$/i) ||
    norm.match(/^(?:adakah|ada)\s+(?:saya|kami)?\s*(?:menjual|jual)\s+(?:produk\s+)?(.+?)(?:\s+ke|\s+tak|\s+dalam jualan)?$/i) ||
    norm.match(/^(?:adakah|ada)\s+(?:produk\s+)?(.+?)(?:\s+ada|\s+wujud|\s+dijual)?\s+(?:dalam jualan|dalam rekod)(?:\s+saya|\s+kami)?$/i) ||
    norm.match(/^(?:is|are)\s+(.+?)\s+(?:included in|in)\s+(?:my|our)\s+(?:sales|records)/i) ||
    norm.match(/^(?:do i sell|do we sell)\s+(.+?)(?:\s+in my sales|\s+in our sales)?$/i)

  if (existenceMatch) {
    const rawTarget = existenceMatch[1].trim()
    const target = rawTarget.replace(/^(?:produk|item)\s+/i, '').trim()
    const found = result.products.find(
      (p) => p.produk.toLowerCase() === target || target.includes(p.produk.toLowerCase())
    )
    if (found) {
      return `Ya Puan, produk ${found.produk} ada dalam rekod jualan Puan (${found.kuantiti.toLocaleString()} unit terjual dengan jumlah jualan ${formatRM(found.revenue)}).`
    } else {
      const titleCandidate = target
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
      return `Tidak Puan, produk ${titleCandidate} tidak ditemui dalam rekod jualan semasa.`
    }
  }

  // A0.5 Dual Champions Query (e.g. "Apakah dua produk juara?", "Paling laris dan jualan tertinggi?", "Dual champions")
  const isDualChampion =
    /\b(dua produk juara|dual champions?|juara jualan|kedua-dua juara)\b/i.test(norm) ||
    (/\b(paling laris|paling banyak terjual)\b/i.test(norm) &&
      /\b(hasil|jualan)\b/i.test(norm) &&
      /\b(tertinggi|highest)\b/i.test(norm))

  if (isDualChampion && result.bestSeller && result.highestRevenue) {
    const periodLabel =
      options?.selectedPeriod && options.selectedPeriod !== 'Semua' && options.selectedPeriod !== 'ALL'
        ? ` bagi bulan ${options.selectedPeriod}`
        : ''
    if (result.bestSeller.produk === result.highestRevenue.produk) {
      return `Bagi tempoh${periodLabel ? periodLabel : ' ini'}, ${result.bestSeller.produk} adalah juara berganda: paling banyak terjual (${result.bestSeller.kuantiti.toLocaleString()} unit) dan menjana hasil jualan tertinggi (${formatRM(result.highestRevenue.revenue)}).`
    }
    return `Bagi tempoh${periodLabel ? periodLabel : ' ini'}, juara jualan terbahagi kepada dua kategori:\n1. Paling Banyak Terjual (Kuantiti): ${result.bestSeller.produk} (${result.bestSeller.kuantiti.toLocaleString()} unit)\n2. Hasil Jualan Tertinggi (RM): ${result.highestRevenue.produk} (${formatRM(result.highestRevenue.revenue)})`
  }

  // A1. Best-Selling Product by Quantity (Most units sold / Paling laris / Paling laku / Paling banyak terjual)
  const isBestSellerByQty =
    (/\b(paling laris|paling laku|terlaris|best seller|best selling|sold the most|most units?|banyak terjual|terbanyak terjual|paling banyak terjual|kuantiti terbanyak|kuantiti tertinggi|best-selling product by units|best selling product by units)\b/i.test(
      norm
    ) ||
    (/\b(produk|product|item)\b/i.test(norm) &&
      /\b(laris|laku|kuantiti|quantity|units?)\b/i.test(norm) &&
      /\b(paling|most|highest|tertinggi|banyak)\b/i.test(norm) &&
      !/\b(hasil|revenue|rm|wang|nilai)\b/i.test(norm))) &&
    !/\b(kategori|category|kaedah|saluran|channel)\b/i.test(norm)

  if (isBestSellerByQty) {
    if (!result.bestSeller) {
      return 'Tiada rekod produk ditemui untuk menentukan produk paling laris.'
    }
    const bs = result.bestSeller
    const periodLabel =
      options?.selectedPeriod && options.selectedPeriod !== 'Semua' && options.selectedPeriod !== 'ALL'
        ? ` bagi bulan ${options.selectedPeriod}`
        : ''
    const tiedQty = result.products.filter((p) => p.kuantiti === bs.kuantiti)
    if (tiedQty.length > 1) {
      const names = tiedQty.map((p) => p.produk).join(' dan ')
      return `Produk paling banyak terjual${periodLabel} adalah seri antara ${names} dengan ${bs.kuantiti.toLocaleString()} unit terjual setiap satu.`
    }
    return `Produk paling laris mengikut kuantiti${periodLabel} ialah ${bs.produk} dengan ${bs.kuantiti.toLocaleString()} unit terjual (menghasilkan jumlah jualan ${formatRM(bs.revenue)}).`
  }

  // A2. Highest Sales Revenue Product (Most RM / Jualan tertinggi / Highest sales product / Hasil jualan tertinggi)
  const isHighestRevenueProduct =
    (/\b(highest revenue|top revenue|highest sales product|top sales product|most rm|kutipan tertinggi|hasil jualan tertinggi|jualan paling tinggi|highest revenue product|hasil tertinggi)\b/i.test(
      norm
    ) ||
    (/\b(produk|product|item|which|mana|apa)\b/i.test(norm) &&
      /\b(jualan|sales|revenue|hasil|kutipan)\b/i.test(norm) &&
      /\b(paling tinggi|tertinggi|highest|top|most)\b/i.test(norm) &&
      !/\b(untung|profit|margin)\b/i.test(norm))) &&
    !/\b(kategori|category|kaedah|saluran|channel)\b/i.test(norm)

  if (isHighestRevenueProduct) {
    if (!result.highestRevenue) {
      return 'Tiada rekod produk ditemui untuk menentukan produk jualan tertinggi.'
    }
    const hr = result.highestRevenue
    const periodLabel =
      options?.selectedPeriod && options.selectedPeriod !== 'Semua' && options.selectedPeriod !== 'ALL'
        ? ` bagi bulan ${options.selectedPeriod}`
        : ''
    const tiedRev = result.products.filter((p) => p.revenue === hr.revenue)
    if (tiedRev.length > 1) {
      const names = tiedRev.map((p) => p.produk).join(' dan ')
      return `Produk yang menghasilkan hasil jualan tertinggi${periodLabel} adalah seri antara ${names} dengan jumlah jualan ${formatRM(hr.revenue)} setiap satu.`
    }
    return `Produk yang menghasilkan jumlah jualan paling tinggi${periodLabel} ialah ${hr.produk} dengan jumlah jualan sebanyak ${formatRM(hr.revenue)} (${hr.kuantiti.toLocaleString()} unit terjual).`
  }

  // A3. Highest Gross Profit Product (Most profitable product / Paling untung)
  const isHighestProfitProduct =
    /\b(most profitable|highest profit product|top profit product|paling untung|keuntungan tertinggi|untung kasar tertinggi)\b/i.test(
      norm
    ) ||
    (/\b(produk|product|item|which|mana|apa)\b/i.test(norm) &&
      /\b(untung|keuntungan|profit)\b/i.test(norm) &&
      /\b(paling|tertinggi|highest|top|banyak|most)\b/i.test(norm))

  if (isHighestProfitProduct) {
    if (!result.hasCostData || !result.costComplete) {
      return 'Maklumat kos diperlukan untuk mengira keuntungan produk. Sila lengkapkan kos seunit bagi setiap produk dalam data jualan anda.'
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

  // A4. Specific Named Product Inquiry (e.g. "Karipap sold how many?", "How much profit did Brownies make?", "Jualan Popia")
  const matchedProduct = result.products.find((p) => {
    const pLower = p.produk.toLowerCase()
    return norm.includes(pLower)
  })

  if (matchedProduct) {
    // If asking about profit of this product
    if (/\b(untung|profit|margin|keuntungan)\b/i.test(norm)) {
      if (matchedProduct.grossProfit !== null) {
        const marginStr =
          matchedProduct.profitMarginPercent !== null
            ? ` (margin untung kasar ${matchedProduct.profitMarginPercent.toFixed(1)}%)`
            : ''
        return `Produk ${matchedProduct.produk} mencatatkan anggaran untung kasar sebanyak ${formatRM(matchedProduct.grossProfit)}${marginStr} daripada jualan ${formatRM(matchedProduct.revenue)}.`
      }
      return `Maklumat kos bagi produk ${matchedProduct.produk} tidak lengkap dalam rekod untuk mengira untung kasar. Jualannya ialah ${formatRM(matchedProduct.revenue)} (${matchedProduct.kuantiti.toLocaleString()} unit).`
    }

    // If asking about quantity of this product
    if (/\b(kuantiti|quantity|units?|biji|bungkus|how many|bilangan|terjual|sold)\b/i.test(norm)) {
      return `Sebanyak ${matchedProduct.kuantiti.toLocaleString()} unit produk ${matchedProduct.produk} telah terjual dengan jumlah jualan sebanyak ${formatRM(matchedProduct.revenue)}.`
    }

    // General sales of this product
    if (/\b(jualan|sales|revenue|hasil|berapa)\b/i.test(norm)) {
      return `Produk ${matchedProduct.produk} mencatatkan jumlah jualan sebanyak ${formatRM(matchedProduct.revenue)} dengan ${matchedProduct.kuantiti.toLocaleString()} unit terjual.`
    }
  }

  // =========================================================================
  // PRIORITY B: BUSINESS-WIDE FINANCIAL METRICS
  // =========================================================================

  // B1. Number of Distinct Product Types
  const isProductCount =
    /\b(berapa jenis|berapa produk|how many types of products?|how many products?|jumlah jenis produk)\b/i.test(
      norm
    ) ||
    (/\b(berapa|how many|jumlah)\b/i.test(norm) &&
      /\b(jenis|types?)\b/i.test(norm) &&
      /\b(produk|products?|barang|item)\b/i.test(norm))

  if (isProductCount) {
    return `Puan mempunyai sebanyak ${result.products.length} jenis produk yang direkodkan dalam sistem jualan ini.`
  }

  // B2. Total Units Sold (Across entire business)
  const isTotalUnits =
    /\b(total units? sold|how many units sold overall|total kuantiti terjual|jumlah unit terjual|jumlah kuantiti terjual)\b/i.test(
      norm
    ) ||
    (/\b(berapa|jumlah|total|how many)\b/i.test(norm) &&
      /\b(unit|kuantiti|bilangan)\b/i.test(norm) &&
      /\b(terjual|sold|keseluruhan|semua)\b/i.test(norm))

  if (isTotalUnits) {
    return `Jumlah kuantiti produk yang berjaya dijual ialah sebanyak ${result.totalKuantiti.toLocaleString()} unit merentasi ${result.products.length} jenis produk.`
  }

  // B3. Estimated Net Profit (Untung Bersih) - Check before Gross Profit
  const isNetProfit =
    /\b(untung bersih|net profit|anggaran untung bersih)\b/i.test(norm) ||
    (/\b(untung|profit)\b/i.test(norm) && /\b(bersih|net)\b/i.test(norm))

  if (isNetProfit) {
    if (result.grossProfit === null) {
      return 'Untung bersih tidak dapat dikira kerana maklumat kos produk tidak lengkap untuk menentukan untung kasar.'
    }
    if (result.operatingExpenses === null || result.estimatedNetProfit === null) {
      return 'Sila masukkan perbelanjaan operasi (seperti sewa, utiliti, atau pengangkutan) untuk membolehkan sistem mengira anggaran untung bersih Puan.'
    }
    return `Anggaran untung bersih Puan ialah sebanyak ${formatRM(result.estimatedNetProfit)} (Untung Kasar: ${formatRM(result.grossProfit)} ditolak Perbelanjaan Operasi: ${formatRM(result.operatingExpenses)}).`
  }

  // B4. Gross Profit (Untung Kasar)
  const isGrossProfit =
    /\b(untung kasar|gross profit|jumlah untung kasar|total untung kasar|keuntungan kasar)\b/i.test(
      norm
    ) ||
    (/\b(untung|profit|keuntungan)\b/i.test(norm) &&
      /\b(kasar|gross)\b/i.test(norm))

  if (isGrossProfit) {
    if (!result.hasCostData || !result.costComplete || result.grossProfit === null) {
      return 'Maklumat kos tidak lengkap dalam data jualan anda untuk mengira jumlah untung kasar.'
    }
    return `Jumlah untung kasar Puan ialah sebanyak ${formatRM(result.grossProfit)} (Jualan: ${formatRM(result.totalRevenue)}, Anggaran Kos: ${formatRM(result.totalCost)}).`
  }

  // B5. Total Business Revenue (Total Sales / Jumlah Jualan Keseluruhan)
  const isTotalRevenue =
    /\b(total sales|total revenue|overall revenue|overall sales|jumlah jualan|total jualan|hasil jualan keseluruhan|jumlah pendapatan)\b/i.test(
      norm
    ) ||
    (/\b(berapa|apakah)\b/i.test(norm) &&
      /\b(jumlah jualan|total sales|total jualan|hasil jualan)\b/i.test(norm)) ||
    (/\b(berapa|apakah|jumlah|total)\b/i.test(norm) &&
      /\b(jualan|sales|revenue)\b/i.test(norm) &&
      /\b(keseluruhan|semua|kedai|kedai saya|bisnes|perniagaan|saya)\b/i.test(norm) &&
      !/\b(produk|product|item|termasuk|adakah|ada|mana|apa)\b/i.test(norm))

  if (isTotalRevenue) {
    const isFiltered = Boolean(
      options?.selectedPeriod &&
      options.selectedPeriod !== 'Semua' &&
      options.selectedPeriod !== 'ALL'
    )
    const isExplicitAllTime =
      /\b(keseluruhan|semua bulan|all time|all-time|sepanjang masa|keseluruhan kedai)\b/i.test(norm)

    if (isFiltered && isExplicitAllTime && options?.allResult) {
      return `Jumlah jualan keseluruhan (semua bulan) ialah ${formatRM(options.allResult.totalRevenue)} dengan sejumlah ${options.allResult.totalKuantiti.toLocaleString()} unit produk terjual merentasi ${options.allResult.recordCount} rekod transaksi.`
    }

    if (isFiltered && options?.selectedPeriod) {
      return `Jumlah jualan anda bagi bulan ${options.selectedPeriod} ialah ${formatRM(result.totalRevenue)} dengan sejumlah ${result.totalKuantiti.toLocaleString()} unit produk terjual merentasi ${result.recordCount} rekod transaksi.`
    }

    return `Jumlah jualan anda ialah ${formatRM(result.totalRevenue)} dengan sejumlah ${result.totalKuantiti.toLocaleString()} unit produk terjual merentasi ${result.recordCount} rekod transaksi.`
  }

  // B6. Category Insights Intent (e.g. "Kategori apa paling tinggi jualan?", "Berapa jualan kategori Biskut?")
  const isCategoryQuery =
    /\b(kategori|category|categories)\b/i.test(norm) &&
    !/\b(bagaimana|why|kenapa|cadangan|tips|nasihat|how)\b/i.test(norm)

  if (isCategoryQuery && result.hasCategoryData && result.categories && result.categories.length > 0) {
    if (/\b(tertinggi|paling tinggi|paling banyak|paling laris|top|highest|best)\b/i.test(norm)) {
      const topCat = result.categories[0]
      return `Kategori yang menjana jualan tertinggi ialah ${topCat.kategori} dengan jumlah jualan sebanyak ${formatRM(topCat.revenue)} (${topCat.kuantiti.toLocaleString()} unit terjual, ${topCat.percentage.toFixed(1)}% daripada jualan).`
    }
    for (const cat of result.categories) {
      if (norm.toLowerCase().includes(cat.kategori.toLowerCase())) {
        return `Kategori ${cat.kategori} mencatatkan jumlah jualan sebanyak ${formatRM(cat.revenue)} (${cat.kuantiti.toLocaleString()} unit terjual, ${cat.percentage.toFixed(1)}% daripada keseluruhan jualan).`
      }
    }
    const catList = result.categories.map((c) => `${c.kategori}: ${formatRM(c.revenue)} (${c.kuantiti.toLocaleString()} unit)`).join(', ')
    return `Perniagaan anda mempunyai ${result.categories.length} kategori produk: ${catList}.`
  }

  // B7. Payment Method Insights Intent (e.g. "Kaedah bayaran apa paling banyak?", "Berapa jualan Tunai / Cash?")
  const isPaymentQuery =
    /\b(kaedah bayaran|cara bayaran|payment method|kaedah pembayaran|tunai|cash|duitnow|qr|transfer|bank transfer|kad)\b/i.test(norm) &&
    !/\b(bagaimana|why|kenapa|cadangan|tips|nasihat|how)\b/i.test(norm)

  if (isPaymentQuery && result.hasPaymentData && result.paymentMethods && result.paymentMethods.length > 0) {
    if (/\b(paling banyak|paling popular|tertinggi|top|highest|most)\b/i.test(norm)) {
      const topPay = result.paymentMethods[0]
      return `Kaedah bayaran paling utama ialah ${topPay.kaedah} dengan ${topPay.transaksi} transaksi bernilai ${formatRM(topPay.revenue)} (${topPay.percentage.toFixed(1)}% daripada jualan).`
    }
    for (const pm of result.paymentMethods) {
      if (norm.toLowerCase().includes(pm.kaedah.toLowerCase())) {
        return `Kaedah bayaran ${pm.kaedah} mencatatkan ${pm.transaksi} transaksi dengan jumlah jualan ${formatRM(pm.revenue)} (${pm.percentage.toFixed(1)}% daripada jualan).`
      }
    }
    const payList = result.paymentMethods.map((pm) => `${pm.kaedah}: ${pm.transaksi} transaksi (${formatRM(pm.revenue)})`).join(', ')
    return `Rekod bayaran mencatatkan ${result.paymentMethods.length} kaedah: ${payList}.`
  }

  // =========================================================================
  // PRIORITY C: OTHER / ADVICE / UNCERTAIN QUESTIONS
  // =========================================================================
  return null
}

/**
 * Prepares privacy-safe aggregated business payload for Gemini context.
 * No customer personal data is ever collected or sent.
 */
export function prepareBusinessContext(result: SalesResult, options?: AssistantOptions) {
  const isFiltered = Boolean(
    options?.selectedPeriod &&
      options.selectedPeriod !== 'Semua' &&
      options.selectedPeriod !== 'ALL'
  )

  const multiMonthBreakdown =
    options?.allRecords && options.availableMonths && options.availableMonths.length > 0
      ? calculateMultiMonthBreakdown(options.allRecords, options.availableMonths)
      : []

  const weekdayAnalytics = options?.allRecords ? calculateWeekdayAnalytics(options.allRecords) : null
  const dailyAnalytics = options?.allRecords ? calculateDailyAnalytics(options.allRecords) : null

  return {
    selectedPeriod: options?.selectedPeriod || 'Semua',
    isFilteredPeriod: isFiltered,
    allTimeRevenue: options?.allResult?.totalRevenue ?? null,
    allTimeKuantiti: options?.allResult?.totalKuantiti ?? null,
    allTimeGrossProfit: options?.allResult?.grossProfit ?? null,
    allTimeRecordCount: options?.allResult?.recordCount ?? null,
    monthlyComparison: options?.monthlyComparison
      ? {
          summaryText: options.monthlyComparison.summaryText,
          currentMonth: options.monthlyComparison.currentMonthLabel,
          currentRevenue: options.monthlyComparison.currentRevenue,
          previousMonth: options.monthlyComparison.previousMonthLabel,
          previousRevenue: options.monthlyComparison.previousRevenue,
          diffRevenue: options.monthlyComparison.diffRevenue,
          percentageChange: options.monthlyComparison.percentageChange,
        }
      : null,
    multiMonthBreakdown,
    weekdayAnalytics: weekdayAnalytics?.hasDateData
      ? {
          highestRevenueDay: weekdayAnalytics.highestRevenueDay
            ? {
                nameMY: weekdayAnalytics.highestRevenueDay.nameMY,
                revenue: weekdayAnalytics.highestRevenueDay.revenue,
                avgRevenuePerDate: weekdayAnalytics.highestRevenueDay.avgRevenuePerDate,
                distinctDatesCount: weekdayAnalytics.highestRevenueDay.distinctDatesCount,
              }
            : null,
          highestAvgDay: weekdayAnalytics.highestAvgDay
            ? {
                nameMY: weekdayAnalytics.highestAvgDay.nameMY,
                avgRevenuePerDate: weekdayAnalytics.highestAvgDay.avgRevenuePerDate,
              }
            : null,
          weekendRevenue: weekdayAnalytics.weekendRevenue,
          weekdayRevenue: weekdayAnalytics.weekdayRevenue,
          weekendPercentage: weekdayAnalytics.weekendPercentage,
          avgWeekendDailyRevenue: weekdayAnalytics.avgWeekendDailyRevenue,
          avgWeekdayDailyRevenue: weekdayAnalytics.avgWeekdayDailyRevenue,
          isWeekendMoreProfitable: weekdayAnalytics.isWeekendMoreProfitable,
          days: weekdayAnalytics.days.map((d) => ({
            nameMY: d.nameMY,
            revenue: d.revenue,
            avgRevenuePerDate: d.avgRevenuePerDate,
            distinctDatesCount: d.distinctDatesCount,
          })),
        }
      : null,
    dailyAnalytics: dailyAnalytics?.hasDateData
      ? {
          totalRecordedDates: dailyAnalytics.totalRecordedDates,
          highestRevenueDate: dailyAnalytics.highestRevenueDate,
          lowestRevenueDate: dailyAnalytics.lowestRevenueDate,
          avgDailyRevenue: dailyAnalytics.avgDailyRevenue,
          dateRange: dailyAnalytics.dateRange,
        }
      : null,
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
    products: result.products.map((p) => {
      const avgPrice = p.kuantiti > 0 ? p.revenue / p.kuantiti : null
      const avgCost = p.cost !== null && p.kuantiti > 0 ? p.cost / p.kuantiti : null
      return {
        produk: p.produk,
        kuantiti: p.kuantiti,
        revenue: p.revenue,
        cost: p.cost,
        grossProfit: p.grossProfit,
        profitMarginPercent: p.profitMarginPercent,
        avgPrice: avgPrice !== null ? Math.round(avgPrice * 100) / 100 : null,
        avgCost: avgCost !== null ? Math.round(avgCost * 100) / 100 : null,
      }
    }),
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
    categories: (result.categories || []).map((c) => ({
      kategori: c.kategori,
      kuantiti: c.kuantiti,
      revenue: c.revenue,
      percentage: c.percentage,
    })),
    paymentMethods: (result.paymentMethods || []).map((pm) => ({
      kaedah: pm.kaedah,
      transaksi: pm.transaksi,
      revenue: pm.revenue,
      percentage: pm.percentage,
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
  chatHistory: ChatMessage[] = [],
  options?: AssistantOptions
): Promise<AssistantResponse> {
  const trimmed = question.trim()

  // 1. Check local engine first (saves API quota and responds instantly)
  const localAnswer = tryLocalCalculation(trimmed, result, options)
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

    const contextPayload = prepareBusinessContext(result, options)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25s timeout

    const sessionId = getClientSessionId()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-session-id': sessionId,
    }
    const customKey =
      typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
        ? window.localStorage.getItem('user_gemini_api_key')
        : null
    if (customKey && customKey.trim()) {
      headers['x-gemini-api-key'] = customKey.trim()
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
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
