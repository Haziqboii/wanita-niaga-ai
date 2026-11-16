import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import * as XLSX from 'xlsx'
import { autoDetectMapping, applyMapping, findHeaderRowIndex } from '../data/parse'
import { validateRecords } from '../data/validate'
import { calculateSales } from '../calc/sales'
import {
  extractAvailableMonths,
  filterSalesByMonth,
  calculateMonthlyComparison,
} from '../calc/monthly'
import { generateDeterministicInsights } from '../calc/insights'
import { exportDashboardToPDF } from '../services/pdfExport'
import {
  renderPdfProductBarChart,
  renderPdfDailyTrendChart,
  renderPdfTop5DonutChart,
  renderPdfChannelChart,
} from '../services/pdfChartRenderer'
import type { ValidatedSale } from '../types'

describe('MEKARA — PHASE 5: Premium Dynamic Business Report PDF Suite', () => {
  let allRecords: ValidatedSale[] = []
  let allResult: any

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // Load the official 600-record fixture (Sep-Oct 2026)
  const fixturePath = path.resolve(
    process.cwd(),
    'src/__tests__/fixtures/Wanita_Niaga_AI_600_Rekod_Jualan_Sep_Okt_2026.xlsx'
  )
  const buf = fs.readFileSync(fixturePath)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  const headerRowIdx = findHeaderRowIndex(rows)
  const headers = rows[headerRowIdx].map((h: any) => String(h).trim()).filter(Boolean)
  const mapping = autoDetectMapping(headers)
  const rawRows: Record<string, unknown>[] = []
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const rowData = rows[i]
    if (!rowData || rowData.length === 0) continue
    const obj: Record<string, unknown> = {}
    headers.forEach((h, idx) => {
      obj[h] = rowData[idx] ?? ''
    })
    rawRows.push(obj)
  }
  const { records: rawSales } = applyMapping(rawRows, mapping)
  const { valid } = validateRecords(rawSales)
  allRecords = valid
  allResult = calculateSales(allRecords, 500)

  // 1. Fixture Data Verification & Reconciliations
  it('1. Reconciles 600-record fixture data correctly for PDF generation', () => {
    expect(allRecords.length).toBe(600)
    expect(Math.round(allResult.totalRevenue * 100) / 100).toBe(41307.1)
    expect(allResult.totalKuantiti).toBe(8141)
    expect(allResult.grossProfit).toBe(22859)
    expect(allResult.products.length).toBe(16)

    // Dual Champions
    expect(allResult.bestSeller?.produk).toBe('Nasi Lemak') // Juara Kuantiti (1,709 unit)
    expect(allResult.bestSeller?.kuantiti).toBe(1709)
    expect(allResult.highestRevenue?.produk).toBe('Kek Batik') // Juara Hasil (RM10,146.00)
    expect(allResult.highestRevenue?.revenue).toBe(10146)

    // Distinct champions confirmed
    expect(allResult.bestSeller?.produk).not.toBe(allResult.highestRevenue?.produk)
  })

  // 2. Full exportDashboardToPDF with all options (All Months)
  it('2. exportDashboardToPDF generates complete report for full dataset with opex', async () => {
    const availableMonths = extractAvailableMonths(allRecords)
    const comparison = calculateMonthlyComparison(allRecords, 'ALL', availableMonths)
    const insights = generateDeterministicInsights({
      currentResult: allResult,
      allResult,
      allRecords,
      selectedPeriod: 'ALL',
      availableMonths,
      monthlyComparison: comparison,
    })

    const success = await exportDashboardToPDF({
      result: allResult,
      operatingExpenses: 500,
      periodLabel: 'Semua (Sep - Okt 2026)',
      monthlyComparison: comparison,
      allRecords,
      allResult,
      insights,
      selectedMonth: 'ALL',
      availableMonths,
    })

    expect(success).toBe(true)
  })

  // 3. Filtered Month export (October 2026) with MoM comparison
  it('3. exportDashboardToPDF generates monthly report for October with MoM comparison', async () => {
    const availableMonths = extractAvailableMonths(allRecords)
    const octRecords = filterSalesByMonth(allRecords, '2026-10')
    const octResult = calculateSales(octRecords, 350)
    const comparison = calculateMonthlyComparison(allRecords, '2026-10', availableMonths)

    expect(comparison).not.toBeNull()
    expect(comparison?.trend).toBe('increase')
    expect(comparison?.percentageChange).toBe(37.4)
    expect(comparison?.diffRevenue).toBe(6514.7)

    const insights = generateDeterministicInsights({
      currentResult: octResult,
      allResult,
      allRecords,
      selectedPeriod: '2026-10',
      availableMonths,
      monthlyComparison: comparison,
    })

    const success = await exportDashboardToPDF({
      result: octResult,
      operatingExpenses: 350,
      periodLabel: 'Oktober 2026',
      monthlyComparison: comparison,
      allRecords,
      allResult,
      insights,
      selectedMonth: '2026-10',
      availableMonths,
    })

    expect(success).toBe(true)
  })

  // 4. Missing Cost Data & Null Operating Expenses
  it('4. exportDashboardToPDF properly reports partial cost data and null operating expenses', async () => {
    // Modify a few records to have missing cost
    const partialRecords: ValidatedSale[] = allRecords.map((r, idx) => {
      if (idx % 3 === 0) {
        return { ...r, kos: null }
      }
      return r
    })

    const partialResult = calculateSales(partialRecords, null)
    expect(partialResult.costComplete).toBe(false)
    expect(partialResult.operatingExpenses).toBe(null)
    expect(partialResult.estimatedNetProfit).toBe(null)

    const success = await exportDashboardToPDF({
      result: partialResult,
      operatingExpenses: null,
      periodLabel: 'Data Separa Lengkap',
      allRecords: partialRecords,
      allResult: partialResult,
    })

    expect(success).toBe(true)
  })

  // 5. Large product catalog (>25 products) triggering multi-page table pagination
  it('5. exportDashboardToPDF handles multi-page table splitting for large catalogs (30 products)', async () => {
    // Generate synthetic 30 products
    const bigProductList = Array.from({ length: 30 }, (_, i) => ({
      produk: `Produk Mekara Khas #${i + 1}`,
      kuantiti: 100 + i * 10,
      revenue: (100 + i * 10) * 15,
      cost: (100 + i * 10) * 8,
      grossProfit: (100 + i * 10) * 7,
      profitMarginPercent: 46.7,
      percentage: 3.33,
    }))

    const largeResult = {
      ...allResult,
      products: bigProductList,
    }

    const success = await exportDashboardToPDF({
      result: largeResult,
      operatingExpenses: 1200,
      periodLabel: 'Katalog Besar (30 Produk)',
      allRecords,
      allResult,
    })

    expect(success).toBe(true)
  })

  // 6. Chart Renderers produce non-crashing safe execution
  it('6. Chart Renderers execute gracefully without throwing errors', () => {
    expect(() => {
      renderPdfProductBarChart(allResult.products, 180, 50)
      renderPdfDailyTrendChart(allResult.dailyTrend || [], 180, 40)
      renderPdfTop5DonutChart(allResult.products, 88, 55)
      renderPdfChannelChart(allResult.channels || [], 88, 55)
    }).not.toThrow()
  })

  // 7. Verification of October Dynamic Product Profitability Benchmarks
  it('7. Dynamically derives exact October benchmarks (Teh Ais margin 66.1%, Kek Batik RM5.30/unit & RM4,960.80 gross profit)', async () => {
    const octRecords = filterSalesByMonth(allRecords, '2026-10')
    const octResult = calculateSales(octRecords, null)

    expect(octRecords.length).toBe(300)
    expect(octResult.recordCount).toBe(300)
    expect(Math.round(octResult.totalRevenue * 100) / 100).toBe(23910.9)
    expect(octResult.grossProfit).toBe(13186.1)
    expect(octResult.totalKuantiti).toBe(4152)

    // Benchmark 1: Highest Margin (%) -> Teh Ais
    const highestMargin = [...octResult.products]
      .filter((p) => typeof p.profitMarginPercent === 'number')
      .sort((a, b) => (b.profitMarginPercent ?? 0) - (a.profitMarginPercent ?? 0))[0]
    expect(highestMargin.produk).toBe('Teh Ais')
    expect(Math.round((highestMargin.profitMarginPercent ?? 0) * 10) / 10).toBe(66.1)

    // Benchmark 2: Highest Gross Profit per Unit -> Kek Batik (RM5.30)
    const highestUnitProfit = [...octResult.products]
      .filter((p) => typeof p.grossProfit === 'number' && p.kuantiti > 0)
      .map((p) => ({
        ...p,
        unitProfit: (p.grossProfit ?? 0) / p.kuantiti,
      }))
      .sort((a, b) => b.unitProfit - a.unitProfit)[0]
    expect(highestUnitProfit.produk).toBe('Kek Batik')
    expect(Math.round(highestUnitProfit.unitProfit * 100) / 100).toBe(5.3)

    // Benchmark 3: Highest Total Gross Profit -> Kek Batik (RM4,960.80)
    const highestTotalProfit = [...octResult.products]
      .filter((p) => typeof p.grossProfit === 'number')
      .sort((a, b) => (b.grossProfit ?? 0) - (a.grossProfit ?? 0))[0]
    expect(highestTotalProfit.produk).toBe('Kek Batik')
    expect(highestTotalProfit.grossProfit).toBe(4960.8)

    // Benchmark 4: Highest Sales Revenue -> Kek Batik (RM8,892.00)
    expect(octResult.highestRevenue?.produk).toBe('Kek Batik')
    expect(octResult.highestRevenue?.revenue).toBe(8892)

    // Verify PDF export with null opex succeeds
    const success = await exportDashboardToPDF({
      result: octResult,
      operatingExpenses: null,
      periodLabel: 'Okt 2026',
      allRecords: octRecords,
      allResult,
      selectedMonth: '2026-10',
    })
    expect(success).toBe(true)
  })
})
