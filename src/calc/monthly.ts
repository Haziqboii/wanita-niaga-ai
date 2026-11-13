import type { ValidatedSale, MonthOption, MonthlyComparison } from '../types'
import { calculateSales } from './sales'
import { formatRM } from '../data/validate'

export type { MonthOption, MonthlyComparison }

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mac',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Ogo',
  'Sep',
  'Okt',
  'Nov',
  'Dis',
]

const MONTH_NAMES_FULL = [
  'Januari',
  'Februari',
  'Mac',
  'April',
  'Mei',
  'Jun',
  'Julai',
  'Ogos',
  'September',
  'Oktober',
  'November',
  'Disember',
]

/**
 * Extracts unique months from validated sales records and sorts them chronologically.
 */
export function extractAvailableMonths(sales: ValidatedSale[]): MonthOption[] {
  const monthMap = new Map<string, MonthOption>()

  for (const s of sales) {
    if (!s.tarikh) continue
    const match = s.tarikh.match(/^(\d{4})-(\d{2})/)
    if (match) {
      const year = parseInt(match[1], 10)
      const month = parseInt(match[2], 10)
      const key = `${match[1]}-${match[2]}`

      if (!monthMap.has(key) && month >= 1 && month <= 12) {
        const shortName = MONTH_NAMES_SHORT[month - 1] || match[2]
        const fullName = MONTH_NAMES_FULL[month - 1] || match[2]
        monthMap.set(key, {
          key,
          label: `${shortName} ${year}`,
          fullName: `${fullName} ${year}`,
          year,
          month,
        })
      }
    }
  }

  // Sort chronologically ascending
  return Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key))
}

/**
 * Filters sales records by selected month key ('ALL' or 'YYYY-MM').
 * Undated records are included in 'ALL', but excluded from specific months.
 */
export function filterSalesByMonth(
  sales: ValidatedSale[],
  monthKey: string
): ValidatedSale[] {
  if (!monthKey || monthKey === 'ALL' || monthKey === 'semua') {
    return sales
  }
  return sales.filter((s) => s.tarikh && s.tarikh.startsWith(monthKey))
}

/**
 * Calculates monthly performance comparison between the current/selected month and previous month.
 */
export function calculateMonthlyComparison(
  sales: ValidatedSale[],
  selectedMonthKey: string,
  availableMonths: MonthOption[]
): MonthlyComparison | null {
  if (!sales || sales.length === 0 || availableMonths.length === 0) {
    return null
  }

  // If "ALL", summarize multi-month performance
  if (selectedMonthKey === 'ALL' || selectedMonthKey === 'semua') {
    if (availableMonths.length <= 1) {
      return null
    }

    // Compare latest month vs previous month if at least 2 months exist
    const latestMonth = availableMonths[availableMonths.length - 1]
    const previousMonth = availableMonths[availableMonths.length - 2]

    const latestSales = filterSalesByMonth(sales, latestMonth.key)
    const prevSales = filterSalesByMonth(sales, previousMonth.key)

    const latestCalc = calculateSales(latestSales)
    const prevCalc = calculateSales(prevSales)

    const diff = Math.round((latestCalc.totalRevenue - prevCalc.totalRevenue) * 100) / 100
    const diffQty = latestCalc.totalKuantiti - prevCalc.totalKuantiti
    const pct =
      prevCalc.totalRevenue > 0
        ? Math.round(((latestCalc.totalRevenue - prevCalc.totalRevenue) / prevCalc.totalRevenue) * 1000) / 10
        : null

    const trend = diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'equal'
    const trendWord = diff > 0 ? 'meningkat' : diff < 0 ? 'menurun' : 'sama'
    const pctStr = pct !== null ? ` (${Math.abs(pct).toFixed(1)}%)` : ''

    const summaryText = `Bulan ${latestMonth.label} ${trendWord} sebanyak ${formatRM(Math.abs(diff))}${pctStr} berbanding ${previousMonth.label}.`

    return {
      currentMonthKey: latestMonth.key,
      currentMonthLabel: latestMonth.label,
      currentRevenue: latestCalc.totalRevenue,
      currentKuantiti: latestCalc.totalKuantiti,
      previousMonthKey: previousMonth.key,
      previousMonthLabel: previousMonth.label,
      previousRevenue: prevCalc.totalRevenue,
      previousKuantiti: prevCalc.totalKuantiti,
      diffRevenue: diff,
      diffKuantiti: diffQty,
      percentageChange: pct,
      trend,
      summaryText,
    }
  }

  // Specific month comparison
  const currentIdx = availableMonths.findIndex((m) => m.key === selectedMonthKey)
  if (currentIdx === -1) return null

  const currentMonth = availableMonths[currentIdx]
  const currentSales = filterSalesByMonth(sales, currentMonth.key)
  const currentCalc = calculateSales(currentSales)

  if (currentIdx === 0) {
    // Earliest month in records - no prior month to compare against
    return {
      currentMonthKey: currentMonth.key,
      currentMonthLabel: currentMonth.label,
      currentRevenue: currentCalc.totalRevenue,
      currentKuantiti: currentCalc.totalKuantiti,
      previousMonthKey: null,
      previousMonthLabel: null,
      previousRevenue: null,
      previousKuantiti: null,
      diffRevenue: null,
      diffKuantiti: null,
      percentageChange: null,
      trend: 'none',
      summaryText: `Bulan terawal dalam rekod jualan ini (${currentMonth.label}). Tiada rekod bulan sebelumnya untuk perbandingan.`,
    }
  }

  const previousMonth = availableMonths[currentIdx - 1]
  const prevSales = filterSalesByMonth(sales, previousMonth.key)
  const prevCalc = calculateSales(prevSales)

  const diff = Math.round((currentCalc.totalRevenue - prevCalc.totalRevenue) * 100) / 100
  const diffQty = currentCalc.totalKuantiti - prevCalc.totalKuantiti
  const pct =
    prevCalc.totalRevenue > 0
      ? Math.round(((currentCalc.totalRevenue - prevCalc.totalRevenue) / prevCalc.totalRevenue) * 1000) / 10
      : null

  const trend = diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'equal'
  const trendWord = diff > 0 ? 'meningkat' : diff < 0 ? 'menurun' : 'kekal stabil'
  const pctStr = pct !== null ? ` (${Math.abs(pct).toFixed(1)}%)` : ''

  const summaryText = `Jualan bulan ${currentMonth.label} ${trendWord} sebanyak ${formatRM(Math.abs(diff))}${pctStr} berbanding ${previousMonth.label}.`

  return {
    currentMonthKey: currentMonth.key,
    currentMonthLabel: currentMonth.label,
    currentRevenue: currentCalc.totalRevenue,
    currentKuantiti: currentCalc.totalKuantiti,
    previousMonthKey: previousMonth.key,
    previousMonthLabel: previousMonth.label,
    previousRevenue: prevCalc.totalRevenue,
    previousKuantiti: prevCalc.totalKuantiti,
    diffRevenue: diff,
    diffKuantiti: diffQty,
    percentageChange: pct,
    trend,
    summaryText,
  }
}
