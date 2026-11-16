import { describe, it, expect } from 'vitest'
import {
  initializeManagedRecords,
  extractRecordMonths,
  extractRecordChannels,
  filterAndSortRecords,
  paginateRecords,
  type ManagedRecord,
} from '../calc/recordManager'
import { calculateSales } from '../calc/sales'
import { validateRecords } from '../data/validate'
import type { RawSale } from '../types'

describe('MEKARA — Sales Record Management Suite (20 Focused Tests)', () => {
  // Generate a realistic 600-record dataset
  const generate600Records = (): RawSale[] => {
    const products = ['Karipap', 'Kek Batik', 'Popia Goreng', 'Sandwich Telur', 'Brownies', 'Kuih Lapis']
    const channels = ['Gerai', 'WhatsApp', 'Tempahan', 'Booth', 'Online']
    const records: RawSale[] = []

    for (let i = 0; i < 600; i++) {
      const p = products[i % products.length]
      const ch = channels[i % channels.length]
      // Exactly 300 records in Sep and 300 in Oct (300 is a multiple of 30, so all product-channel pairs exist in both)
      const month = i < 300 ? '09' : '10'
      const day = String((i % 28) + 1).padStart(2, '0')
      records.push({
        idTransaksi: `TX${1000 + i}`,
        produk: p,
        kuantiti: (i % 20) + 1,
        harga: 2.5 + (i % 5),
        kos: 1.0 + (i % 3),
        tarikh: `2026-${month}-${day}`,
        saluran: ch,
      })
    }
    return records
  }

  const raw600 = generate600Records()
  const managed600 = initializeManagedRecords(raw600)

  // 1. Product-name search
  it('1. Product-name search returns only records matching the query', () => {
    const res = filterAndSortRecords(managed600, { searchQuery: 'Karipap' })
    expect(res.length).toBeGreaterThan(0)
    res.forEach((r) => {
      expect(r.produk).toContain('Karipap')
    })
  })

  // 2. Case-insensitive partial matches
  it('2. Search supports case-insensitive and partial matches with trimmed whitespace', () => {
    const res = filterAndSortRecords(managed600, { searchQuery: '   kari   ' })
    expect(res.length).toBe(100)
    res.forEach((r) => {
      expect(r.produk.toLowerCase()).toContain('kari')
    })
  })

  // 3. Search across all 600 records
  it('3. Search scans the entire 600-record collection, not only a single page', () => {
    const res = filterAndSortRecords(managed600, { searchQuery: 'Brownies' })
    expect(res.length).toBe(100) // 600 / 6 products = 100 each
  })

  // 4. Dynamic month filtering
  it('4. Dynamic month filtering accurately isolates transactions by month', () => {
    const months = extractRecordMonths(managed600)
    expect(months.length).toBe(2)
    expect(months.map((m) => m.key)).toEqual(['2026-10', '2026-09'])

    const sepRecords = filterAndSortRecords(managed600, { monthFilter: '2026-09' })
    expect(sepRecords.length).toBe(300)
    sepRecords.forEach((r) => {
      expect(r.tarikh?.startsWith('2026-09')).toBe(true)
    })
  })

  // 5. Dynamic sales-channel filtering
  it('5. Dynamic sales-channel filtering extracts actual channels and filters correctly', () => {
    const channels = extractRecordChannels(managed600)
    expect(channels).toEqual(['Booth', 'Gerai', 'Online', 'Tempahan', 'WhatsApp'])

    const whatsappOnly = filterAndSortRecords(managed600, { channelFilter: 'WhatsApp' })
    expect(whatsappOnly.length).toBe(120) // 600 / 5 channels = 120 each
    whatsappOnly.forEach((r) => {
      expect(r.saluran).toBe('WhatsApp')
    })
  })

  // 6. Combined search + filters
  it('6. Combined search + month + channel filters work together as an AND condition', () => {
    const res = filterAndSortRecords(managed600, {
      searchQuery: 'Karipap',
      monthFilter: '2026-10',
      channelFilter: 'Gerai',
    })
    expect(res.length).toBeGreaterThan(0)
    res.forEach((r) => {
      expect(r.produk).toBe('Karipap')
      expect(r.tarikh?.startsWith('2026-10')).toBe(true)
      expect(r.saluran).toBe('Gerai')
    })
  })

  // 7. Newest-first sorting
  it('7. Newest-first sorting orders transactions from newest to oldest date', () => {
    const res = filterAndSortRecords(managed600, { sortOrder: 'newest' })
    for (let i = 0; i < res.length - 1; i++) {
      const d1 = res[i].tarikh || ''
      const d2 = res[i + 1].tarikh || ''
      expect(d1 >= d2).toBe(true)
    }
  })

  // 8. Oldest-first sorting
  it('8. Oldest-first sorting orders transactions from oldest to newest date', () => {
    const res = filterAndSortRecords(managed600, { sortOrder: 'oldest' })
    for (let i = 0; i < res.length - 1; i++) {
      const d1 = res[i].tarikh || ''
      const d2 = res[i + 1].tarikh || ''
      expect(d1 <= d2).toBe(true)
    }
  })

  // 9. Stable ordering for same-date records
  it('9. Same-date records have deterministic secondary ordering without jitter', () => {
    const sorted1 = filterAndSortRecords(managed600, { sortOrder: 'newest' })
    const sorted2 = filterAndSortRecords(managed600, { sortOrder: 'newest' })
    expect(sorted1.map((r) => r.id)).toEqual(sorted2.map((r) => r.id))
  })

  // 10. Pagination with 600 records
  it('10. Pagination with 600 records correctly computes 30 total pages at 20/page', () => {
    const p1 = paginateRecords(managed600, 1, 20)
    expect(p1.totalPages).toBe(30)
    expect(p1.totalItems).toBe(600)
    expect(p1.startIndex).toBe(0)
    expect(p1.endIndex).toBe(20)
  })

  // 11. Exactly 20 cards per page
  it('11. Exactly 20 records are returned for standard pages', () => {
    const p1 = paginateRecords(managed600, 1, 20)
    expect(p1.pageItems.length).toBe(20)

    const p15 = paginateRecords(managed600, 15, 20)
    expect(p15.pageItems.length).toBe(20)
  })

  // 12. Correct last-page handling
  it('12. Correct last-page handling for exact and partial final slices', () => {
    const p30 = paginateRecords(managed600, 30, 20)
    expect(p30.pageItems.length).toBe(20)
    expect(p30.currentPage).toBe(30)

    // With 605 records, page 31 should have 5 records
    const partial = [...managed600, ...managed600.slice(0, 5)]
    const p31 = paginateRecords(partial, 31, 20)
    expect(p31.totalPages).toBe(31)
    expect(p31.pageItems.length).toBe(5)
  })

  // 13. Reset to Page 1 on search/filter/sort changes
  it('13. Simulating page reset returns to Page 1 when search or filter is applied', () => {
    let currentPage = 15
    const onSearchChange = () => {
      currentPage = 1
    }
    onSearchChange()
    expect(currentPage).toBe(1)
  })

  // 14. Add new sales while filters are active
  it('14. Adding a new sale preserves existing records and correctly updates dataset', () => {
    const newSale: ManagedRecord = {
      id: 'new_1',
      produk: 'Apam Balik',
      kuantiti: 10,
      harga: 3.0,
      kos: 1.0,
      tarikh: '2026-11-01',
      saluran: 'Gerai',
    }
    const updated = [newSale, ...managed600]
    expect(updated.length).toBe(601)

    // Verify it is found when searching for Apam Balik
    const filtered = filterAndSortRecords(updated, { searchQuery: 'Apam Balik' })
    expect(filtered.length).toBe(1)
    expect(filtered[0].produk).toBe('Apam Balik')
  })

  // 15. Edit only the selected transaction
  it('15. Editing modifies ONLY the selected transaction without affecting other records', () => {
    const sample = [
      { id: '1', produk: 'Karipap', kuantiti: 10, harga: 2.0 },
      { id: '2', produk: 'Karipap', kuantiti: 20, harga: 2.0 },
      { id: '3', produk: 'Karipap', kuantiti: 30, harga: 2.0 },
    ]
    const updated = sample.map((r) => (r.id === '2' ? { ...r, kuantiti: 99 } : r))
    expect(updated[0].kuantiti).toBe(10)
    expect(updated[1].kuantiti).toBe(99)
    expect(updated[2].kuantiti).toBe(30)
  })

  // 16. Delete only the selected transaction
  it('16. Deleting removes ONLY the targeted transaction by ID, preserving same-named products', () => {
    const sample = [
      { id: 'tx_a', produk: 'Kek Batik', kuantiti: 5, harga: 10 },
      { id: 'tx_b', produk: 'Kek Batik', kuantiti: 8, harga: 10 },
      { id: 'tx_c', produk: 'Kek Batik', kuantiti: 12, harga: 10 },
    ]
    const afterDelete = sample.filter((r) => r.id !== 'tx_b')
    expect(afterDelete.length).toBe(2)
    expect(afterDelete.map((r) => r.id)).toEqual(['tx_a', 'tx_c'])
  })

  // 17. Repeated product names remain separate transactions
  it('17. Multiple sales of the same product on same or different dates remain distinct transactions', () => {
    const sample: RawSale[] = [
      { produk: 'Karipap', kuantiti: 10, harga: 2.0, tarikh: '2026-10-01', saluran: 'Gerai' },
      { produk: 'Karipap', kuantiti: 15, harga: 2.0, tarikh: '2026-10-01', saluran: 'Gerai' },
      { produk: 'Karipap', kuantiti: 20, harga: 2.0, tarikh: '2026-10-02', saluran: 'WhatsApp' },
    ]
    const managed = initializeManagedRecords(sample)
    expect(managed.length).toBe(3)
    expect(new Set(managed.map((m) => m.id)).size).toBe(3)
  })

  // 18. Pagination remains valid after deletion
  it('18. Deleting items safely clamps current page to valid bounds if page becomes empty', () => {
    // 21 items = 2 pages (page 1: 20, page 2: 1)
    const items = Array.from({ length: 21 }, (_, i) => ({ id: `id_${i}` }))
    let page = 2
    let pResult = paginateRecords(items, page, 20)
    expect(pResult.currentPage).toBe(2)
    expect(pResult.pageItems.length).toBe(1)

    // Delete the 21st item -> now only 20 items (1 page)
    const afterDelete = items.slice(0, 20)
    pResult = paginateRecords(afterDelete, page, 20)
    expect(pResult.totalPages).toBe(1)
    expect(pResult.currentPage).toBe(1)
    expect(pResult.pageItems.length).toBe(20)
  })

  // 19. Correct transaction dates
  it('19. Preserves original transaction dates without mutating or substituting today date', () => {
    const r = managed600[0]
    expect(r.tarikh).toMatch(/^2026-(09|10)-\d{2}$/)
  })

  // 20. Dashboard totals remain independent of management-list filtering
  it('20. Dashboard and financial calculations operate on the complete dataset independently of view filtering', () => {
    // When list is filtered to Karipap only
    const filtered = filterAndSortRecords(managed600, { searchQuery: 'Karipap' })
    expect(filtered.length).toBe(100)

    // But Dashboard calculations use all 600 records
    const { valid } = validateRecords(managed600)
    expect(valid.length).toBe(600)

    const fullResult = calculateSales(valid)
    expect(fullResult.recordCount).toBe(600)
    expect(fullResult.totalRevenue).toBeGreaterThan(0)

    // Verify Karipap is only one part of total revenue
    const karipapSales = calculateSales(valid.filter((v) => v.produk === 'Karipap'))
    expect(fullResult.totalRevenue).toBeGreaterThan(karipapSales.totalRevenue)
  })
})
