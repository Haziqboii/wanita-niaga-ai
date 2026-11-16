import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import * as XLSX from 'xlsx'
import { autoDetectMapping, applyMapping, findHeaderRowIndex } from '../data/parse'
import { validateRecords } from '../data/validate'
import { calculateSales } from '../calc/sales'
import { extractAvailableMonths, calculateMonthlyComparison } from '../calc/monthly'
import {
  generateDeterministicInsights,
  evaluateInsightQuality,
  type BusinessReasoningContext,
} from '../calc/insights'
import { handleGenerateInsights } from '../../server/insightsHandler'
import type { ValidatedSale } from '../types'

describe('WANITA NIAGA AI — TASK 8B.3: Smart Business Adviser Test Suite', () => {
  // Load the 600-record September & October 2026 test workbook (16 unique products)
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
  const monthlyComparison = calculateMonthlyComparison(valid, '2026-10', availableMonths)

  describe('1. Business-Aware Reasoning Scenarios', () => {
    it('Scenario 1: Business with 16 products and 3 strong sellers does NOT suggest adding more products', () => {
      expect(allResult.products.length).toBe(16)

      const insights = generateDeterministicInsights({
        currentResult: allResult,
        allResult,
        allRecords: valid,
        selectedPeriod: 'ALL',
        availableMonths,
        monthlyComparison,
      })

      const concentrationItem = insights.find((i) => i.category === 'concentration')
      expect(concentrationItem).toBeDefined()
      expect(concentrationItem?.title).toBe('Produk Laris, Utamakan Dahulu')
      expect(concentrationItem?.text).toContain('16 produk sedia ada')
      expect(concentrationItem?.text).toContain('semak produk kurang laris sebelum menambah stok')

      // Strictly must NOT recommend adding more products or increasing capital
      expect(concentrationItem?.text.toLowerCase()).not.toContain('perkenalkan produk sampingan')
      expect(concentrationItem?.text.toLowerCase()).not.toContain('tambah produk')
      expect(concentrationItem?.text.toLowerCase()).not.toContain('tambah menu')
      expect(concentrationItem?.text.toLowerCase()).not.toContain('tumpukan modal')
    })

    it('Scenario 2: Business with only 2 products does NOT flag concentration as dangerous or advise blind diversification', () => {
      const twoProductRecords: ValidatedSale[] = [
        { produk: 'Nasi Lemak', kuantiti: 100, harga: 3.5, kos: 1.5, tarikh: '2026-10-01', saluran: 'Gerai' },
        { produk: 'Teh Tarik', kuantiti: 80, harga: 2.0, kos: 0.8, tarikh: '2026-10-01', saluran: 'Gerai' },
      ]
      const twoProductResult = calculateSales(twoProductRecords)

      const insights = generateDeterministicInsights({
        currentResult: twoProductResult,
        allResult: twoProductResult,
        allRecords: twoProductRecords,
        selectedPeriod: 'ALL',
      })

      // Concentration warning is not generated for microbusinesses with only 2 products
      const concentrationItem = insights.find((i) => i.category === 'concentration')
      expect(concentrationItem).toBeUndefined()
    })

    it('Scenario 3: Identifies high-margin but low-selling product and uses accurate gross profit per unit terminology', () => {
      const insights = generateDeterministicInsights({
        currentResult: allResult,
        allResult,
        allRecords: valid,
        selectedPeriod: 'ALL',
        availableMonths,
        monthlyComparison,
      })

      const marginInsight = insights.find((i) => i.category === 'margin')
      expect(marginInsight).toBeDefined()
      expect(marginInsight?.title).toBe('Untung Kasar Seunit Terbaik')
      expect(marginInsight?.text).toContain('untung kasar seunit paling tinggi')
      expect(marginInsight?.text).not.toContain('untung bersih seunit')
      expect(marginInsight?.text).toContain('uji sambutan')
    })

    it('Scenario 4: High-volume but low-margin product recognises that volume does not always equal best profit', () => {
      // Craft a scenario where the volume leader has thin margin (< 30%)
      const recordsWithThinMarginLeader: ValidatedSale[] = [
        { produk: 'Air Sirap', kuantiti: 1000, harga: 1.0, kos: 0.85, tarikh: '2026-10-01', saluran: 'Gerai' }, // 15% margin
        { produk: 'Kek Lapis', kuantiti: 50, harga: 20.0, kos: 8.0, tarikh: '2026-10-01', saluran: 'Gerai' }, // 60% margin
      ]
      const result = calculateSales(recordsWithThinMarginLeader)

      const insights = generateDeterministicInsights({
        currentResult: result,
        allResult: result,
        allRecords: recordsWithThinMarginLeader,
        selectedPeriod: 'ALL',
      })

      const marginInsight = insights.find((i) => i.category === 'margin')
      expect(marginInsight).toBeDefined()
      expect(marginInsight?.title).toBe('Laris Dijual, Tapi Untung Seunit Kecil')
      expect(marginInsight?.text).toContain('Air Sirap paling banyak terjual')
      expect(marginInsight?.text).toContain('untung kasar seunit yang kecil')
    })

    it('Scenario 5: Two months of changing rankings detects shift without claiming permanent trend', () => {
      const insights = generateDeterministicInsights({
        currentResult: allResult,
        allResult,
        allRecords: valid,
        selectedPeriod: 'ALL',
        availableMonths,
        monthlyComparison,
      })

      const monthShift = insights.find((i) => i.category === 'month_change')
      expect(monthShift).toBeDefined()
      expect(monthShift?.title).toBe('Produk Jualan Tertinggi Bertukar Ikut Bulan')
      expect(monthShift?.text).toContain('pantau sambutan bulan hadapan')
      // Must not claim permanent demand shift
      expect(monthShift?.text.toLowerCase()).not.toContain('trend kekal')
      expect(monthShift?.text.toLowerCase()).not.toContain('pasti')
    })

    it('Scenario 6: Product concentration without warning signs is presented constructively, not dangerously', () => {
      const insights = generateDeterministicInsights({
        currentResult: allResult,
        allResult,
        allRecords: valid,
        selectedPeriod: 'ALL',
        availableMonths,
        monthlyComparison,
      })

      const concentrationItem = insights.find((i) => i.category === 'concentration')
      expect(concentrationItem?.title).not.toContain('Bahaya')
      expect(concentrationItem?.title).not.toContain('Krisis')
      expect(concentrationItem?.title).not.toContain('Risiko')
    })

    it('Scenario 7: Missing costs gracefully avoids unsupported profit claims', () => {
      const noCostRecords: ValidatedSale[] = valid.map((r) => ({
        ...r,
        kos: null,
      }))
      const noCostResult = calculateSales(noCostRecords)

      const insights = generateDeterministicInsights({
        currentResult: noCostResult,
        allResult: noCostResult,
        allRecords: noCostRecords,
        selectedPeriod: 'ALL',
        availableMonths,
      })

      const marginInsight = insights.find((i) => i.category === 'margin')
      expect(marginInsight).toBeUndefined()
    })

    it('Scenario 8: Missing inventory information prevents claims of overstock or shortages', () => {
      const context: BusinessReasoningContext = {
        totalProducts: 16,
        hasCostData: true,
        hasDateData: true,
        hasChannelData: true,
        hasInventoryData: false,
      }

      const invalidInsight = {
        title: 'Lebihan Stok Barang',
        text: 'Terdapat banyak terlebih stok yang berlaku di kedai Puan.',
      }

      const check = evaluateInsightQuality(invalidInsight, context)
      expect(check.valid).toBe(false)
      expect(check.reason).toContain('inventory')
    })

    it('Scenario 9: Unavailable basket data prevents claims of co-purchasing habits', () => {
      const context: BusinessReasoningContext = {
        totalProducts: 16,
        hasCostData: true,
        hasDateData: true,
        hasChannelData: true,
        hasBasketData: false,
      }

      const invalidInsight = {
        title: 'Pelanggan Beli Bersama',
        text: 'Nasi Lemak dan Teh Ais kerap dibeli bersama oleh pelanggan setiap pagi.',
      }

      const check = evaluateInsightQuality(invalidInsight, context)
      expect(check.valid).toBe(false)
      expect(check.reason).toContain('co-purchasing')
    })

    it('Scenario 10: Rejects repeated or generic KPI findings', () => {
      const context: BusinessReasoningContext = {
        totalProducts: 5,
        hasCostData: true,
        hasDateData: true,
        hasChannelData: true,
      }

      const kpiRepeatInsight = {
        title: 'Jumlah Jualan Keseluruhan',
        text: 'Jumlah hasil jualan anda adalah RM45,000 sepanjang dua bulan.',
      }

      const check = evaluateInsightQuality(kpiRepeatInsight, context)
      expect(check.valid).toBe(false)
      expect(check.reason).toContain('KPI')
    })

    it('Scenario 11: Insufficient data returns fewer insights without filler padding', () => {
      // Single product, no date, no cost, no channel
      const bareRecords: ValidatedSale[] = [
        { produk: 'Kek Batik', kuantiti: 10, harga: 15, kos: null, tarikh: null, saluran: null },
      ]
      const bareResult = calculateSales(bareRecords)

      const insights = generateDeterministicInsights({
        currentResult: bareResult,
        allResult: bareResult,
        allRecords: bareRecords,
        selectedPeriod: 'ALL',
      })

      // Should return fewer than 3 insights without crashing
      expect(insights.length).toBeLessThanOrEqual(2)
    })
  })

  describe('2. Recommendation Quality Gate & Server-side Fallback', () => {
    it('Scenario 12: Quality gate rejects ungrounded Gemini recommendations and falls back to verified deterministic insights', async () => {
      const badAIEvaluation = evaluateInsightQuality(
        {
          title: 'Perkenalkan Menu Baharu',
          text: 'Puan dinasihatkan tambah produk baharu untuk tingkatkan hasil jualan kedai.',
        },
        {
          totalProducts: 16,
          hasCostData: true,
          hasDateData: true,
          hasChannelData: true,
        }
      )

      expect(badAIEvaluation.valid).toBe(false)
      expect(badAIEvaluation.reason).toContain('5+ products')
    })

    it('falls back to deterministic candidates with isAI: false when no API key provided', async () => {
      const sampleCandidates = [
        {
          id: 'shift_top_product',
          category: 'month_change',
          title: 'Juara Jualan Berubah Mengikut Bulan',
          text: 'Hasil jualan bertukar daripada **Brownies pada September** kepada **Kek Batik pada Oktober**.',
          evidence: {
            products: ['Brownies', 'Kek Batik'],
            metrics: { totalProducts: 16 },
          },
        },
        {
          id: 'margin_star',
          category: 'margin',
          title: 'Untung Seunit Paling Berbaloi',
          text: 'Kek Batik beri **untung paling lumayan bagi setiap unit**, walaupun bukan paling laris.',
          evidence: {
            products: ['Kek Batik'],
          },
        },
      ]

      const result = await handleGenerateInsights(sampleCandidates, '127.0.0.1', null)
      expect(result.insights.length).toBe(2)
      expect(result.insights[0].title).toBe('Juara Jualan Berubah Mengikut Bulan')
      expect(result.insights[0].icon).toBe('trending-up')
    })

    it('strictly sanitizes and enforces respectful "Puan" across all output', async () => {
      const candidatesWithAkak = [
        {
          id: 'test_akak',
          category: 'month_change',
          title: 'Akak Boleh Buat Ini',
          text: 'Akak disarankan untuk semak jualan, akak boleh cuba produk ini.',
          evidence: {},
        },
      ]

      const result = await handleGenerateInsights(candidatesWithAkak, '127.0.0.1', null)
      expect(result.insights[0].title).toBe('Puan Boleh Buat Ini')
      expect(result.insights[0].text).toBe('Puan disarankan untuk semak jualan, Puan boleh cuba produk ini.')
      expect(result.insights[0].text).not.toContain('akak')
      expect(result.insights[0].text).not.toContain('Akak')
    })

    it('Scenario 13: Strictly rejects incorrect "untung bersih seunit" terminology in quality gate', () => {
      const wrongTerminologyInsight = {
        title: 'Untung Bersih Seunit Lumayan',
        text: 'Kek Batik memberi untung bersih seunit paling lumayan.',
      }
      const check = evaluateInsightQuality(wrongTerminologyInsight, {
        totalProducts: 5,
        hasCostData: true,
        hasDateData: true,
        hasChannelData: true,
      })
      expect(check.valid).toBe(false)
      expect(check.reason).toContain('untung kasar seunit')
    })

    it('Scenario 14: Strictly rejects risky advice advising to increase capital or spending', () => {
      const riskyCapitalInsight = {
        title: 'Tumpukan Modal Pada Produk Laris',
        text: 'Puan boleh tumpukan modal dan tambah belanja untuk produk terlaris.',
      }
      const check = evaluateInsightQuality(riskyCapitalInsight, {
        totalProducts: 16,
        hasCostData: true,
        hasDateData: true,
        hasChannelData: true,
      })
      expect(check.valid).toBe(false)
      expect(check.reason).toContain('Risky advice')
    })
  })
})
