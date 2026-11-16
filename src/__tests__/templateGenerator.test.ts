import { describe, it, expect } from 'vitest'
import {
  generateTemplateWorkbook,
  TEMPLATE_COLUMNS,
} from '../data/templateGenerator'
import * as XLSX from 'xlsx'

describe('Template Generator Suite', () => {
  it('1. Contains accurate microbusiness standard column titles', () => {
    expect(TEMPLATE_COLUMNS).toContain('Nama Produk')
    expect(TEMPLATE_COLUMNS).toContain('Kuantiti')
    expect(TEMPLATE_COLUMNS).toContain('Harga Seunit')
    expect(TEMPLATE_COLUMNS).toContain('Kos Seunit')
    expect(TEMPLATE_COLUMNS).toContain('Tarikh')
    expect(TEMPLATE_COLUMNS).toContain('Saluran')
    expect(TEMPLATE_COLUMNS).toContain('Kategori')
    expect(TEMPLATE_COLUMNS).toContain('Kaedah Bayaran')
  })

  it('2. generateTemplateWorkbook creates clean draft table with header row only for manual data entry', () => {
    const workbook = generateTemplateWorkbook()
    expect(workbook.SheetNames).toContain('Rekod Jualan')

    const sheet = workbook.Sheets['Rekod Jualan']
    expect(sheet).toBeDefined()

    // Parse back to array of arrays to confirm only headers exist
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })
    expect(rows.length).toBe(1) // Header row only
    expect(rows[0]).toEqual([...TEMPLATE_COLUMNS])

    // Strictly 0 data records (real empty Excel file ready for aunty to fill in)
    const records = XLSX.utils.sheet_to_json(sheet)
    expect(records.length).toBe(0)

    // Verify readable column widths are set
    expect(sheet['!cols']).toBeDefined()
    expect(sheet['!cols']?.length).toBe(8)

    // Verify autofilter enabled
    expect(sheet['!autofilter']).toEqual({ ref: 'A1:H1' })
  })
})
