import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs'
import * as XLSX from 'xlsx'
import { calculateSales, toCents, fromCents } from '../calc/sales'
import {
  validateSale,
  validateRecords,
  normalizeDate,
  formatRM,
  formatDateMY,
} from '../data/validate'
import { autoDetectMapping, applyMapping, findHeaderRowIndex } from '../data/parse'
import { SAMPLE_SALES } from '../data/sample'
import { getAssistantResponse, tryLocalCalculation } from '../services/aiAssistant'
import type { RawSale, ValidatedSale } from '../types'

describe('Wanita Niaga AI - Phase 1 Test Suite', () => {
  // Scenario 1: Sample dataset generates the expected dashboard
  it('Scenario 1: Sample dataset generates the expected calculations and metrics', () => {
    const result = calculateSales(SAMPLE_SALES, null)

    // Karipap: 120 + 40 + 60 = 220 units @ RM2.50 = RM550.00
    // Brownies: 30 + 25 + 15 = 70 units @ RM8.00 = RM560.00
    // Kuih Lapis: 50 + 20 + 35 = 105 units @ RM4.00 = RM420.00
    // Total Revenue = 550 + 560 + 420 = RM1530.00
    // Total Quantity = 220 + 70 + 105 = 395 units
    expect(result.totalRevenue).toBe(1530)
    expect(result.totalKuantiti).toBe(395)

    // Total Cost:
    // Karipap: 220 * 0.80 = 176
    // Brownies: 70 * 3.00 = 210
    // Kuih Lapis: 105 * 1.50 = 157.50
    // Total Cost = 176 + 210 + 157.50 = RM543.50
    expect(result.totalCost).toBe(543.5)
    expect(result.grossProfit).toBe(1530 - 543.5) // RM986.50
    expect(result.costComplete).toBe(true)

    // Best seller by quantity: Karipap (220)
    expect(result.bestSeller?.produk).toBe('Karipap')
    expect(result.bestSeller?.kuantiti).toBe(220)

    // Highest revenue: Brownies (RM560)
    expect(result.highestRevenue?.produk).toBe('Brownies')
    expect(result.highestRevenue?.revenue).toBe(560)

    // Highest profit: Karipap (550 - 176 = 374) vs Brownies (560 - 210 = 350)
    expect(result.highestProfit?.produk).toBe('Karipap')
    expect(result.highestProfit?.grossProfit).toBe(374)

    // Trends: 9 unique dates in sample
    expect(result.hasDateData).toBe(true)
    expect(result.trends.length).toBe(9)

    // Channels: Booth (RM1270), Online (RM220), Lain-lain (RM40)
    expect(result.hasChannelData).toBe(true)
    expect(result.channels.length).toBe(3)
  })

  // Scenario 2: Manual sales entry works
  it('Scenario 2: Manual sales entry validation and object mapping work properly', () => {
    const manualRow: RawSale = {
      produk: 'Sambal Garing Che Nor',
      kuantiti: 15,
      harga: 12.5,
      kos: 7.0,
      tarikh: '2026-03-01',
      saluran: 'Online',
    }

    const { valid, sale, issues } = validateSale(manualRow, 1)
    expect(valid).toBe(true)
    expect(issues.length).toBe(0)
    expect(sale?.produk).toBe('Sambal Garing Che Nor')
    expect(sale?.kuantiti).toBe(15)
    expect(sale?.harga).toBe(12.5)
    expect(sale?.kos).toBe(7.0)

    // Test calculation on this single record
    const result = calculateSales([sale!])
    expect(result.totalRevenue).toBe(187.5) // 15 * 12.50
    expect(result.totalCost).toBe(105) // 15 * 7.00
    expect(result.grossProfit).toBe(82.5) // 187.50 - 105.00
  })

  // Scenario 3: Column auto-detection & mapping for CSV headers
  it('Scenario 3: Column auto-detection accurately maps Malay and English aliases', () => {
    const malayHeaders = ['Barang', 'Qty', 'Harga Seunit', 'Kos Seunit', 'Tarikh Jualan', 'Saluran Jualan']
    const mapping = autoDetectMapping(malayHeaders)

    expect(mapping.produk).toBe('Barang')
    expect(mapping.kuantiti).toBe('Qty')
    expect(mapping.harga).toBe('Harga Seunit')
    expect(mapping.kos).toBe('Kos Seunit')
    expect(mapping.tarikh).toBe('Tarikh Jualan')
    expect(mapping.saluran).toBe('Saluran Jualan')

    const rawRows = [
      {
        Barang: 'Kek Batik',
        Qty: '20',
        'Harga Seunit': '15.00',
        'Kos Seunit': '6.50',
        'Tarikh Jualan': '10/02/2026',
        'Saluran Jualan': 'Booth',
      },
    ]

    const { records } = applyMapping(rawRows, mapping)
    expect(records.length).toBe(1)
    expect(records[0].produk).toBe('Kek Batik')
    expect(records[0].kuantiti).toBe('20')
    expect(records[0].harga).toBe('15.00')

    const validated = validateRecords(records)
    expect(validated.valid.length).toBe(1)
    expect(validated.valid[0].tarikh).toBe('2026-02-10') // Normalized date
    expect(validated.valid[0].saluran).toBe('Booth')
  })

  // Scenario 4: Excel dates and formats normalizer
  it('Scenario 4: Date normalizer handles Malaysian DD/MM/YYYY, ISO, and Excel dates', () => {
    expect(normalizeDate('25/12/2026')).toBe('2026-12-25')
    expect(normalizeDate('5/1/2026')).toBe('2026-01-05')
    expect(normalizeDate('2026-01-15')).toBe('2026-01-15')
    expect(normalizeDate('')).toBe(null)
    expect(normalizeDate(null)).toBe(null)

    // Formatted Malaysian display
    expect(formatDateMY('2026-01-05')).toBe('5 Jan 2026')
    expect(formatDateMY('2026-08-31')).toBe('31 Ogo 2026')
  })

  // Scenario 5: Missing costs do not create fake profits
  it('Scenario 5: Missing costs do not create fake profits or assume zero', () => {
    const salesWithoutCost: ValidatedSale[] = [
      { produk: 'Pulut Panggang', kuantiti: 50, harga: 2.0, kos: null, tarikh: null, saluran: null },
      { produk: 'Keria Gula Melaka', kuantiti: 40, harga: 1.5, kos: null, tarikh: null, saluran: null },
    ]

    const result = calculateSales(salesWithoutCost)
    expect(result.totalRevenue).toBe(160) // (50*2) + (40*1.5) = 100 + 60
    expect(result.totalKuantiti).toBe(90)
    expect(result.hasCostData).toBe(false)
    expect(result.costComplete).toBe(false)
    expect(result.totalCost).toBe(null) // Strictly null, not 0!
    expect(result.grossProfit).toBe(null) // Strictly null!
    expect(result.estimatedNetProfit).toBe(null) // Strictly null!

    // If one row has cost and one doesn't
    const partialCostSales: ValidatedSale[] = [
      { produk: 'Pulut Panggang', kuantiti: 50, harga: 2.0, kos: 0.8, tarikh: null, saluran: null },
      { produk: 'Keria Gula Melaka', kuantiti: 40, harga: 1.5, kos: null, tarikh: null, saluran: null },
    ]
    const partialResult = calculateSales(partialCostSales)
    expect(partialResult.costComplete).toBe(false)
    expect(partialResult.grossProfit).toBe(null) // Not complete, so overall gross profit is null
  })

  // Scenario 6: Missing dates do not create fabricated trends
  it('Scenario 6: Missing dates do not create fabricated trends', () => {
    const salesWithoutDate: ValidatedSale[] = [
      { produk: 'Popia', kuantiti: 30, harga: 2.0, kos: 1.0, tarikh: null, saluran: null },
    ]

    const result = calculateSales(salesWithoutDate)
    expect(result.hasDateData).toBe(false)
    expect(result.trends.length).toBe(0) // No fabricated dates!
  })

  // Scenario 7: Invalid data produces understandable errors
  it('Scenario 7: Invalid data produces understandable errors and does not crash', () => {
    const invalidRecords: RawSale[] = [
      { produk: '', kuantiti: 'abc', harga: '-5', kos: '-2' },
      { produk: 'Biskut Semperit', kuantiti: '0', harga: '20' },
      { produk: 'Tart Nenas', kuantiti: '10.5', harga: 'abc' },
    ]

    const { valid, invalid, allIssues } = validateRecords(invalidRecords)
    expect(valid.length).toBe(0)
    expect(invalid.length).toBe(3)
    expect(allIssues.length).toBeGreaterThan(0)

    // Check that issues specify field and understandable Malay messages
    const produkIssue = allIssues.find((i) => i.field === 'produk')
    expect(produkIssue).toBeDefined()
    expect(produkIssue?.message).toContain('Nama produk')

    const kuantitiIssue = allIssues.find((i) => i.field === 'kuantiti')
    expect(kuantitiIssue).toBeDefined()
  })

  // Scenario 8: Dashboard updates with operating expenses and record editing
  it('Scenario 8: Dashboard calculates Net Profit accurately when operating expenses are added', () => {
    // With sample data: Gross Profit is RM986.50
    // If user enters RM250.00 operating expenses (e.g. stall rental & petrol)
    const opex = 250
    const resultWithOpex = calculateSales(SAMPLE_SALES, opex)

    expect(resultWithOpex.operatingExpenses).toBe(250)
    expect(resultWithOpex.grossProfit).toBe(986.5)
    expect(resultWithOpex.estimatedNetProfit).toBe(986.5 - 250) // RM736.50
  })

  // Scenario 9: Suggested numerical questions return correct answers
  it('Scenario 9: Suggested questions return accurate numerical answers via local calculation', async () => {
    const salesResult = calculateSales(SAMPLE_SALES, 200)

    // Q1: Produk mana paling laris?
    const q1Res = await getAssistantResponse('Produk mana paling laris?', salesResult)
    expect(q1Res.answer).toContain('Karipap')
    expect(q1Res.answer).toContain('220 unit')
    expect(q1Res.isLocalCalculation).toBe(true)
    expect(q1Res.source).toBe('local')

    // Q2: Berapakah jumlah jualan saya?
    const q2Res = await getAssistantResponse('Berapakah jumlah jualan saya?', salesResult)
    expect(q2Res.answer).toContain('RM1,530.00')
    expect(q2Res.answer).toContain('395')
    expect(q2Res.isLocalCalculation).toBe(true)
    expect(q2Res.source).toBe('local')

    // Q3: Produk mana paling banyak memberi keuntungan?
    const q3Res = await getAssistantResponse('Produk mana paling banyak memberi keuntungan?', salesResult)
    expect(q3Res.answer).toContain('Karipap')
    expect(q3Res.answer).toContain('RM374.00')
    expect(q3Res.isLocalCalculation).toBe(true)
    expect(q3Res.source).toBe('local')
  })

  // Scenario 10: Financial integer cents precision
  it('Scenario 10: Floating point arithmetic avoids 0.1 + 0.2 precision pitfalls via integer cents', () => {
    const cents1 = toCents(0.1)
    const cents2 = toCents(0.2)
    expect(fromCents(cents1 + cents2)).toBe(0.3)
    expect(formatRM(1530.5)).toBe('RM1,530.50')
  })

  // Scenario 11: Distinguishes missing operating expenses (null) from explicitly provided zero expenses (0)
  it('Scenario 11: Distinguishes missing operating expenses (null) from explicitly provided zero expenses (0)', () => {
    // 1. Missing operating expenses (null) -> Untung Kasar is computed, Net Profit is null
    const resultMissingOpex = calculateSales(SAMPLE_SALES, null)
    expect(resultMissingOpex.operatingExpenses).toBe(null)
    expect(resultMissingOpex.grossProfit).toBe(986.5)
    expect(resultMissingOpex.estimatedNetProfit).toBe(null) // Must NOT infer zero or compute net profit

    // 2. Explicitly provided zero expenses (0) -> Both valid and distinct, Net Profit equals Gross Profit
    const resultZeroOpex = calculateSales(SAMPLE_SALES, 0)
    expect(resultZeroOpex.operatingExpenses).toBe(0)
    expect(resultZeroOpex.grossProfit).toBe(986.5)
    expect(resultZeroOpex.estimatedNetProfit).toBe(986.5) // Computed as Gross Profit - 0

    // 3. Explicitly positive expenses (e.g. RM250) -> Net Profit is Gross Profit - 250
    const resultPositiveOpex = calculateSales(SAMPLE_SALES, 250)
    expect(resultPositiveOpex.operatingExpenses).toBe(250)
    expect(resultPositiveOpex.estimatedNetProfit).toBe(736.5)
  })

  // Scenario 12: Handles detailed multi-column worksheets with extra metadata and alias matching
  it('Scenario 12: Auto-detects columns and ignores extra metadata in detailed worksheets', () => {
    const detailedHeaders = [
      'No',
      'Invoice No',
      'Transaction Date',
      'Customer Name',
      'Phone Number',
      'Item Description',
      'Category',
      'Units Sold',
      'Rate',
      'Gross Sales',
      'COGS',
      'Net Amount',
      'Sales Channel',
      'Payment Method',
      'Remarks',
    ]

    const mapping = autoDetectMapping(detailedHeaders)
    expect(mapping.produk).toBe('Item Description')
    expect(mapping.kuantiti).toBe('Units Sold')
    expect(mapping.harga).toBe('Rate')
    expect(mapping.kos).toBe('COGS')
    expect(mapping.tarikh).toBe('Transaction Date')
    expect(mapping.saluran).toBe('Sales Channel')

    // Test applying mapping with detailed data including currency strings and summary rows
    const rawRows = [
      {
        No: 1,
        'Invoice No': 'INV-001',
        'Transaction Date': '2024-03-15',
        'Customer Name': 'Puan Salmah',
        'Phone Number': '012-3456789',
        'Item Description': 'Kek Batik Indulgence',
        Category: 'Kek',
        'Units Sold': '12',
        Rate: 'RM 35.00',
        'Gross Sales': 'RM 420.00',
        COGS: 'RM 15.00',
        'Net Amount': 'RM 240.00',
        'Sales Channel': 'Online',
        'Payment Method': 'DuitNow QR',
        Remarks: 'Penghantaran ekspres',
      },
      {
        No: 2,
        'Invoice No': 'INV-002',
        'Transaction Date': '16/03/2024',
        'Customer Name': 'Encik Amir',
        'Phone Number': '019-8765432',
        'Item Description': 'Biskut Almond London',
        Category: 'Biskut',
        'Units Sold': '25',
        Rate: 'RM 28.00',
        'Gross Sales': 'RM 700.00',
        COGS: 'RM 12.00',
        'Net Amount': 'RM 400.00',
        'Sales Channel': 'Booth',
        'Payment Method': 'Tunai',
        Remarks: '',
      },
      // Summary / Total row that often exists at the bottom of accounting spreadsheets
      {
        No: '',
        'Invoice No': '',
        'Transaction Date': '',
        'Customer Name': '',
        'Phone Number': '',
        'Item Description': 'JUMLAH KESELURUHAN',
        Category: '',
        'Units Sold': '37',
        Rate: '',
        'Gross Sales': 'RM 1,120.00',
        COGS: '',
        'Net Amount': 'RM 640.00',
        'Sales Channel': '',
        'Payment Method': '',
        Remarks: '',
      },
    ]

    const { records, skippedRows } = applyMapping(rawRows, mapping)
    // The summary row 'JUMLAH KESELURUHAN' must be skipped
    expect(skippedRows).toBe(1)
    expect(records.length).toBe(2)

    const { valid, invalid } = validateRecords(records)
    expect(valid.length).toBe(2)
    expect(invalid.length).toBe(0)

    const result = calculateSales(valid)
    // 12 * 35 = 420; 25 * 28 = 700 -> Total = 1120
    expect(result.totalRevenue).toBe(1120)
    expect(result.totalKuantiti).toBe(37)
    // Cost: 12 * 15 = 180; 25 * 12 = 300 -> Total = 480
    expect(result.totalCost).toBe(480)
    expect(result.grossProfit).toBe(640)
  })

  // Scenario 13: Detects true header row even with title banners on top rows
  it('Scenario 13: Detects header row when top rows contain title banners or subtitles', () => {
    const sheetWithBanner = [
      ['GERAI MAKANAN KAK ZA', '', '', '', ''],
      ['Laporan Jualan Bulanan Mac 2024', '', '', '', ''],
      ['Tarikh Cetakan: 31/03/2024', '', '', '', ''],
      ['No', 'Nama Produk', 'Bilangan', 'Harga Seunit', 'Kos Modal', 'Saluran'],
      ['1', 'Nasi Lemak Ayam Berempah', '50', 'RM8.00', 'RM4.00', 'Booth'],
      ['2', 'Mee Goreng Mamak', '30', 'RM6.00', 'RM2.50', 'Booth'],
    ]

    const headerIdx = findHeaderRowIndex(sheetWithBanner)
    expect(headerIdx).toBe(3) // Row index 3 has 'Nama Produk', 'Bilangan', 'Harga Seunit'...
  })

  // Scenario 14: Flexibly detects RM in Harga and Kos without showing RALAT
  it('Scenario 14: Flexibly detects RM in Harga and Kos without showing RALAT', () => {
    const rawSalesWithRM: RawSale[] = [
      { produk: 'Nasi Lemak', kuantiti: '10', harga: 'RM 15.00', kos: 'RM 8.00' },
      { produk: 'Kek Lapis', kuantiti: '5 unit', harga: 'RM25', kos: 'RM 12.50' },
      { produk: 'Karipap', kuantiti: '50 biji', harga: 'rm 2.50', kos: '80 sen' },
      { produk: 'Sambal Botol', kuantiti: '20', harga: 'MYR 10.00', kos: 'RM -' },
      { produk: 'Biskut Raya', kuantiti: '15', harga: 'RM 1,250.00', kos: 'RM 800.00' },
      { produk: 'Katering Set', kuantiti: '2 pax', harga: 'RM 45 / unit', kos: 'RM 20 / set' },
      { produk: 'Brownies', kuantiti: '8', harga: 'RM\u00A030.00', kos: 'RM\u00A015.00' }, // Non-breaking space from Excel
    ]

    const { valid, invalid, allIssues } = validateRecords(rawSalesWithRM)

    // All rows MUST be valid with 0 errors
    expect(invalid.length).toBe(0)
    expect(allIssues.length).toBe(0)
    expect(valid.length).toBe(7)

    // Verify parsed numeric values
    expect(valid[0].harga).toBe(15.0)
    expect(valid[0].kos).toBe(8.0)

    expect(valid[1].kuantiti).toBe(5)
    expect(valid[1].harga).toBe(25.0)
    expect(valid[1].kos).toBe(12.5)

    expect(valid[2].kuantiti).toBe(50)
    expect(valid[2].harga).toBe(2.5)
    expect(valid[2].kos).toBe(0.8) // 80 sen converted to RM0.80

    expect(valid[3].harga).toBe(10.0)
    expect(valid[3].kos).toBe(0) // "RM -" parsed to 0

    expect(valid[4].harga).toBe(1250.0) // "RM 1,250.00" parsed cleanly
    expect(valid[4].kos).toBe(800.0)

    expect(valid[5].kuantiti).toBe(2)
    expect(valid[5].harga).toBe(45.0) // "RM 45 / unit"
    expect(valid[5].kos).toBe(20.0) // "RM 20 / set"

    expect(valid[6].harga).toBe(30.0) // Non-breaking space
    expect(valid[6].kos).toBe(15.0)
  })

  // Scenario 15: 1,000-Row SME Excel Dataset Regression Verification
  it('Scenario 15: Ingests 1,000-row SME Excel dataset with 100% acceptance and preserves all 5 channels', () => {
    const fixturePath = path.resolve(process.cwd(), 'src/__tests__/fixtures/Wanita_Niaga_AI_1000_Rekod_Jualan_SME_Sep_Okt_2026.xlsx')
    const buf = fs.readFileSync(fixturePath)
    const wb = XLSX.read(buf, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
    })

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

    const { records, skippedRows } = applyMapping(rawRows, mapping)
    expect(skippedRows).toBe(0)
    expect(records.length).toBe(1000)

    const { valid, invalid, allIssues } = validateRecords(records)
    // 1. All 1,000 rows accepted, 0 rejected
    expect(invalid.length).toBe(0)
    expect(allIssues.length).toBe(0)
    expect(valid.length).toBe(1000)

    // Calculate metrics
    const result = calculateSales(valid)

    // 2. Exact Totals
    expect(result.totalRevenue).toBe(33382.1)
    expect(result.totalKuantiti).toBe(8549)
    expect(result.grossProfit).toBe(18699.2)
    expect(result.products.length).toBe(16)

    // 3. Best Seller by volume
    expect(result.bestSeller?.produk).toBe('Karipap')
    expect(result.bestSeller?.kuantiti).toBe(1573)

    // 4. Preserve all 5 distinct channels with exact expected revenues
    expect(result.hasChannelData).toBe(true)
    expect(result.channels.length).toBe(5)

    const channelMap = new Map(result.channels.map((c) => [c.saluran, c.revenue]))
    expect(channelMap.get('Gerai')).toBe(14698.7)
    expect(channelMap.get('WhatsApp')).toBe(6289.9)
    expect(channelMap.get('Booth')).toBe(4208.4)
    expect(channelMap.get('Online')).toBe(2268.7)
    expect(channelMap.get('Tempahan')).toBe(5916.4)
  })

  // Scenario 16: Preserves Unknown vs Zero Cost & Rejection of Invalid Records
  it('Scenario 16: Correctly distinguishes unknown cost from explicit zero cost and rejects genuinely invalid records', () => {
    const mixedRecords: RawSale[] = [
      // Explicit zero costs
      { produk: 'Kek Pisang', kuantiti: '10', harga: '5.00', kos: '0' },
      { produk: 'Kek Coklat', kuantiti: '5', harga: '10.00', kos: '0.00' },
      { produk: 'Kek Batik', kuantiti: '8', harga: '8.00', kos: 'RM 0.00' },
      { produk: 'Donut', kuantiti: '12', harga: '2.00', kos: 'RM -' },

      // Unknown / missing optional costs
      { produk: 'Karipap', kuantiti: '20', harga: '2.00', kos: '-' },
      { produk: 'Popia', kuantiti: '15', harga: '1.50', kos: '--' },
      { produk: 'Samosa', kuantiti: '10', harga: '2.50', kos: 'N/A' },
      { produk: 'Roti Jala', kuantiti: '6', harga: '6.00', kos: '' },

      // Invalid rows
      { produk: '', kuantiti: '10', harga: '5.00', kos: '2.00' }, // missing product name
      { produk: 'Mee Rebus', kuantiti: '-5', harga: '7.00', kos: '3.00' }, // negative quantity
      { produk: 'Laksa', kuantiti: '10', harga: 'bukan_harga', kos: '3.00' }, // invalid price
      { produk: 'Nasi Minyak', kuantiti: '10', harga: '10.00', kos: 'kos_rosak' }, // invalid cost text
      {
        produk: 'Pulut Inti',
        kuantiti: '5',
        harga: '3.00',
        saluran: 'Saluran yang terlampau panjang dan melebihi lima puluh aksara untuk menguji had validasi saluran jualan',
      }, // channel > 50 chars
    ]

    const { valid, invalid } = validateRecords(mixedRecords)

    // First 8 rows are valid
    expect(valid.length).toBe(8)
    // Last 5 rows are invalid
    expect(invalid.length).toBe(5)

    // Explicit zero costs are 0
    expect(valid[0].kos).toBe(0)
    expect(valid[1].kos).toBe(0)
    expect(valid[2].kos).toBe(0)
    expect(valid[3].kos).toBe(0)

    // Unknown costs are null
    expect(valid[4].kos).toBe(null)
    expect(valid[5].kos).toBe(null)
    expect(valid[6].kos).toBe(null)
    expect(valid[7].kos).toBe(null)

    // Verify invalid rows issues
    expect(invalid[0].issues.some((i) => i.field === 'produk')).toBe(true)
    expect(invalid[1].issues.some((i) => i.field === 'kuantiti')).toBe(true)
    expect(invalid[2].issues.some((i) => i.field === 'harga')).toBe(true)
    expect(invalid[3].issues.some((i) => i.field === 'kos')).toBe(true)
    expect(invalid[4].issues.some((i) => i.field === 'saluran')).toBe(true)
  })

  // Scenario 17: Local Intent Hierarchy & Multilingual Matching (Task 2)
  it('Scenario 17: Intent hierarchy correctly routes product rankings, metrics, Manglish and advice questions', () => {
    // Load 1,000-row SME dataset
    const fixturePath = path.resolve(process.cwd(), 'src/__tests__/fixtures/Wanita_Niaga_AI_1000_Rekod_Jualan_SME_Sep_Okt_2026.xlsx')
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
      headers.forEach((h, idx) => { obj[h] = rowData[idx] ?? '' })
      rawRows.push(obj)
    }
    const { records } = applyMapping(rawRows, mapping)
    const { valid } = validateRecords(records)
    const result = calculateSales(valid) // operating expenses is null initially

    // 1. Distinction: Highest Revenue Product vs Best Seller by Quantity
    // A2: Highest Revenue Product (Brownies, RM4,928.00)
    const ansRevMalay = tryLocalCalculation('Produk mana menghasilkan jumlah jualan paling tinggi?', result)
    expect(ansRevMalay).toContain('Brownies')
    expect(ansRevMalay).toContain('RM4,928.00')

    const ansRevManglish = tryLocalCalculation('produk apa got the highest sales?', result)
    expect(ansRevManglish).toContain('Brownies')
    expect(ansRevManglish).toContain('RM4,928.00')

    const ansRevEnglish = tryLocalCalculation('Which product generated the most RM?', result)
    expect(ansRevEnglish).toContain('Brownies')

    // A1: Best Seller by Quantity (Karipap, 1,573 unit)
    const ansQtyMalay = tryLocalCalculation('Produk mana paling laris?', result)
    expect(ansQtyMalay).toContain('Karipap')
    expect(ansQtyMalay).toContain('1,573 unit')

    const ansQtyEnglish = tryLocalCalculation('Which product sold the most units?', result)
    expect(ansQtyEnglish).toContain('Karipap')
    expect(ansQtyEnglish).toContain('1,573 unit')

    const ansQtyManglish = tryLocalCalculation('Which product paling banyak terjual?', result)
    expect(ansQtyManglish).toContain('Karipap')

    // A3: Highest Profit Product
    const ansProfit = tryLocalCalculation('Produk mana paling untung?', result)
    expect(ansProfit).toContain('keuntungan')
    expect(ansProfit).toContain(result.highestProfit?.produk || '')

    // A4: Specific Named Product Inquiries
    const ansNamedQty = tryLocalCalculation('Karipap sold how many?', result)
    expect(ansNamedQty).toContain('1,573 unit')
    expect(ansNamedQty).toContain('Karipap')

    const ansNamedProfit = tryLocalCalculation('How much profit did Brownies make?', result)
    expect(ansNamedProfit).toContain('Brownies')
    expect(ansNamedProfit).toContain('untung kasar')

    // B1: Total Business Revenue (Malay, Manglish, English)
    const ansTotalMalay = tryLocalCalculation('Berapakah jumlah jualan saya?', result)
    expect(ansTotalMalay).toContain('RM33,382.10')
    expect(ansTotalMalay).toContain('8,549 unit')

    const ansTotalManglish = tryLocalCalculation('Berapa total sales saya?', result)
    expect(ansTotalManglish).toContain('RM33,382.10')

    const ansTotalStore = tryLocalCalculation('Berapa total sales kedai saya?', result)
    expect(ansTotalStore).toContain('RM33,382.10')

    // B2: Total Units Sold
    const ansTotalUnits = tryLocalCalculation('Berapa unit terjual overall?', result)
    expect(ansTotalUnits).toContain('8,549 unit')

    // B3: Gross Profit
    const ansGrossProfit = tryLocalCalculation('Untung kasar saya berapa?', result)
    expect(ansGrossProfit).toContain('RM18,699.20')

    // B4: Estimated Net Profit (when opex is missing vs present)
    const ansNetMissing = tryLocalCalculation('Berapa untung bersih?', result)
    expect(ansNetMissing).toContain('perbelanjaan operasi') // explains requirement

    const resultWithOpex = calculateSales(valid, 3000)
    const ansNetPresent = tryLocalCalculation('Berapa untung bersih?', resultWithOpex)
    expect(ansNetPresent).toContain('RM15,699.20') // 18699.20 - 3000

    // B5: Product Count
    const ansCount = tryLocalCalculation('Berapa jenis produk saya ada?', result)
    expect(ansCount).toContain('16 jenis produk')

    // Priority C: Advice and Qualitative questions MUST return null to trigger Gemini fallback
    expect(tryLocalCalculation('How can I increase sales?', result)).toBe(null)
    expect(tryLocalCalculation('Why are my sales low?', result)).toBe(null)
    expect(tryLocalCalculation('Bagaimana nak tingkatkan jualan bulan depan?', result)).toBe(null)
    expect(tryLocalCalculation('Cadangan untuk produk laris', result)).toBe(null)

    // Empty dataset handling
    const emptyResult = calculateSales([])
    const ansEmpty = tryLocalCalculation('Berapa total sales saya?', emptyResult)
    expect(ansEmpty).toContain('Tiada rekod data jualan')
  })
})
