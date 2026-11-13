import type {
  ValidatedSale,
  SalesResult,
  ProductStats,
  ChannelStats,
  TrendPoint,
} from '../types'
import { formatDateMY } from '../data/validate'

export function toCents(value: number): number {
  return Math.round(value * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

interface ProductAccumulator {
  produk: string
  kuantiti: number
  revenueCents: number
  costCents: number
  hasMissingCost: boolean
  hasAnyCost: boolean
}

export function calculateSales(
  sales: ValidatedSale[],
  operatingExpenses: number | null = null
): SalesResult {
  if (!sales || sales.length === 0) {
    return emptyResult()
  }

  let totalRevenueCents = 0
  let totalKuantiti = 0
  let totalCostCents = 0

  let hasAnyCost = false
  let costComplete = true

  const productMap = new Map<string, ProductAccumulator>()
  const channelMap = new Map<string, { kuantiti: number; revenueCents: number }>()
  const trendMap = new Map<string, { kuantiti: number; revenueCents: number }>()

  let hasDateData = false
  let hasChannelData = false

  for (const s of sales) {
    // 1. Calculate record revenue in integer cents
    const priceCents = toCents(s.harga)
    const recordRevenueCents = s.kuantiti * priceCents
    totalRevenueCents += recordRevenueCents
    totalKuantiti += s.kuantiti

    // 2. Cost calculation
    let recordCostCents = 0
    if (s.kos !== null && s.kos !== undefined && Number.isFinite(s.kos)) {
      hasAnyCost = true
      recordCostCents = s.kuantiti * toCents(s.kos)
      totalCostCents += recordCostCents
    } else {
      costComplete = false
    }

    // 3. Product aggregation
    const existing = productMap.get(s.produk)
    if (existing) {
      existing.kuantiti += s.kuantiti
      existing.revenueCents += recordRevenueCents
      if (s.kos !== null && s.kos !== undefined && Number.isFinite(s.kos)) {
        existing.costCents += recordCostCents
        existing.hasAnyCost = true
      } else {
        existing.hasMissingCost = true
      }
    } else {
      const isCostPresent = s.kos !== null && s.kos !== undefined && Number.isFinite(s.kos)
      productMap.set(s.produk, {
        produk: s.produk,
        kuantiti: s.kuantiti,
        revenueCents: recordRevenueCents,
        costCents: isCostPresent ? recordCostCents : 0,
        hasMissingCost: !isCostPresent,
        hasAnyCost: isCostPresent,
      })
    }

    // 4. Trend (Date) aggregation
    if (s.tarikh) {
      hasDateData = true
      const dateKey = s.tarikh
      const existingTrend = trendMap.get(dateKey)
      if (existingTrend) {
        existingTrend.kuantiti += s.kuantiti
        existingTrend.revenueCents += recordRevenueCents
      } else {
        trendMap.set(dateKey, {
          kuantiti: s.kuantiti,
          revenueCents: recordRevenueCents,
        })
      }
    }

    // 5. Channel aggregation
    if (s.saluran) {
      hasChannelData = true
      const chanKey = s.saluran
      const existingChan = channelMap.get(chanKey)
      if (existingChan) {
        existingChan.kuantiti += s.kuantiti
        existingChan.revenueCents += recordRevenueCents
      } else {
        channelMap.set(chanKey, {
          kuantiti: s.kuantiti,
          revenueCents: recordRevenueCents,
        })
      }
    }
  }

  // Finalize product stats
  const products: ProductStats[] = Array.from(productMap.values()).map((p) => {
    const rev = fromCents(p.revenueCents)
    const cost = !p.hasMissingCost && p.hasAnyCost ? fromCents(p.costCents) : null
    const grossProfit =
      cost !== null ? fromCents(p.revenueCents - p.costCents) : null
    const profitMarginPercent =
      grossProfit !== null && rev > 0 ? (grossProfit / rev) * 100 : null

    return {
      produk: p.produk,
      kuantiti: p.kuantiti,
      revenue: rev,
      cost,
      grossProfit,
      profitMarginPercent,
    }
  })

  // Sort products by revenue descending
  products.sort((a, b) => b.revenue - a.revenue)

  // Best seller by quantity (highest quantity sold)
  let bestSeller: ProductStats | null = null
  if (products.length > 0) {
    bestSeller = products.reduce((prev, curr) =>
      curr.kuantiti > prev.kuantiti ? curr : prev
    )
  }

  // Highest revenue product
  const highestRevenue: ProductStats | null = products.length > 0 ? products[0] : null

  // Highest profit product (only among products with calculable gross profit)
  const profitableProducts = products.filter((p) => p.grossProfit !== null)
  let highestProfit: ProductStats | null = null
  if (profitableProducts.length > 0) {
    highestProfit = profitableProducts.reduce((prev, curr) =>
      (curr.grossProfit ?? 0) > (prev.grossProfit ?? 0) ? curr : prev
    )
  }

  // Overall Gross Profit
  // Only calculable when cost data is available and complete across all records
  const totalCost = hasAnyCost && costComplete ? fromCents(totalCostCents) : null
  const grossProfit =
    hasAnyCost && costComplete
      ? fromCents(totalRevenueCents - totalCostCents)
      : null

  // Operating Expenses & Estimated Net Profit
  // Net Profit = Gross Profit - Operating Expenses
  const opexCents =
    operatingExpenses !== null && Number.isFinite(operatingExpenses) && operatingExpenses >= 0
      ? toCents(operatingExpenses)
      : null

  const estimatedNetProfit =
    grossProfit !== null && opexCents !== null
      ? fromCents(toCents(grossProfit) - opexCents)
      : null

  // Channel statistics
  const channels: ChannelStats[] = Array.from(channelMap.entries()).map(
    ([saluran, data]) => {
      const revenue = fromCents(data.revenueCents)
      const totalRev = fromCents(totalRevenueCents)
      const percentage = totalRev > 0 ? (revenue / totalRev) * 100 : 0
      return {
        saluran: saluran as any,
        kuantiti: data.kuantiti,
        revenue,
        percentage,
      }
    }
  )
  channels.sort((a, b) => b.revenue - a.revenue)

  // Trend statistics (sorted chronologically)
  const trends: TrendPoint[] = Array.from(trendMap.entries())
    .map(([tarikh, data]) => ({
      tarikh,
      displayTarikh: formatDateMY(tarikh),
      revenue: fromCents(data.revenueCents),
      kuantiti: data.kuantiti,
    }))
    .sort((a, b) => a.tarikh.localeCompare(b.tarikh))

  return {
    totalRevenue: fromCents(totalRevenueCents),
    totalKuantiti,
    totalCost,
    grossProfit,
    operatingExpenses: opexCents !== null ? fromCents(opexCents) : null,
    estimatedNetProfit,
    hasCostData: hasAnyCost,
    costComplete,
    hasDateData,
    hasChannelData,
    products,
    bestSeller,
    highestRevenue,
    highestProfit,
    channels,
    trends,
    currency: 'RM',
    recordCount: sales.length,
  }
}

export function emptyResult(): SalesResult {
  return {
    totalRevenue: 0,
    totalKuantiti: 0,
    totalCost: null,
    grossProfit: null,
    operatingExpenses: null,
    estimatedNetProfit: null,
    hasCostData: false,
    costComplete: false,
    hasDateData: false,
    hasChannelData: false,
    products: [],
    bestSeller: null,
    highestRevenue: null,
    highestProfit: null,
    channels: [],
    trends: [],
    currency: 'RM',
    recordCount: 0,
  }
}
