import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import * as XLSX from 'xlsx'
import { autoDetectMapping, applyMapping, findHeaderRowIndex } from '../data/parse'
import { validateRecords } from '../data/validate'
import { calculateSales } from '../calc/sales'
import { filterSalesByMonth, extractAvailableMonths, calculateMonthlyComparison } from '../calc/monthly'
import {
  calculateWeekdayAnalytics,
  calculateDailyAnalytics,
  calculateMultiMonthBreakdown,
} from '../calc/analytics'
import { tryLocalCalculation, prepareBusinessContext } from '../services/aiAssistant'
import { buildSystemInstruction } from '../../server/chatHandler'
import type { ValidatedSale } from '../types'

describe('WANITA NIAGA AI — TASK 6.1: Complete Business Data Awareness Test Suite', () => {
  // Load the 600-record September & October 2026 test workbook
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
  const { records } = applyMapping(rawRows, mapping)
  const { valid } = validateRecords(records)

  const allResult = calculateSales(valid)
  const availableMonths = extractAvailableMonths(valid)
  const sepRecords = filterSalesByMonth(valid, '2026-09')
  const oktRecords = filterSalesByMonth(valid, '2026-10')
  const sepResult = calculateSales(sepRecords)
  const oktResult = calculateSales(oktRecords)
  const monthlyComparison = calculateMonthlyComparison(valid, '2026-10', availableMonths)

  it('1. Recognizes both September & October when dashboard is filtered to September', () => {
    // When dashboard is set to September, assistant options include allRecords and availableMonths
    const answer = tryLocalCalculation('Do you have sales for both months?', sepResult, {
      selectedPeriod: 'Sep 2026',
      allResult,
      allRecords: valid,
      availableMonths,
      monthlyComparison,
    })

    expect(answer).not.toBeNull()
    expect(answer).toMatch(/kedua-dua bulan/i)
    expect(answer).toMatch(/Sep 2026/i)
    expect(answer).toMatch(/Okt 2026/i)
    expect(answer).toMatch(/RM41,307\.10/)
  })

  it('2. Compares September and October sales accurately (+RM6,514.70 / +37.4%)', () => {
    const answer = tryLocalCalculation('Compare September and October sales.', sepResult, {
      selectedPeriod: 'Sep 2026',
      allResult,
      allRecords: valid,
      availableMonths,
      monthlyComparison,
    })

    expect(answer).not.toBeNull()
    expect(answer).toMatch(/meningkat/i)
    expect(answer).toMatch(/6,514\.70/)
    expect(answer).toMatch(/37\.4%/)
  })

  it('3. Answers specific September sales accurately even when October is currently selected', () => {
    const answer = tryLocalCalculation('What were my September sales?', oktResult, {
      selectedPeriod: 'Okt 2026',
      allResult,
      allRecords: valid,
      availableMonths,
      monthlyComparison,
    })

    expect(answer).not.toBeNull()
    expect(answer).toMatch(/September 2026/i)
    expect(answer).toMatch(/17,396\.20/)
  })

  it('4. Provides real deterministic weekday analysis ("Usually which day of the week has the highest sales?")', () => {
    const weekdayAnalytics = calculateWeekdayAnalytics(valid)
    expect(weekdayAnalytics.hasDateData).toBe(true)
    expect(weekdayAnalytics.highestRevenueDay).not.toBeNull()

    const answer = tryLocalCalculation(
      'Usually which day of the week has the highest sales?',
      allResult,
      {
        selectedPeriod: 'Semua',
        allResult,
        allRecords: valid,
        availableMonths,
      }
    )

    expect(answer).not.toBeNull()
    expect(answer).toMatch(new RegExp(weekdayAnalytics.highestRevenueDay!.nameMY, 'i'))
    expect(answer).toMatch(/purata/i)
  })

  it('5. Identifies the specific date generating the highest revenue', () => {
    const dailyAnalytics = calculateDailyAnalytics(valid)
    expect(dailyAnalytics.hasDateData).toBe(true)
    expect(dailyAnalytics.highestRevenueDate).not.toBeNull()

    const answer = tryLocalCalculation('Which date generated the highest revenue?', allResult, {
      selectedPeriod: 'Semua',
      allResult,
      allRecords: valid,
      availableMonths,
    })

    expect(answer).not.toBeNull()
    expect(answer).toMatch(dailyAnalytics.highestRevenueDate!.displayTarikh)
    expect(answer).toMatch(/1,701\.20/)
  })

  it('6. Distinguishes volume vs revenue champions for each month', () => {
    const breakdown = calculateMultiMonthBreakdown(valid, availableMonths)
    expect(breakdown.length).toBe(2)

    // September breakdown
    const sep = breakdown.find((b) => b.key === '2026-09')!
    expect(sep).toBeDefined()
    expect(sep.revenue).toBe(17396.2)
    expect(sep.bestSellerQty?.produk).toBe('Karipap')
    expect(sep.bestSellerQty?.kuantiti).toBe(1274)
    expect(sep.bestSellerRev?.produk).toBe('Brownies')
    expect(sep.bestSellerRev?.revenue).toBe(6592)

    // October breakdown
    const okt = breakdown.find((b) => b.key === '2026-10')!
    expect(okt).toBeDefined()
    expect(okt.revenue).toBe(23910.9)
    expect(okt.bestSellerQty?.produk).toBe('Nasi Lemak')

    const answer = tryLocalCalculation(
      'Which product performed best in each month?',
      allResult,
      {
        selectedPeriod: 'Semua',
        allResult,
        allRecords: valid,
        availableMonths,
      }
    )

    expect(answer).not.toBeNull()
    expect(answer).toMatch(/September 2026/i)
    expect(answer).toMatch(/Oktober 2026/i)
    expect(answer).toMatch(/Karipap/i)
    expect(answer).toMatch(/Brownies/i)
    expect(answer).toMatch(/Nasi Lemak/i)
  })

  it('7. Explains data scope and provenance with privacy preserved ("What data did you use?")', () => {
    // Data provenance and methodology questions route to Gemini (return null in local calculation)
    const localAnswer = tryLocalCalculation('What data did you use?', sepResult, {
      selectedPeriod: 'Sep 2026',
      allResult,
      allRecords: valid,
      availableMonths,
    })
    expect(localAnswer).toBeNull()

    // System instruction contains explicit data provenance rules and privacy protections
    const context = prepareBusinessContext(sepResult, {
      selectedPeriod: 'Sep 2026',
      allResult,
      allRecords: valid,
      availableMonths,
    })
    const instruction = buildSystemInstruction(context)
    expect(instruction).toMatch(/PENERANGAN ASAL USUL DATA & SUMBER KIRAAN/i)
    expect(instruction).toMatch(/privasi/i)
  })

  it('8. Delegates open-ended strategic advice to Gemini ("What can I improve next?")', () => {
    // Advice questions return null from tryLocalCalculation to allow Gemini to provide business insights
    const answer = tryLocalCalculation('What can I improve next?', allResult, {
      selectedPeriod: 'Semua',
      allResult,
      allRecords: valid,
      availableMonths,
    })

    expect(answer).toBeNull()

    // Context prepared for Gemini contains complete global awareness
    const context = prepareBusinessContext(allResult, {
      selectedPeriod: 'Semua',
      allResult,
      allRecords: valid,
      availableMonths,
    })

    expect(context.multiMonthBreakdown?.length).toBe(2)
    expect(context.weekdayAnalytics?.highestRevenueDay).toBeDefined()
    expect(context.dailyAnalytics?.highestRevenueDate).toBeDefined()

    // System instruction contains all sections
    const instruction = buildSystemInstruction(context)
    expect(instruction).toMatch(/PECAHAN PRESTASI MENGIKUT BULAN/i)
    expect(instruction).toMatch(/ANALISIS HARI & HUJUNG MINGGU/i)
    expect(instruction).toMatch(/ANALISIS TARIKH & TREND HARIAN/i)
  })

  it('9. Correctly flags undated records without inventing weekday/monthly patterns', () => {
    const undatedSales: ValidatedSale[] = [
      {
        produk: 'Karipap',
        kuantiti: 10,
        harga: 2.0,
        kos: 1.0,
        tarikh: null,
        saluran: 'Gerai',
        kategori: 'Makanan',
        kaedahBayaran: 'Tunai',
        lokasi: null,
        idTransaksi: null,
        masa: null,
        nota: null,
      },
    ]

    const weekdayAnalytics = calculateWeekdayAnalytics(undatedSales)
    expect(weekdayAnalytics.hasDateData).toBe(false)
    expect(weekdayAnalytics.highestRevenueDay).toBeNull()

    const dailyAnalytics = calculateDailyAnalytics(undatedSales)
    expect(dailyAnalytics.hasDateData).toBe(false)
    expect(dailyAnalytics.highestRevenueDate).toBeNull()

    const calcResult = calculateSales(undatedSales)
    const answer = tryLocalCalculation('Hari apa jualan paling tinggi?', calcResult, {
      selectedPeriod: 'Semua',
      allResult: calcResult,
      allRecords: undatedSales,
    })

    expect(answer).toMatch(/tiada data tarikh/i)
  })

  it('10. Correctly handles incomplete costs without inventing profit', () => {
    const noCostSales: ValidatedSale[] = [
      {
        produk: 'Air Balang',
        kuantiti: 50,
        harga: 5.0,
        kos: null, // missing cost
        tarikh: '2026-09-15',
        saluran: 'Gerai',
        kategori: 'Minuman',
        kaedahBayaran: 'Tunai',
        lokasi: null,
        idTransaksi: null,
        masa: null,
        nota: null,
      },
    ]

    const result = calculateSales(noCostSales)
    expect(result.hasCostData).toBe(false)
    expect(result.grossProfit).toBeNull()

    const answer = tryLocalCalculation('Berapa untung kasar saya?', result, {
      selectedPeriod: 'Semua',
      allResult: result,
      allRecords: noCostSales,
    })

    expect(answer).toMatch(/maklumat kos tidak lengkap/i)
  })
})
