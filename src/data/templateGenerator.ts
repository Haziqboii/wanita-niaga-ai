import * as XLSX from 'xlsx'

/**
 * Standard column headers for the Mekara microbusiness sales template.
 * Perfectly mapped to Mekara's ingestion aliases.
 */
export const TEMPLATE_COLUMNS = [
  'Nama Produk',
  'Kuantiti',
  'Harga Seunit',
  'Kos Seunit',
  'Tarikh',
  'Saluran',
  'Kategori',
  'Kaedah Bayaran',
] as const

export type TemplateColumn = (typeof TEMPLATE_COLUMNS)[number]

/**
 * Reference sample rows kept for testing and verification purposes.
 */
export const SAMPLE_TEMPLATE_DATA = [
  {
    'Nama Produk': 'Karipap Daging',
    'Kuantiti': 50,
    'Harga Seunit': 1.5,
    'Kos Seunit': 0.6,
    'Tarikh': '2026-10-01',
    'Saluran': 'Gerai',
    'Kategori': 'Kuih',
    'Kaedah Bayaran': 'Tunai',
  },
]

/**
 * Creates an in-memory XLSX WorkBook containing a real empty draft sales table with column headers only.
 * Exactly 0 sample data records — only the 8 column headers are present so microentrepreneurs can fill in their own sales records directly.
 */
export function generateTemplateWorkbook(): XLSX.WorkBook {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [...TEMPLATE_COLUMNS],
  ])

  // Set readable column widths for mobile & desktop spreadsheet viewers
  worksheet['!cols'] = [
    { wch: 28 }, // Nama Produk
    { wch: 12 }, // Kuantiti
    { wch: 16 }, // Harga Seunit
    { wch: 16 }, // Kos Seunit
    { wch: 14 }, // Tarikh
    { wch: 14 }, // Saluran
    { wch: 14 }, // Kategori
    { wch: 16 }, // Kaedah Bayaran
  ]

  // Enable Excel autofilter on header row
  worksheet['!autofilter'] = { ref: 'A1:H1' }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekod Jualan')
  return workbook
}

/**
 * Generates and triggers download of the real empty Mekara Excel template (.xlsx)
 * with column headers only so aunty just needs to fill it in.
 */
export function generateAndDownloadExcelTemplate(): boolean {
  try {
    const workbook = generateTemplateWorkbook()
    XLSX.writeFile(workbook, 'Templat_Jualan_Mekara_Kosong.xlsx')
    return true
  } catch (err) {
    console.error('[Template Generator Error]', err)
    return false
  }
}
