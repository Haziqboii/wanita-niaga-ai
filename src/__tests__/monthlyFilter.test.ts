import { describe, it, expect } from 'vitest'
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
import { tryLocalCalculation } from '../services/aiAssistant'
import { exportDashboardToPDF } from '../services/pdfExport'
import type { RawSale } from '../types'

describe('WANITA NIAGA AI — TASK 4: Monthly Filtering & Comparison Test Suite', () => {
  // Load 1,000-row SME test workbook once
  const fixturePath = path.resolve(
    process.cwd(),
    'src/__tests__/fixtures/Wanita_Niaga_AI_1000_Rekod_Jualan_SME_Sep_Okt_2026.xlsx'
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
  const { records } = applyMapping(rawRows, mapping)
  const { valid } = validateRecords(records)

  it('1. Dynamically generates available month options from actual sales dates', () => {
    const months = extractAvailableMonths(valid)
    expect(months.length).toBe(2)
    expect(months[0].key).toBe('2026-09')
    expect(months[0].label).toBe('Sep 2026')
    expect(months[0].fullName).toBe('September 2026')
    expect(months[1].key).toBe('2026-10')
    expect(months[1].label).toBe('Okt 2026')
    expect(months[1].fullName).toBe('Oktober 2026')
  })

  it('2. September and October records are filtered correctly and reconcile to all-time totals', () => {
    const allCalc = calculateSales(valid)
    expect(allCalc.recordCount).toBe(1000)
    expect(allCalc.totalRevenue).toBe(33382.1)
    expect(allCalc.totalKuantiti).toBe(8549)
    expect(allCalc.grossProfit).toBe(18699.2)

    // Filter Sep 2026
    const sepSales = filterSalesByMonth(valid, '2026-09')
    expect(sepSales.length).toBe(495)
    const sepCalc = calculateSales(sepSales)
    expect(sepCalc.totalRevenue).toBe(16220.7)
    expect(sepCalc.totalKuantiti).toBe(4170)
    expect(sepCalc.grossProfit).toBe(9081.1)
    expect(sepCalc.bestSeller?.produk).toBe('Karipap')
    expect(sepCalc.bestSeller?.kuantiti).toBe(798)
    expect(sepCalc.highestRevenue?.produk).toBe('Brownies')
    expect(sepCalc.highestRevenue?.revenue).toBe(1992)

    // Filter Okt 2026
    const oktSales = filterSalesByMonth(valid, '2026-10')
    expect(oktSales.length).toBe(505)
    const oktCalc = calculateSales(oktSales)
    expect(oktCalc.totalRevenue).toBe(17161.4)
    expect(oktCalc.totalKuantiti).toBe(4379)
    expect(oktCalc.grossProfit).toBe(9618.1)
    expect(oktCalc.bestSeller?.produk).toBe('Karipap')
    expect(oktCalc.bestSeller?.kuantiti).toBe(775)
    expect(oktCalc.highestRevenue?.produk).toBe('Brownies')
    expect(oktCalc.highestRevenue?.revenue).toBe(2936)

    // Exact reconciliation
    expect(sepCalc.recordCount + oktCalc.recordCount).toBe(allCalc.recordCount)
    expect(Math.round((sepCalc.totalRevenue + oktCalc.totalRevenue) * 100) / 100).toBe(allCalc.totalRevenue)
    expect(sepCalc.totalKuantiti + oktCalc.totalKuantiti).toBe(allCalc.totalKuantiti)
    expect(Math.round((sepCalc.grossProfit! + oktCalc.grossProfit!) * 100) / 100).toBe(allCalc.grossProfit)
  })

  it('3. Calculates monthly performance comparison accurately', () => {
    const months = extractAvailableMonths(valid)

    // Comparison for Okt 2026 vs Sep 2026
    const comparisonOkt = calculateMonthlyComparison(valid, '2026-10', months)
    expect(comparisonOkt).not.toBeNull()
    expect(comparisonOkt!.currentMonthLabel).toBe('Okt 2026')
    expect(comparisonOkt!.previousMonthLabel).toBe('Sep 2026')
    expect(comparisonOkt!.currentRevenue).toBe(17161.4)
    expect(comparisonOkt!.previousRevenue).toBe(16220.7)
    expect(comparisonOkt!.diffRevenue).toBe(940.7)
    expect(comparisonOkt!.percentageChange).toBe(5.8)
    expect(comparisonOkt!.trend).toBe('increase')
    expect(comparisonOkt!.summaryText).toContain('meningkat sebanyak RM940.70 (5.8%) berbanding Sep 2026')

    // Comparison for Sep 2026 (first recorded month)
    const comparisonSep = calculateMonthlyComparison(valid, '2026-09', months)
    expect(comparisonSep).not.toBeNull()
    expect(comparisonSep!.trend).toBe('none')
    expect(comparisonSep!.summaryText).toContain('Bulan terawal dalam rekod jualan ini')
  })

  it('4. Financial Accuracy: Handles global operating expenses honestly without deducting whole global opex from single months', () => {
    const opex = 2500
    const allCalc = calculateSales(valid, opex)
    expect(allCalc.operatingExpenses).toBe(2500)
    expect(allCalc.grossProfit).toBe(18699.2)
    expect(allCalc.estimatedNetProfit).toBe(16199.2)

    // Monthly view does not deduct global opex
    const sepSales = filterSalesByMonth(valid, '2026-09')
    const sepCalc = calculateSales(sepSales, null)
    expect(sepCalc.grossProfit).toBe(9081.1)
    expect(sepCalc.operatingExpenses).toBeNull()
    expect(sepCalc.estimatedNetProfit).toBeNull()
  })

  it('5. Undated records are retained in "Semua" but excluded from specific monthly views', () => {
    const mixedRecords: RawSale[] = [
      { produk: 'Kek Batik', kuantiti: '10', harga: '8.00', kos: '4.00', tarikh: '2026-09-15' },
      { produk: 'Karipap', kuantiti: '20', harga: '2.50', kos: '1.20', tarikh: '2026-10-10' },
      { produk: 'Roti Jala', kuantiti: '5', harga: '6.00', kos: '3.00', tarikh: '' }, // undated
    ]
    const { valid: validMixed } = validateRecords(mixedRecords)
    expect(validMixed.length).toBe(3)

    const allFiltered = filterSalesByMonth(validMixed, 'ALL')
    expect(allFiltered.length).toBe(3)

    const sepFiltered = filterSalesByMonth(validMixed, '2026-09')
    expect(sepFiltered.length).toBe(1)
    expect(sepFiltered[0].produk).toBe('Kek Batik')

    const oktFiltered = filterSalesByMonth(validMixed, '2026-10')
    expect(oktFiltered.length).toBe(1)
    expect(oktFiltered[0].produk).toBe('Karipap')
  })

  it('6. Chatbot period awareness respects selected month and answers all-time when explicitly requested', () => {
    const allCalc = calculateSales(valid)
    const sepSales = filterSalesByMonth(valid, '2026-09')
    const sepCalc = calculateSales(sepSales)
    const months = extractAvailableMonths(valid)
    const comparisonOkt = calculateMonthlyComparison(valid, '2026-10', months)

    // A. September selected -> "Berapa jumlah jualan saya?"
    const ansSep = tryLocalCalculation('Berapa jumlah jualan saya?', sepCalc, {
      selectedPeriod: 'Sep 2026',
      allResult: allCalc,
    })
    expect(ansSep).toContain('Sep 2026')
    expect(ansSep).toContain('RM16,220.70')
    expect(ansSep).toContain('4,170 unit')

    // B. September selected -> Best seller
    const ansSepBest = tryLocalCalculation('Produk mana paling laris?', sepCalc, {
      selectedPeriod: 'Sep 2026',
      allResult: allCalc,
    })
    expect(ansSepBest).toContain('Sep 2026')
    expect(ansSepBest).toContain('Karipap')
    expect(ansSepBest).toContain('798 unit')

    // C. September selected, but user asks for all-time / keseluruhan jualan
    const ansAllTime = tryLocalCalculation('Berapa jumlah jualan keseluruhan semua bulan?', sepCalc, {
      selectedPeriod: 'Sep 2026',
      allResult: allCalc,
    })
    expect(ansAllTime).toContain('keseluruhan')
    expect(ansAllTime).toContain('RM33,382.10')
    expect(ansAllTime).toContain('8,549 unit')

    // D. User asks for monthly comparison
    const ansComp = tryLocalCalculation('Bandingkan jualan September dan Oktober', sepCalc, {
      selectedPeriod: 'Okt 2026',
      allResult: allCalc,
      monthlyComparison: comparisonOkt,
    })
    expect(ansComp).toContain('Perbandingan Jualan Bulanan')
    expect(ansComp).toContain('meningkat sebanyak RM940.70 (5.8%)')
  })

  it('7. PDF export successfully handles filtered period without error', async () => {
    const sepSales = filterSalesByMonth(valid, '2026-09')
    const sepCalc = calculateSales(sepSales)
    const success = await exportDashboardToPDF({
      result: sepCalc,
      operatingExpenses: null,
      periodLabel: 'Sep 2026',
    })
    expect(success).toBe(true)
  })
})
