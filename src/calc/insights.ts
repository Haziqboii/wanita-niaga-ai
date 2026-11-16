/**
 * WANITA NIAGA AI — Intelligent Business Insights Engine (Task 8B.3)
 *
 * Implements business-aware reasoning for Malaysian microbusiness owners:
 * - Understands existing business situation (number of products, channels, dates).
 * - Avoids poor generic recommendations (e.g. never suggests adding products when 16 already exist).
 * - Identifies hidden unit-profit opportunities, month shifts, channel opportunities, and stock planning.
 * - Strict Recommendation Quality Gate filters out ungrounded, risky, or jargon-laden advice.
 *
 * CRITICAL RULE: NEVER repeats basic KPI numbers (total sales, total units, overall profit).
 */

import type {
  SalesResult,
  ValidatedSale,
  MonthOption,
  MonthlyComparison,
  ProductStats,
} from '../types'
import { calculateWeekdayAnalytics } from './analytics'
import { filterSalesByMonth } from './monthly'
import {
  type BusinessReasoningContext,
  evaluateInsightQuality,
} from './insightQuality'

export type { BusinessReasoningContext }
export { evaluateInsightQuality }

export interface InsightItem {
  id: string
  category: 'month_change' | 'margin' | 'concentration' | 'channel' | 'timing' | 'action'
  title: string
  text: string // Plain Bahasa Melayu with bold keywords
  icon: 'trending-up' | 'chart-bar' | 'lightbulb' | 'alert-triangle' | 'shopping-bag'
  score: number // Ranking score
  evidence: {
    products?: string[]
    metrics?: Record<string, number | string>
    comparison?: string
  }
}

export interface InsightGenerationOptions {
  currentResult: SalesResult
  allResult?: SalesResult
  allRecords?: ValidatedSale[]
  selectedPeriod?: string
  availableMonths?: MonthOption[]
  monthlyComparison?: MonthlyComparison | null
}

/**
 * Discovers and ranks up to 3 genuinely useful business insights from validated sales data.
 */
export function generateDeterministicInsights(options: InsightGenerationOptions): InsightItem[] {
  const {
    currentResult,
    allResult: _allResult,
    allRecords = [],
    selectedPeriod = 'ALL',
    availableMonths = [],
    monthlyComparison: _monthlyComparison,
  } = options

  if (currentResult.totalKuantiti === 0 || currentResult.products.length === 0) {
    return []
  }

  const context: BusinessReasoningContext = {
    totalProducts: currentResult.products.length,
    hasCostData: currentResult.costComplete && currentResult.products.some((p: ProductStats) => p.cost !== null),
    hasDateData: currentResult.hasDateData,
    hasChannelData: currentResult.hasChannelData,
    hasInventoryData: false,
    hasBasketData: false,
    availableMonthsCount: availableMonths.length,
  }

  const candidates: InsightItem[] = []

  // ---------------------------------------------------------------------------
  // 1. Month-over-Month Shift (Early Business Changes)
  // ---------------------------------------------------------------------------
  if (availableMonths.length >= 2 && allRecords.length > 0) {
    const sortedMonths = [...availableMonths].sort((a, b) => a.key.localeCompare(b.key))
    const m1 = sortedMonths[0]
    const m2 = sortedMonths[1]

    const m1Records = filterSalesByMonth(allRecords, m1.key)
    const m2Records = filterSalesByMonth(allRecords, m2.key)

    const m1ProductRev = new Map<string, number>()
    for (const r of m1Records) {
      m1ProductRev.set(r.produk, (m1ProductRev.get(r.produk) || 0) + r.kuantiti * r.harga)
    }
    const m2ProductRev = new Map<string, number>()
    for (const r of m2Records) {
      m2ProductRev.set(r.produk, (m2ProductRev.get(r.produk) || 0) + r.kuantiti * r.harga)
    }

    const m1Top = Array.from(m1ProductRev.entries()).sort((a, b) => b[1] - a[1])[0]
    const m2Top = Array.from(m2ProductRev.entries()).sort((a, b) => b[1] - a[1])[0]

    if (m1Top && m2Top) {
      if (m1Top[0] !== m2Top[0]) {
        candidates.push({
          id: 'shift_top_product',
          category: 'month_change',
          title: 'Produk Jualan Tertinggi Bertukar Ikut Bulan',
          icon: 'trending-up',
          text: `Hasil jualan bertukar daripada **${m1Top[0]} pada ${m1.label}** kepada **${m2Top[0]} pada ${m2.label}**. Puan boleh pantau sambutan bulan hadapan sebelum membuat persediaan stok bahan.`,
          score: 95,
          evidence: {
            products: [m1Top[0], m2Top[0]],
            metrics: {
              [`${m1.key}_top`]: m1Top[0],
              [`${m1.key}_rev`]: Math.round(m1Top[1] * 100) / 100,
              [`${m2.key}_top`]: m2Top[0],
              [`${m2.key}_rev`]: Math.round(m2Top[1] * 100) / 100,
            },
            comparison: `${m1Top[0]} -> ${m2Top[0]}`,
          },
        })
      } else {
        // Same top product, check for fast rising star product
        let biggestGainer: { produk: string; growth: number; rev1: number; rev2: number } | null = null
        for (const [prod, rev2] of m2ProductRev.entries()) {
          const rev1 = m1ProductRev.get(prod) || 0
          if (rev1 > 200 && rev2 > rev1 * 1.25) {
            const growth = Math.round(((rev2 - rev1) / rev1) * 100)
            if (!biggestGainer || growth > biggestGainer.growth) {
              biggestGainer = { produk: prod, growth, rev1, rev2 }
            }
          }
        }
        if (biggestGainer) {
          candidates.push({
            id: 'rising_star_product',
            category: 'month_change',
            title: 'Menu Semakin Disukai Pelanggan',
            icon: 'trending-up',
            text: `Jualan **${biggestGainer.produk} meningkat pantas** pada ${m2.label} berbanding ${m1.label}. Teruskan pantauan sambutan pelanggan dan kekalkan kualiti menu ini.`,
            score: 90,
            evidence: {
              products: [biggestGainer.produk],
              metrics: {
                growthPercent: biggestGainer.growth,
                previousRev: biggestGainer.rev1,
                currentRev: biggestGainer.rev2,
              },
            },
          })
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Unit Profit & Missed Profit Opportunities (margin)
  // ---------------------------------------------------------------------------
  if (context.hasCostData) {
    const productsWithCost = currentResult.products.filter(
      (p: ProductStats) => p.cost !== null && p.grossProfit !== null && p.kuantiti > 0
    )

    if (productsWithCost.length >= 2) {
      // Sort by unit profit
      const sortedByUnitProfit = [...productsWithCost].sort((a, b) => {
        const uA = (a.grossProfit || 0) / a.kuantiti
        const uB = (b.grossProfit || 0) / b.kuantiti
        return uB - uA
      })
      const sortedByQty = [...productsWithCost].sort((a, b) => b.kuantiti - a.kuantiti)

      const topUnitProfit = sortedByUnitProfit[0]
      const topQty = sortedByQty[0]

      // Case A: Volume leader has thin profit (High-volume but low-margin scenario)
      if (
        topQty.produk !== topUnitProfit.produk &&
        topQty.profitMarginPercent !== null &&
        topQty.profitMarginPercent < 30
      ) {
        candidates.push({
          id: 'volume_thin_margin',
          category: 'margin',
          title: 'Laris Dijual, Tapi Untung Seunit Kecil',
          icon: 'chart-bar',
          text: `**${topQty.produk} paling banyak terjual**, tetapi memberi untung kasar seunit yang kecil. Puan boleh semak kos bahan atau tawarkan bersama menu lain.`,
          score: 92,
          evidence: {
            products: [topQty.produk, topUnitProfit.produk],
            metrics: {
              volumeProduct: topQty.produk,
              volumeMargin: topQty.profitMarginPercent,
              higherProfitProduct: topUnitProfit.produk,
            },
          },
        })
      } else if (topQty.produk !== topUnitProfit.produk) {
        // Case B: High-margin but low-selling product (Missed profit opportunity)
        candidates.push({
          id: 'margin_opportunity',
          category: 'margin',
          title: 'Untung Kasar Seunit Terbaik',
          icon: 'chart-bar',
          text: `**${topUnitProfit.produk}** beri **untung kasar seunit paling tinggi**, walaupun bukan paling laris. Cuba letakkannya di hadapan atau cadangkan kepada pelanggan untuk uji sambutan.`,
          score: 92,
          evidence: {
            products: [topUnitProfit.produk, topQty.produk],
            metrics: {
              topMarginProduct: topUnitProfit.produk,
              unitProfit: Math.round(((topUnitProfit.grossProfit || 0) / topUnitProfit.kuantiti) * 100) / 100,
              volumeProduct: topQty.produk,
            },
          },
        })
      } else {
        // Case C: Standard top unit profit product
        candidates.push({
          id: 'margin_lead',
          category: 'margin',
          title: 'Untung Kasar Seunit Lumayan',
          icon: 'chart-bar',
          text: `**${topUnitProfit.produk}** hasilkan **untung kasar seunit terbaik bagi setiap jualan**. Puan boleh tawarkan bersama menu popular untuk galakkan tempahan.`,
          score: 85,
          evidence: {
            products: [topUnitProfit.produk],
            metrics: {
              topMarginProduct: topUnitProfit.produk,
              grossProfit: topUnitProfit.grossProfit || 0,
            },
          },
        })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Product Concentration & Better Use of Existing Products (concentration)
  // ---------------------------------------------------------------------------
  if (context.totalProducts >= 4 && currentResult.totalRevenue > 0) {
    const sortedByRev = [...currentResult.products].sort((a, b) => b.revenue - a.revenue)
    const top3Rev = sortedByRev.slice(0, 3).reduce((sum, p) => sum + p.revenue, 0)
    const concentrationPercent = Math.round((top3Rev / currentResult.totalRevenue) * 100)

    if (concentrationPercent >= 60) {
      if (context.totalProducts >= 5) {
        // Business already sells many products (e.g. 16 products)
        // DO NOT advise increasing capital or inventory; advise monitoring & reviewing
        candidates.push({
          id: 'concentration_streamline',
          category: 'concentration',
          title: 'Produk Laris, Utamakan Dahulu',
          icon: 'shopping-bag',
          text: `Daripada **${context.totalProducts} produk sedia ada**, 3 produk utama jana sebahagian besar jualan. Terus pantau produk ini dan semak produk kurang laris sebelum menambah stok.`,
          score: 88,
          evidence: {
            products: sortedByRev.slice(0, 3).map((p) => p.produk),
            metrics: {
              totalProducts: context.totalProducts,
              top3Revenue: Math.round(top3Rev * 100) / 100,
              concentrationPercent,
            },
          },
        })
      } else {
        // Business has 4 products, focus on quality
        candidates.push({
          id: 'concentration_focus',
          category: 'concentration',
          title: 'Produk Laris, Utamakan Dahulu',
          icon: 'shopping-bag',
          text: `Sebahagian besar hasil jualan disumbang oleh **3 produk utama**. Terus pantau kualiti produk ini sambil perhatikan sambutan produk lain sedia ada.`,
          score: 88,
          evidence: {
            products: sortedByRev.slice(0, 3).map((p) => p.produk),
            metrics: {
              totalProducts: context.totalProducts,
              top3Revenue: Math.round(top3Rev * 100) / 100,
              concentrationPercent,
            },
          },
        })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Sales Channel Opportunities (channel)
  // ---------------------------------------------------------------------------
  if (context.hasChannelData && currentResult.channels.length >= 2) {
    const sortedChannels = [...currentResult.channels].sort((a, b) => b.revenue - a.revenue)
    const mainChannel = sortedChannels[0]
    const secondaryChannel = sortedChannels[1]

    if (mainChannel.percentage >= 35 && secondaryChannel) {
      candidates.push({
        id: 'channel_opportunity',
        category: 'channel',
        title: 'Peluang Saluran Jualan Lain',
        icon: 'shopping-bag',
        text: `Jualan di **${mainChannel.saluran} bawa hasil terbesar**. Puan boleh cuba ambil pesanan awal di **${secondaryChannel.saluran}** tanpa kos tambahan.`,
        score: 84,
        evidence: {
          metrics: {
            mainChannel: mainChannel.saluran,
            mainChannelPercentage: Math.round(mainChannel.percentage),
            mainChannelRevenue: mainChannel.revenue,
            secondaryChannel: secondaryChannel.saluran,
          },
        },
      })
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Stock Planning & Timing Patterns (timing)
  // ---------------------------------------------------------------------------
  const datedRecords = allRecords.filter((r) => Boolean(r.tarikh))
  if (datedRecords.length >= 14) {
    const weekdayData = calculateWeekdayAnalytics(datedRecords)
    if (weekdayData.hasDateData && weekdayData.avgWeekendDailyRevenue > 0 && weekdayData.avgWeekdayDailyRevenue > 0) {
      const diffPercent = Math.round(
        ((weekdayData.avgWeekendDailyRevenue - weekdayData.avgWeekdayDailyRevenue) /
          weekdayData.avgWeekdayDailyRevenue) *
          100
      )

      if (diffPercent >= 15) {
        candidates.push({
          id: 'timing_pattern',
          category: 'timing',
          title: 'Jualan Rancak Hujung Minggu',
          icon: 'trending-up',
          text: `Jualan pada **hari Sabtu dan Ahad lebih tinggi** berbanding hari biasa. Puan boleh rancang persediaan jualan menjelang Jumaat mengikut bajet biasa.`,
          score: 82,
          evidence: {
            metrics: {
              avgWeekendDailyRevenue: weekdayData.avgWeekendDailyRevenue,
              avgWeekdayDailyRevenue: weekdayData.avgWeekdayDailyRevenue,
              diffPercent,
            },
          },
        })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Action Recommendation (Fallback only if fewer than 2 candidates exist)
  // ---------------------------------------------------------------------------
  if (candidates.length < 2) {
    candidates.push({
      id: 'action_plan',
      category: 'action',
      title: 'Cadangan Majukan Perniagaan',
      icon: 'lightbulb',
      text: availableMonths.length >= 2
        ? 'Puan boleh bandingkan sambutan produk antara bulan untuk pilih menu yang paling sesuai dipromosikan.'
        : 'Cuba tawarkan **set kombo makanan dan minuman** untuk galakkan pembeli berbelanja lebih dalam satu pesanan.',
      score: 80,
      evidence: {
        comparison: selectedPeriod,
      },
    })
  }

  // ---------------------------------------------------------------------------
  // Recommendation Quality Gate & Diversity Ranking
  // ---------------------------------------------------------------------------
  // 1. Filter out any candidate that fails quality gate
  const qualified = candidates.filter((c) => evaluateInsightQuality(c, context).valid)

  // 2. Sort by business relevance score descending
  const sorted = [...qualified].sort((a, b) => b.score - a.score)

  // 3. Pick at most 1 item per category
  const categorySeen = new Set<string>()
  const selected: InsightItem[] = []

  for (const c of sorted) {
    if (!categorySeen.has(c.category)) {
      categorySeen.add(c.category)
      selected.push(c)
      if (selected.length >= 3) break
    }
  }

  // Guarantee at most 3 insights (can be 2 if only 2 good insights exist)
  return selected.slice(0, 3)
}
