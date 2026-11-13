import { describe, it, expect } from 'vitest'
import { calculateSales, toCents, fromCents } from '../calc/sales'
import { validateSale, validateRecords, normalizeDate, formatRM, formatDateMY } from '../data/validate'
import { autoDetectMapping, applyMapping, findHeaderRowIndex } from '../data/parse'
import { SAMPLE_SALES } from '../data/sample'
import { getAssistantResponse } from '../services/aiAssistant'
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
})
