import type {
  ValidatedSale,
  MonthOption,
  SalesResult,
  WeekdayStat,
  WeekdayAnalytics,
  DailyStat,
  DailyAnalytics,
  MonthSummary,
} from '../types'
import { calculateSales } from './sales'
import { filterSalesByMonth } from './monthly'
import { formatDateMY } from '../data/validate'

export type {
  WeekdayStat,
  WeekdayAnalytics,
  DailyStat,
  DailyAnalytics,
  MonthSummary,
}

const MALAY_WEEKDAYS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']
const EN_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Calculates deterministic weekday analytics from validated sales records.
 * Uses timezone-safe UTC date calculation.
 */
export function calculateWeekdayAnalytics(sales: ValidatedSale[]): WeekdayAnalytics {
  const datedSales = sales.filter((s) => Boolean(s.tarikh))

  if (datedSales.length === 0) {
    return {
      days: [],
      highestRevenueDay: null,
      highestAvgDay: null,
      lowestRevenueDay: null,
      weekendRevenue: 0,
      weekdayRevenue: 0,
      weekendKuantiti: 0,
      weekdayKuantiti: 0,
      weekendPercentage: 0,
      weekendRecordedDates: 0,
      weekdayRecordedDates: 0,
      avgWeekendDailyRevenue: 0,
      avgWeekdayDailyRevenue: 0,
      isWeekendMoreProfitable: false,
      hasDateData: false,
    }
  }

  // Initialize 7 days
  const dayMaps = Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    nameMY: MALAY_WEEKDAYS[i],
    nameEN: EN_WEEKDAYS[i],
    isWeekend: i === 0 || i === 6,
    revenueCents: 0,
    kuantiti: 0,
    recordCount: 0,
    dates: new Set<string>(),
  }))

  const weekendDates = new Set<string>()
  const weekdayDates = new Set<string>()

  for (const s of datedSales) {
    if (!s.tarikh) continue
    const parts = s.tarikh.split('-').map(Number)
    if (parts.length !== 3) continue
    const [y, m, d] = parts
    const dt = new Date(Date.UTC(y, m - 1, d))
    const dayIdx = dt.getUTCDay()
    if (dayIdx < 0 || dayIdx > 6) continue

    const priceCents = Math.round(s.harga * 100)
    const revCents = s.kuantiti * priceCents

    dayMaps[dayIdx].revenueCents += revCents
    dayMaps[dayIdx].kuantiti += s.kuantiti
    dayMaps[dayIdx].recordCount += 1
    dayMaps[dayIdx].dates.add(s.tarikh)

    if (dayIdx === 0 || dayIdx === 6) {
      weekendDates.add(s.tarikh)
    } else {
      weekdayDates.add(s.tarikh)
    }
  }

  const days: WeekdayStat[] = dayMaps.map((d) => {
    const rev = d.revenueCents / 100
    const count = d.dates.size
    return {
      dayIndex: d.dayIndex,
      nameMY: d.nameMY,
      nameEN: d.nameEN,
      isWeekend: d.isWeekend,
      revenue: rev,
      kuantiti: d.kuantiti,
      recordCount: d.recordCount,
      distinctDatesCount: count,
      avgRevenuePerDate: count > 0 ? Math.round((rev / count) * 100) / 100 : 0,
    }
  })

  // Find active days (days with at least 1 record)
  const activeDays = days.filter((d) => d.recordCount > 0)

  let highestRevenueDay: WeekdayStat | null = null
  let highestAvgDay: WeekdayStat | null = null
  let lowestRevenueDay: WeekdayStat | null = null

  if (activeDays.length > 0) {
    highestRevenueDay = [...activeDays].sort((a, b) => b.revenue - a.revenue)[0]
    highestAvgDay = [...activeDays].sort((a, b) => b.avgRevenuePerDate - a.avgRevenuePerDate)[0]
    lowestRevenueDay = [...activeDays].sort((a, b) => a.revenue - b.revenue)[0]
  }

  const weekendRevenue = days
    .filter((d) => d.isWeekend)
    .reduce((sum, d) => sum + d.revenue, 0)
  const weekdayRevenue = days
    .filter((d) => !d.isWeekend)
    .reduce((sum, d) => sum + d.revenue, 0)
  const weekendKuantiti = days
    .filter((d) => d.isWeekend)
    .reduce((sum, d) => sum + d.kuantiti, 0)
  const weekdayKuantiti = days
    .filter((d) => !d.isWeekend)
    .reduce((sum, d) => sum + d.kuantiti, 0)

  const totalRev = weekendRevenue + weekdayRevenue
  const weekendPercentage = totalRev > 0 ? Math.round((weekendRevenue / totalRev) * 1000) / 10 : 0

  const weekendRecordedDates = weekendDates.size
  const weekdayRecordedDates = weekdayDates.size

  const avgWeekendDailyRevenue =
    weekendRecordedDates > 0
      ? Math.round((weekendRevenue / weekendRecordedDates) * 100) / 100
      : 0
  const avgWeekdayDailyRevenue =
    weekdayRecordedDates > 0
      ? Math.round((weekdayRevenue / weekdayRecordedDates) * 100) / 100
      : 0

  return {
    days,
    highestRevenueDay,
    highestAvgDay,
    lowestRevenueDay,
    weekendRevenue: Math.round(weekendRevenue * 100) / 100,
    weekdayRevenue: Math.round(weekdayRevenue * 100) / 100,
    weekendKuantiti,
    weekdayKuantiti,
    weekendPercentage,
    weekendRecordedDates,
    weekdayRecordedDates,
    avgWeekendDailyRevenue,
    avgWeekdayDailyRevenue,
    isWeekendMoreProfitable: avgWeekendDailyRevenue > avgWeekdayDailyRevenue,
    hasDateData: true,
  }
}

/**
 * Calculates deterministic daily date analytics from validated sales records.
 */
export function calculateDailyAnalytics(sales: ValidatedSale[]): DailyAnalytics {
  const datedSales = sales.filter((s) => Boolean(s.tarikh))

  if (datedSales.length === 0) {
    return {
      totalRecordedDates: 0,
      highestRevenueDate: null,
      lowestRevenueDate: null,
      avgDailyRevenue: 0,
      dateRange: null,
      hasDateData: false,
      dailyStats: [],
    }
  }

  const dateMap = new Map<string, { revenueCents: number; kuantiti: number; count: number }>()

  for (const s of datedSales) {
    if (!s.tarikh) continue
    const priceCents = Math.round(s.harga * 100)
    const revCents = s.kuantiti * priceCents

    const existing = dateMap.get(s.tarikh)
    if (existing) {
      existing.revenueCents += revCents
      existing.kuantiti += s.kuantiti
      existing.count += 1
    } else {
      dateMap.set(s.tarikh, {
        revenueCents: revCents,
        kuantiti: s.kuantiti,
        count: 1,
      })
    }
  }

  const sortedDates = Array.from(dateMap.keys()).sort()
  const dailyStats: DailyStat[] = sortedDates.map((tarikh) => {
    const data = dateMap.get(tarikh)!
    const parts = tarikh.split('-').map(Number)
    const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
    const weekdayMY = MALAY_WEEKDAYS[dt.getUTCDay()] || ''
    const rev = data.revenueCents / 100

    return {
      tarikh,
      displayTarikh: `${formatDateMY(tarikh)} (${weekdayMY})`,
      weekdayMY,
      revenue: Math.round(rev * 100) / 100,
      kuantiti: data.kuantiti,
      recordCount: data.count,
    }
  })

  const sortedByRevenue = [...dailyStats].sort((a, b) => b.revenue - a.revenue)
  const highestRevenueDate = sortedByRevenue[0] || null
  const lowestRevenueDate = sortedByRevenue[sortedByRevenue.length - 1] || null

  const totalRevenue = dailyStats.reduce((sum, d) => sum + d.revenue, 0)
  const avgDailyRevenue =
    dailyStats.length > 0 ? Math.round((totalRevenue / dailyStats.length) * 100) / 100 : 0

  return {
    totalRecordedDates: dailyStats.length,
    highestRevenueDate,
    lowestRevenueDate,
    avgDailyRevenue,
    dateRange: {
      start: sortedDates[0],
      end: sortedDates[sortedDates.length - 1],
    },
    hasDateData: true,
    dailyStats,
  }
}

/**
 * Calculates individual breakdown for each available month in the dataset.
 */
export function calculateMultiMonthBreakdown(
  sales: ValidatedSale[],
  availableMonths: MonthOption[]
): MonthSummary[] {
  if (sales.length === 0 || availableMonths.length === 0) {
    return []
  }

  return availableMonths.map((m) => {
    const monthSales = filterSalesByMonth(sales, m.key)
    const result: SalesResult = calculateSales(monthSales, null)

    return {
      key: m.key,
      label: m.label,
      fullName: m.fullName,
      revenue: result.totalRevenue,
      kuantiti: result.totalKuantiti,
      recordCount: result.recordCount,
      grossProfit: result.grossProfit,
      bestSellerQty: result.bestSeller
        ? { produk: result.bestSeller.produk, kuantiti: result.bestSeller.kuantiti }
        : null,
      bestSellerRev: result.highestRevenue
        ? { produk: result.highestRevenue.produk, revenue: result.highestRevenue.revenue }
        : null,
    }
  })
}
