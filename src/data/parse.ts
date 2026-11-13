import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { RawSale, ColumnMapping, ParseResult } from '../types'

const PRODUK_ALIASES = [
  'produk',
  'barang',
  'nama produk',
  'nama barang',
  'item',
  'item name',
  'menu',
  'perkhidmatan',
  'product',
]

const KUANTITI_ALIASES = [
  'kuantiti',
  'qty',
  'quantity',
  'jumlah unit',
  'bilangan',
  'unit',
  'terjual',
  'unit terjual',
  'jumlah kuantiti',
]

const HARGA_ALIASES = [
  'harga',
  'harga seunit',
  'harga jual',
  'price',
  'unit price',
  'harga jualan',
  'jual',
  'selling price',
]

const KOS_ALIASES = [
  'kos',
  'kos seunit',
  'cost',
  'unit cost',
  'modal',
  'modal seunit',
  'kos modal',
]

const TARIKH_ALIASES = [
  'tarikh',
  'tarikh jualan',
  'date',
  'sales date',
  'tanggal',
  'hari',
]

const SALURAN_ALIASES = [
  'saluran',
  'saluran jualan',
  'channel',
  'sales channel',
  'platform',
  'tempat',
  'lokasi',
]

function findBestHeaderMatch(headers: string[], aliases: string[]): string | null {
  const cleanHeaders = headers.map((h) => (h || '').toString().trim())
  const lowerHeaders = cleanHeaders.map((h) => h.toLowerCase())

  // Exact match
  for (const alias of aliases) {
    const idx = lowerHeaders.indexOf(alias.toLowerCase())
    if (idx !== -1) return cleanHeaders[idx]
  }

  // Substring inclusion
  for (const alias of aliases) {
    const idx = lowerHeaders.findIndex((h) => h.includes(alias.toLowerCase()))
    if (idx !== -1) return cleanHeaders[idx]
  }

  return null
}

export function autoDetectMapping(headers: string[]): ColumnMapping {
  return {
    produk: findBestHeaderMatch(headers, PRODUK_ALIASES),
    kuantiti: findBestHeaderMatch(headers, KUANTITI_ALIASES),
    harga: findBestHeaderMatch(headers, HARGA_ALIASES),
    kos: findBestHeaderMatch(headers, KOS_ALIASES),
    tarikh: findBestHeaderMatch(headers, TARIKH_ALIASES),
    saluran: findBestHeaderMatch(headers, SALURAN_ALIASES),
  }
}

function getCellValue(row: Record<string, unknown>, colName: string | null): string | null {
  if (!colName) return null
  const val = row[colName]
  if (val === undefined || val === null) return null
  const str = String(val).trim()
  return str === '' ? null : str
}

export function applyMapping(
  rawRows: Record<string, unknown>[],
  mapping: ColumnMapping
): { records: RawSale[]; skippedRows: number } {
  const records: RawSale[] = []
  let skippedRows = 0

  for (const row of rawRows) {
    const produk = getCellValue(row, mapping.produk)
    const kuantitiStr = getCellValue(row, mapping.kuantiti)
    const hargaStr = getCellValue(row, mapping.harga)
    const kosStr = getCellValue(row, mapping.kos)
    const tarikhStr = getCellValue(row, mapping.tarikh)
    const saluranStr = getCellValue(row, mapping.saluran)

    // Skip purely empty rows
    if (!produk && !kuantitiStr && !hargaStr && !kosStr) {
      skippedRows++
      continue
    }

    records.push({
      produk: produk || '',
      kuantiti: kuantitiStr ?? '',
      harga: hargaStr ?? '',
      kos: kosStr !== null ? kosStr : null,
      tarikh: tarikhStr || null,
      saluran: saluranStr || null,
    })
  }

  return { records, skippedRows }
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      complete: (results) => {
        const headers: string[] = results.meta.fields || []
        const mapping = autoDetectMapping(headers)
        const rawRows = results.data || []
        const { records } = applyMapping(rawRows, mapping)
        const errors: string[] = []

        if (records.length === 0) {
          errors.push('Tiada rekod data dijumpai dalam fail CSV ini.')
        }

        resolve({
          records,
          rawRows,
          headers,
          mapping,
          errors,
        })
      },
      error: (err: Error) => reject(err),
    })
  })
}

export function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        const workbook = XLSX.read(buffer, {
          type: 'array',
          cellDates: true,
          dateNF: 'yyyy-mm-dd',
        })

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          resolve({
            records: [],
            rawRows: [],
            headers: [],
            mapping: emptyMapping(),
            errors: ['Fail Excel tidak mengandungi helaian kerja (sheet).'],
          })
          return
        }

        const firstSheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[firstSheetName]

        // Parse sheet to array of rows
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false,
        })

        if (!rows || rows.length === 0) {
          resolve({
            records: [],
            rawRows: [],
            headers: [],
            mapping: emptyMapping(),
            errors: ['Helaian Excel ini kosong.'],
          })
          return
        }

        // Header row
        const rawHeaderRow = rows[0] || []
        const headers: string[] = rawHeaderRow
          .map((h: unknown) => (h !== undefined && h !== null ? String(h).trim() : ''))
          .filter((h: string) => h !== '')

        if (headers.length === 0) {
          resolve({
            records: [],
            rawRows: [],
            headers: [],
            mapping: emptyMapping(),
            errors: ['Tajuk kolum (header) tidak dijumpai pada baris pertama fail.'],
          })
          return
        }

        // Convert data rows to object records
        const rawRows: Record<string, unknown>[] = []
        for (let i = 1; i < rows.length; i++) {
          const rowData = rows[i]
          if (!rowData || rowData.length === 0) continue

          const rowObj: Record<string, unknown> = {}
          let hasContent = false

          headers.forEach((h, colIdx) => {
            const val = rowData[colIdx]
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              hasContent = true
              rowObj[h] = val
            } else {
              rowObj[h] = ''
            }
          })

          if (hasContent) {
            rawRows.push(rowObj)
          }
        }

        const mapping = autoDetectMapping(headers)
        const { records } = applyMapping(rawRows, mapping)
        const errors: string[] = []

        if (records.length === 0) {
          errors.push('Tiada rekod data dijumpai dalam fail Excel ini.')
        }

        resolve({
          records,
          rawRows,
          headers,
          mapping,
          errors,
        })
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = () => {
      reject(new Error('Gagal membaca fail Excel daripada peranti anda.'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export function emptyMapping(): ColumnMapping {
  return {
    produk: null,
    kuantiti: null,
    harga: null,
    kos: null,
    tarikh: null,
    saluran: null,
  }
}

export function isValidFile(file: File): string | null {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) return null
  if (name.endsWith('.xlsx')) return null
  if (name.endsWith('.xls')) return null
  return 'Hanya fail CSV (.csv) atau Excel (.xlsx, .xls) yang dibenarkan.'
}
