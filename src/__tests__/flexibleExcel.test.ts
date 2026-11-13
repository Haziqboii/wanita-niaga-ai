import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs'
import * as XLSX from 'xlsx'
import { autoDetectMapping, applyMapping, findHeaderRowIndex } from '../data/parse'
import { validateSale, validateRecords } from '../data/validate'
import { calculateSales } from '../calc/sales'
import { filterSalesByMonth } from '../calc/monthly'
import { tryLocalCalculation } from '../services/aiAssistant'
import type { RawSale } from '../types'

describe('Task 6: Flexible Excel Columns & Optional Business Insights', () => {
  // 1. Basic three-column import
  it('1. Basic three-column import (Produk, Kuantiti, Harga) remains valid without errors', () => {
    const rawRows = [
      { 'Nama Produk': 'Karipap', 'Kuantiti': 100, 'Harga Jualan': 2.5 },
      { 'Nama Produk': 'Brownies', 'Kuantiti': 50, 'Harga Jualan': 8.0 },
    ]
    const mapping = autoDetectMapping(['Nama Produk', 'Kuantiti', 'Harga Jualan'])
    expect(mapping.produk).toBe('Nama Produk')
    expect(mapping.kuantiti).toBe('Kuantiti')
    expect(mapping.harga).toBe('Harga Jualan')
    expect(mapping.kos).toBeNull()
    expect(mapping.tarikh).toBeNull()
    expect(mapping.saluran).toBeNull()

    const { records } = applyMapping(rawRows, mapping)
    const { valid, invalid } = validateRecords(records)
    expect(invalid.length).toBe(0)
    expect(valid.length).toBe(2)

    const result = calculateSales(valid)
    expect(result.totalRevenue).toBe(650)
    expect(result.totalKuantiti).toBe(150)
    expect(result.grossProfit).toBeNull()
    expect(result.hasCategoryData).toBe(false)
    expect(result.hasPaymentData).toBe(false)
  })

  // 2. Full six-column import
  it('2. Full six-column import correctly populates core dimensions', () => {
    const rawRows = [
      {
        'Nama Produk': 'Karipap',
        'Kuantiti': 50,
        'Harga': 2.5,
        'Kos': 1.0,
        'Tarikh': '2026-09-01',
        'Saluran': 'Gerai',
      },
    ]
    const mapping = autoDetectMapping(['Nama Produk', 'Kuantiti', 'Harga', 'Kos', 'Tarikh', 'Saluran'])
    const { records } = applyMapping(rawRows, mapping)
    const { valid } = validateRecords(records)
    expect(valid.length).toBe(1)
    const r = valid[0]
    expect(r.produk).toBe('Karipap')
    expect(r.kuantiti).toBe(50)
    expect(r.harga).toBe(2.5)
    expect(r.kos).toBe(1.0)
    expect(r.tarikh).toBe('2026-09-01')
    expect(r.saluran).toBe('Gerai')
  })

  // 3. Twelve-column import with the 1,000-record SME workbook
  it('3. Ingests 1,000-record SME workbook preserving all 12 core and optional columns', () => {
    const fixturePath = path.resolve(
      process.cwd(),
      'src/__tests__/fixtures/Wanita_Niaga_AI_1000_Rekod_Jualan_SME_Sep_Okt_2026.xlsx'
    )
    const buf = fs.readFileSync(fixturePath)
    const wb = XLSX.read(buf, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
    const headerRowIdx = findHeaderRowIndex(rows)
    expect(headerRowIdx).toBeGreaterThanOrEqual(0)

    const headerStrings = rows[headerRowIdx].map((h) => String(h || '').trim())
    const mapping = autoDetectMapping(headerStrings)

    // Verify all 12 columns mapped
    expect(mapping.produk).toBe('Produk')
    expect(mapping.kuantiti).toBe('Kuantiti')
    expect(mapping.harga).toBe('Harga')
    expect(mapping.kos).toBe('Kos')
    expect(mapping.tarikh).toBe('Tarikh')
    expect(mapping.saluran).toBe('Saluran')
    expect(mapping.idTransaksi).toBe('ID Jualan')
    expect(mapping.kategori).toBe('Kategori')
    expect(mapping.kaedahBayaran).toBe('Kaedah Bayaran')
    expect(mapping.lokasi).toBe('Lokasi')
    expect(mapping.masa).toBe('Masa')
    expect(mapping.nota).toBe('Nota')

    // Parse data rows
    const dataRows = rows.slice(headerRowIdx + 1)
    const rawRows = dataRows.map((row) => {
      const obj: Record<string, unknown> = {}
      headerStrings.forEach((h, i) => {
        if (h) obj[h] = row[i]
      })
      return obj
    })

    const { records } = applyMapping(rawRows, mapping)
    const { valid, invalid } = validateRecords(records)
    expect(invalid.length).toBe(0)
    expect(valid.length).toBe(1000)

    // Verify optional fields preserved in validated records
    expect(valid[0].kategori).toBeTruthy()
    expect(valid[0].kaedahBayaran).toBeTruthy()
    expect(valid[0].idTransaksi).toBeTruthy()

    // Verify calculations and financial totals
    const result = calculateSales(valid)
    expect(result.recordCount).toBe(1000)
    expect(result.totalRevenue).toBe(33382.1)
    expect(result.totalKuantiti).toBe(8549)
    expect(result.grossProfit).toBe(18699.2)
    expect(result.products.length).toBe(16)
    expect(result.channels.length).toBe(5)
  })

  // 4. Automatic optional-column recognition (BM and English)
  it('4. Automatically detects BM and English optional header variations without conflict', () => {
    const englishHeaders = [
      'Product Name',
      'Qty',
      'Unit Price',
      'Unit Cost',
      'Sale Date',
      'Sales Channel',
      'Category',
      'Payment Method',
      'Location',
      'Transaction ID',
      'Time',
      'Notes',
    ]
    const mapping = autoDetectMapping(englishHeaders)
    expect(mapping.produk).toBe('Product Name')
    expect(mapping.kuantiti).toBe('Qty')
    expect(mapping.harga).toBe('Unit Price')
    expect(mapping.kos).toBe('Unit Cost')
    expect(mapping.tarikh).toBe('Sale Date')
    expect(mapping.saluran).toBe('Sales Channel')
    expect(mapping.kategori).toBe('Category')
    expect(mapping.kaedahBayaran).toBe('Payment Method')
    expect(mapping.lokasi).toBe('Location')
    expect(mapping.idTransaksi).toBe('Transaction ID')
    expect(mapping.masa).toBe('Time')
    expect(mapping.nota).toBe('Notes')
  })

  // 5. Missing optional values handled gracefully
  it('5. Handles missing optional values without row rejection or errors', () => {
    const rawRecord: RawSale = {
      produk: 'Donut Gebu',
      kuantiti: 10,
      harga: 3.0,
      kos: null,
      tarikh: null,
      saluran: null,
      kategori: undefined,
      kaedahBayaran: '',
      lokasi: null,
      idTransaksi: null,
      masa: undefined,
      nota: '',
    }
    const result = validateSale(rawRecord, 1)
    expect(result.valid).toBe(true)
    expect(result.sale).not.toBeNull()
    expect(result.sale?.kategori).toBeNull()
    expect(result.sale?.kaedahBayaran).toBeNull()
    expect(result.sale?.lokasi).toBeNull()
    expect(result.sale?.idTransaksi).toBeNull()
  })

  // 6. Transaction IDs with leading zeros preserved as strings
  it('6. Preserves transaction IDs with leading zeros as exact strings', () => {
    const rawRecord1: RawSale = {
      produk: 'Karipap',
      kuantiti: 5,
      harga: 2.5,
      idTransaksi: '00042',
    }
    const v1 = validateSale(rawRecord1, 1)
    expect(v1.sale?.idTransaksi).toBe('00042')

    // Numeric ID converted to string
    const rawRecord2: RawSale = {
      produk: 'Karipap',
      kuantiti: 5,
      harga: 2.5,
      idTransaksi: 109,
    }
    const v2 = validateSale(rawRecord2, 2)
    expect(v2.sale?.idTransaksi).toBe('109')
  })

  // 7. Category aggregation correctness
  it('7. Accurately calculates Category stats (quantity, revenue, percentage)', () => {
    const sales: RawSale[] = [
      { produk: 'Karipap', kuantiti: 10, harga: 2.0, kategori: 'Kuih Tradisional' },
      { produk: 'Keria Gula Melaka', kuantiti: 10, harga: 3.0, kategori: 'Kuih Tradisional' },
      { produk: 'Brownies', kuantiti: 5, harga: 10.0, kategori: 'Kek & Biskut' },
    ]
    const { valid } = validateRecords(sales)
    const result = calculateSales(valid)

    expect(result.hasCategoryData).toBe(true)
    expect(result.categories.length).toBe(2)

    // Kuih Tradisional: 10*2 + 10*3 = RM50 (20 units) -> 50%
    // Kek & Biskut: 5*10 = RM50 (5 units) -> 50%
    const kuih = result.categories.find((c) => c.kategori === 'Kuih Tradisional')
    expect(kuih).toBeDefined()
    expect(kuih?.revenue).toBe(50)
    expect(kuih?.kuantiti).toBe(20)
    expect(kuih?.percentage).toBe(50)

    const kek = result.categories.find((c) => c.kategori === 'Kek & Biskut')
    expect(kek).toBeDefined()
    expect(kek?.revenue).toBe(50)
    expect(kek?.kuantiti).toBe(5)
    expect(kek?.percentage).toBe(50)
  })

  // 8. Payment method aggregation correctness
  it('8. Accurately calculates Payment Method stats (transactions, revenue, percentage)', () => {
    const sales: RawSale[] = [
      { produk: 'Karipap', kuantiti: 10, harga: 2.0, kaedahBayaran: 'Tunai' },
      { produk: 'Karipap', kuantiti: 5, harga: 2.0, kaedahBayaran: 'Tunai' },
      { produk: 'Brownies', kuantiti: 2, harga: 10.0, kaedahBayaran: 'DuitNow QR' },
    ]
    const { valid } = validateRecords(sales)
    const result = calculateSales(valid)

    expect(result.hasPaymentData).toBe(true)
    expect(result.paymentMethods.length).toBe(2)

    // Tunai: 2 transactions, RM30 revenue, 60%
    const tunai = result.paymentMethods.find((p) => p.kaedah === 'Tunai')
    expect(tunai).toBeDefined()
    expect(tunai?.transaksi).toBe(2)
    expect(tunai?.revenue).toBe(30)
    expect(tunai?.kuantiti).toBe(15)
    expect(tunai?.percentage).toBe(60)

    // QR: 1 transaction, RM20 revenue, 40%
    const qr = result.paymentMethods.find((p) => p.kaedah === 'DuitNow QR')
    expect(qr).toBeDefined()
    expect(qr?.transaksi).toBe(1)
    expect(qr?.revenue).toBe(20)
    expect(qr?.kuantiti).toBe(2)
    expect(qr?.percentage).toBe(40)
  })

  // 9. Monthly filtering of optional analytics
  it('9. Monthly filtering correctly filters category and payment method metrics', () => {
    const fixturePath = path.resolve(
      process.cwd(),
      'src/__tests__/fixtures/Wanita_Niaga_AI_1000_Rekod_Jualan_SME_Sep_Okt_2026.xlsx'
    )
    const buf = fs.readFileSync(fixturePath)
    const wb = XLSX.read(buf, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
    const headerRowIdx = findHeaderRowIndex(rows)
    const headerStrings = rows[headerRowIdx].map((h) => String(h || '').trim())
    const mapping = autoDetectMapping(headerStrings)
    const dataRows = rows.slice(headerRowIdx + 1)
    const rawRows = dataRows.map((row) => {
      const obj: Record<string, unknown> = {}
      headerStrings.forEach((h, i) => {
        if (h) obj[h] = row[i]
      })
      return obj
    })
    const { records } = applyMapping(rawRows, mapping)
    const { valid } = validateRecords(records)

    // Filter for September 2026
    const sepSales = filterSalesByMonth(valid, '2026-09')
    const sepResult = calculateSales(sepSales)
    expect(sepResult.recordCount).toBe(495)
    expect(sepResult.totalRevenue).toBe(16220.7)
    expect(sepResult.hasCategoryData).toBe(true)
    expect(sepResult.hasPaymentData).toBe(true)

    // Filter for October 2026
    const oktSales = filterSalesByMonth(valid, '2026-10')
    const oktResult = calculateSales(oktSales)
    expect(oktResult.recordCount).toBe(505)
    expect(oktResult.totalRevenue).toBe(17161.4)
    expect(oktResult.hasCategoryData).toBe(true)
    expect(oktResult.hasPaymentData).toBe(true)

    // Sum of September and October category revenues equals total revenue
    const sepCatRev = sepResult.categories.reduce((acc, c) => acc + c.revenue, 0)
    const oktCatRev = oktResult.categories.reduce((acc, c) => acc + c.revenue, 0)
    expect(Math.round((sepCatRev + oktCatRev) * 100) / 100).toBe(33382.1)
  })

  // 10. AI Assistant handles category and payment questions locally
  it('10. Local assistant answers category and payment questions accurately', () => {
    const fixturePath = path.resolve(
      process.cwd(),
      'src/__tests__/fixtures/Wanita_Niaga_AI_1000_Rekod_Jualan_SME_Sep_Okt_2026.xlsx'
    )
    const buf = fs.readFileSync(fixturePath)
    const wb = XLSX.read(buf, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
    const headerRowIdx = findHeaderRowIndex(rows)
    const headerStrings = rows[headerRowIdx].map((h) => String(h || '').trim())
    const mapping = autoDetectMapping(headerStrings)
    const dataRows = rows.slice(headerRowIdx + 1)
    const rawRows = dataRows.map((row) => {
      const obj: Record<string, unknown> = {}
      headerStrings.forEach((h, i) => {
        if (h) obj[h] = row[i]
      })
      return obj
    })
    const { records } = applyMapping(rawRows, mapping)
    const { valid } = validateRecords(records)
    const result = calculateSales(valid)

    // Top Category question
    const topCatAnswer = tryLocalCalculation('Kategori apa paling tinggi jualan?', result)
    expect(topCatAnswer).toContain('Kategori yang menjana jualan tertinggi')
    expect(topCatAnswer).toContain(result.categories[0].kategori)

    // Top Payment method question
    const topPayAnswer = tryLocalCalculation('Kaedah bayaran mana paling banyak?', result)
    expect(topPayAnswer).toContain('Kaedah bayaran paling utama')
    expect(topPayAnswer).toContain(result.paymentMethods[0].kaedah)
  })
})
