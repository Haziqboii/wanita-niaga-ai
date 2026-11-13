/**
 * WANITA NIAGA AI — Recommendation Quality Gate & Business Context
 *
 * Evaluates candidate insights against small-business reality checks and guidelines:
 * - Understands existing business situation (number of products, channels, dates).
 * - Avoids poor generic recommendations (e.g. never suggests adding products when 5+ already exist).
 * - Strictly rejects speculative claims (inventory overstock, waste, basket co-purchasing).
 * - Filters out corporate jargon, ungrounded profit claims, and informal honorifics.
 */

export interface BusinessReasoningContext {
  totalProducts: number
  hasCostData: boolean
  hasDateData: boolean
  hasChannelData: boolean
  hasInventoryData?: boolean
  hasBasketData?: boolean
  availableMonthsCount?: number
}

/**
 * Recommendation Quality Gate
 * Evaluates candidate insights against small-business reality checks and guidelines.
 */
export function evaluateInsightQuality(
  insight: { title: string; text: string; category?: string },
  context: BusinessReasoningContext
): { valid: boolean; reason?: string } {
  const textLower = insight.text.toLowerCase()
  const titleLower = insight.title.toLowerCase()

  // 1. Prohibited standalone KPI repetition
  if (
    titleLower.includes('jumlah jualan') ||
    titleLower.includes('jumlah kuantiti') ||
    textLower.startsWith('jumlah hasil jualan anda adalah') ||
    textLower.startsWith('jumlah untung kasar perniagaan anda adalah')
  ) {
    return { valid: false, reason: 'Repeats basic dashboard KPI totals' }
  }

  // 2. Prohibited corporate / finance jargon
  if (
    titleLower.includes('margin') ||
    titleLower.includes('kebergantungan') ||
    textLower.includes('revenue concentration') ||
    textLower.includes('channel efficiency') ||
    textLower.includes('growth percentage')
  ) {
    return { valid: false, reason: 'Contains prohibited technical or corporate jargon' }
  }

  // 3. Prohibited informal honorific (must use Puan)
  if (/\b(akak|kak|makcik)\b/i.test(insight.text) || /\b(akak|kak|makcik)\b/i.test(insight.title)) {
    return { valid: false, reason: 'Uses informal honorific instead of Puan' }
  }

  // 4. Over-diversification check:
  // If business already sells >= 5 products, NEVER recommend adding new or side products!
  if (context.totalProducts >= 5) {
    if (
      /\b(tambah|perkenalkan|cipta|buat|keluarkan)\b.*?\b(produk|menu)\s+(baharu|baru|sampingan)\b/i.test(insight.text) ||
      /\bperkenalkan produk sampingan\b/i.test(insight.text) ||
      /\btambah menu baharu\b/i.test(insight.text) ||
      /\btambah produk baharu\b/i.test(insight.text)
    ) {
      return {
        valid: false,
        reason: 'Poor reasoning: recommends adding new products when business already sells 5+ products',
      }
    }
  }

  // 5. Inventory / waste claims check (no inventory data exists in the schema)
  if (!context.hasInventoryData) {
    if (
      /\b(terlebih stok|pembaziran|stok tamat|stok luput|baki stok terbiar)\b/i.test(insight.text)
    ) {
      return { valid: false, reason: 'Speculates on inventory overstock or waste without inventory data' }
    }
  }

  // 6. Basket / Co-purchasing claim check (no basket data exists)
  if (!context.hasBasketData) {
    if (
      /\b(kerap dibeli bersama|selalu dibeli sekali|pembeli suka beli kedua-dua)\b/i.test(insight.text)
    ) {
      return { valid: false, reason: 'Claims co-purchasing habit without transaction basket data' }
    }
  }

  // 7. Cost claim check
  if (!context.hasCostData && insight.category === 'margin') {
    return { valid: false, reason: 'Makes margin/cost claims without cost data' }
  }

  // 8. Title word count (3 to 7 words)
  const titleWords = insight.title.trim().split(/\s+/).filter(Boolean)
  if (titleWords.length < 3 || titleWords.length > 7) {
    return { valid: false, reason: `Title has ${titleWords.length} words (must be 3-7 words)` }
  }

  // 9. Text brevity (max 35 words)
  const textWords = insight.text.trim().split(/\s+/).filter(Boolean)
  if (textWords.length > 35) {
    return { valid: false, reason: `Text has ${textWords.length} words (must be under 35 words)` }
  }

  return { valid: true }
}
