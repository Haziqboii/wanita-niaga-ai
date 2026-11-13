import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import * as XLSX from 'xlsx'
import { autoDetectMapping, applyMapping, findHeaderRowIndex } from '../data/parse'
import { validateRecords } from '../data/validate'
import { calculateSales } from '../calc/sales'
import { filterSalesByMonth } from '../calc/monthly'
import { tryLocalCalculation } from '../services/aiAssistant'
import type { RawSale } from '../types'

describe('WANITA NIAGA AI — TASK 5: Dual Product Champions Test Suite', () => {
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

  it('1. SEMUA (All-Time): Accurately distinguishes Volume Champion from Revenue Champion', () => {
    const result = calculateSales(valid)
    // A. Paling Banyak Terjual (Volume Champion)
    expect(result.bestSeller?.produk).toBe('Karipap')
    expect(result.bestSeller?.kuantiti).toBe(1573)

    // B. Hasil Jualan Tertinggi (Revenue Champion)
    expect(result.highestRevenue?.produk).toBe('Brownies')
    expect(result.highestRevenue?.revenue).toBe(4928)
  })

  it('2. SEPTEMBER 2026: Accurately identifies monthly champions', () => {
    const sepSales = filterSalesByMonth(valid, '2026-09')
    const sepCalc = calculateSales(sepSales)

    // A. Highest quantity: Karipap, 798 units
    expect(sepCalc.bestSeller?.produk).toBe('Karipap')
    expect(sepCalc.bestSeller?.kuantiti).toBe(798)

    // B. Highest revenue: Brownies, RM1,992.00
    expect(sepCalc.highestRevenue?.produk).toBe('Brownies')
    expect(sepCalc.highestRevenue?.revenue).toBe(1992)
  })

  it('3. OCTOBER 2026: Accurately identifies monthly champions', () => {
    const oktSales = filterSalesByMonth(valid, '2026-10')
    const oktCalc = calculateSales(oktSales)

    // A. Highest quantity: Karipap, 775 units
    expect(oktCalc.bestSeller?.produk).toBe('Karipap')
    expect(oktCalc.bestSeller?.kuantiti).toBe(775)

    // B. Highest revenue: Brownies, RM2,936.00
    expect(oktCalc.highestRevenue?.produk).toBe('Brownies')
    expect(oktCalc.highestRevenue?.revenue).toBe(2936)
  })

  it('4. Chatbot cleanly distinguishes volume champion vs revenue champion vs dual champions', () => {
    const result = calculateSales(valid)

    // A. Volume champion question in various wordings
    const ansVol1 = tryLocalCalculation('Produk paling laris?', result)
    expect(ansVol1).toContain('Karipap')
    expect(ansVol1).toContain('1,573 unit')

    const ansVol2 = tryLocalCalculation('Produk mana paling banyak terjual?', result)
    expect(ansVol2).toContain('Karipap')
    expect(ansVol2).toContain('1,573 unit')

    const ansVol3 = tryLocalCalculation('Which is the best-selling product by units?', result)
    expect(ansVol3).toContain('Karipap')

    // B. Revenue champion question in various wordings
    const ansRev1 = tryLocalCalculation('Produk mana menghasilkan jumlah jualan paling tinggi?', result)
    expect(ansRev1).toContain('Brownies')
    expect(ansRev1).toContain('RM4,928.00')

    const ansRev2 = tryLocalCalculation('Produk hasil jualan tertinggi?', result)
    expect(ansRev2).toContain('Brownies')
    expect(ansRev2).toContain('RM4,928.00')

    const ansRev3 = tryLocalCalculation('Which is the highest revenue product?', result)
    expect(ansRev3).toContain('Brownies')

    // C. Dual Champion question
    const ansDual = tryLocalCalculation('Apakah dua produk juara jualan?', result)
    expect(ansDual).toContain('Karipap')
    expect(ansDual).toContain('Brownies')
  })

  it('5. Edge Case: Handles single product (double champion)', () => {
    const singleProduct: RawSale[] = [
      { produk: 'Kek Marble', kuantiti: '50', harga: '20.00', kos: '10.00' },
    ]
    const { valid: singleValid } = validateRecords(singleProduct)
    const singleCalc = calculateSales(singleValid)

    expect(singleCalc.bestSeller?.produk).toBe('Kek Marble')
    expect(singleCalc.highestRevenue?.produk).toBe('Kek Marble')

    const ansDual = tryLocalCalculation('Apakah dua produk juara?', singleCalc)
    expect(ansDual).toContain('juara berganda')
    expect(ansDual).toContain('Kek Marble')
  })

  it('6. Edge Case: Handles tied quantities deterministically with clear communication', () => {
    const tiedRecords: RawSale[] = [
      { produk: 'Donut Coklat', kuantiti: '100', harga: '2.00', kos: '1.00' }, // Rev: RM200
      { produk: 'Donut Strawberry', kuantiti: '100', harga: '3.00', kos: '1.50' }, // Rev: RM300
    ]
    const { valid: tiedValid } = validateRecords(tiedRecords)
    const tiedCalc = calculateSales(tiedValid)

    // Best seller deterministic tie-breaker favors higher revenue (Donut Strawberry)
    expect(tiedCalc.bestSeller?.produk).toBe('Donut Strawberry')
    expect(tiedCalc.highestRevenue?.produk).toBe('Donut Strawberry')

    // Local matcher acknowledges tie
    const ansTie = tryLocalCalculation('Produk paling banyak terjual?', tiedCalc)
    expect(ansTie).toContain('seri antara')
    expect(ansTie).toContain('100 unit')
  })

  it('7. Edge Case: Handles empty records gracefully', () => {
    const emptyCalc = calculateSales([])
    expect(emptyCalc.bestSeller).toBeNull()
    expect(emptyCalc.highestRevenue).toBeNull()

    const ans = tryLocalCalculation('Produk paling laris?', emptyCalc)
    expect(ans).toContain('Tiada rekod data jualan')
  })
})
