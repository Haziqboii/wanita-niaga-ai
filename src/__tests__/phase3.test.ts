import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateSales } from '../calc/sales'
import { SAMPLE_SALES } from '../data/sample'
import { exportDashboardToPDF } from '../services/pdfExport'

describe('Phase 3: PDF Export, User Guide, and Mobile Usability Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // 1. PDF Export generation with null operating expenses (Untung Kasar)
  it('1. exportDashboardToPDF succeeds and properly handles missing operating expenses (null)', async () => {
    const result = calculateSales(SAMPLE_SALES, null)
    expect(result.operatingExpenses).toBe(null)
    expect(result.grossProfit).toBe(986.5)
    expect(result.estimatedNetProfit).toBe(null)

    // Call exportDashboardToPDF in virtual DOM environment
    const success = await exportDashboardToPDF({
      result,
      operatingExpenses: null,
    })

    expect(success).toBe(true)
  })

  // 2. PDF Export generation with explicit zero operating expenses (Untung Bersih)
  it('2. exportDashboardToPDF succeeds and properly handles explicit zero operating expenses (0)', async () => {
    const result = calculateSales(SAMPLE_SALES, 0)
    expect(result.operatingExpenses).toBe(0)
    expect(result.grossProfit).toBe(986.5)
    expect(result.estimatedNetProfit).toBe(986.5)

    const success = await exportDashboardToPDF({
      result,
      operatingExpenses: 0,
    })

    expect(success).toBe(true)
  })

  // 3. PDF Export generation with positive operating expenses (RM250)
  it('3. exportDashboardToPDF succeeds and deducts positive operating expenses', async () => {
    const result = calculateSales(SAMPLE_SALES, 250)
    expect(result.operatingExpenses).toBe(250)
    expect(result.grossProfit).toBe(986.5)
    expect(result.estimatedNetProfit).toBe(736.5)

    const success = await exportDashboardToPDF({
      result,
      operatingExpenses: 250,
    })

    expect(success).toBe(true)
  })

  // 4. Regression test: Zero vs null operating expenses are strictly distinguished
  it('4. Operating expenses 0 and null have distinct verified meanings in dashboard calculations', () => {
    // When null (missing/not provided)
    const calcMissing = calculateSales(SAMPLE_SALES, null)
    expect(calcMissing.operatingExpenses).toBe(null)
    expect(calcMissing.estimatedNetProfit).toBe(null)

    // When 0 (explicitly zero expenses, e.g. home-based business)
    const calcZero = calculateSales(SAMPLE_SALES, 0)
    expect(calcZero.operatingExpenses).toBe(0)
    expect(calcZero.estimatedNetProfit).toBe(calcZero.grossProfit)

    // Never equal in meaning
    expect(calcMissing.operatingExpenses).not.toBe(calcZero.operatingExpenses)
    expect(calcMissing.estimatedNetProfit).not.toBe(calcZero.estimatedNetProfit)
  })
})
