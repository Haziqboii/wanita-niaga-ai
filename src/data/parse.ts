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
  'keterangan',
  'perkara',
  'description',
  'item description',
  'butiran',
  'nama',
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
  'vol',
  'volume',
  'bil',
  'units sold',
  'qty sold',
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
  'kadar',
  'rate',
  'retail price',
  'harga unit',
]

const KOS_ALIASES = [
  'kos',
  'kos seunit',
  'cost',
  'unit cost',
  'modal',
  'modal seunit',
  'kos modal',
  'cogs',
  'harga modal',
]

const TARIKH_ALIASES = [
  'tarikh',
  'tarikh jualan',
  'date',
  'sales date',
  'tanggal',
  'hari',
  'tarikh transaksi',
  'transaction date',
]

const SALURAN_ALIASES = [
  'saluran',
  'saluran jualan',
  'channel',
  'sales channel',
  'platform',
  'source',
  'kaedah jualan',
  'cara jualan',
]

const KATEGORI_ALIASES = [
  'kategori',
  'category',
  'kategori produk',
  'product category',
  'jenis',
  'jenis produk',
  'kumpulan',
  'group',
]

const KAEDAH_BAYARAN_ALIASES = [
  'kaedah bayaran',
  'cara bayaran',
  'payment method',
  'payment',
  'kaedah pembayaran',
  'cara bayar',
  'jenis bayaran',
  'payment type',
  'mode of payment',
  'cara pembayaran',
]

const LOKASI_ALIASES = [
  'lokasi',
  'location',
  'lokasi jualan',
  'sales location',
  'tempat',
  'venue',
  'tapak',
  'cawangan',
  'branch',
]

const ID_TRANSAKSI_ALIASES = [
  'id jualan',
  'id transaksi',
  'transaction id',
  'invoice no',
  'no invois',
  'invoice',
  'invois',
  'receipt no',
  'no resit',
  'receipt',
  'resit',
  'order id',
  'no pesanan',
  'ref no',
  'reference',
  'id',
]

const MASA_ALIASES = [
  'masa',
  'time',
  'waktu',
  'jam',
  'transaction time',
  'sales time',
  'masa jualan',
  'masa transaksi',
]

const NOTA_ALIASES = [
  'nota',
  'notes',
  'catatan',
  'remarks',
  'keterangan tambahan',
  'note',
  'ulasan',
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
    // Optional SME columns
    kategori: findBestHeaderMatch(headers, KATEGORI_ALIASES),
    kaedahBayaran: findBestHeaderMatch(headers, KAEDAH_BAYARAN_ALIASES),
    lokasi: findBestHeaderMatch(headers, LOKASI_ALIASES),
    idTransaksi: findBestHeaderMatch(headers, ID_TRANSAKSI_ALIASES),
    masa: findBestHeaderMatch(headers, MASA_ALIASES),
    nota: findBestHeaderMatch(headers, NOTA_ALIASES),
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
    const kategoriStr = getCellValue(row, mapping.kategori ?? null)
    const kaedahBayaranStr = getCellValue(row, mapping.kaedahBayaran ?? null)
    const lokasiStr = getCellValue(row, mapping.lokasi ?? null)
    const idTransaksiStr = getCellValue(row, mapping.idTransaksi ?? null)
    const masaStr = getCellValue(row, mapping.masa ?? null)
    const notaStr = getCellValue(row, mapping.nota ?? null)

    // Skip purely empty rows
    if (!produk && !kuantitiStr && !hargaStr && !kosStr) {
      skippedRows++
      continue
    }

    // Skip summary / total rows common at the end of Excel accounting worksheets
    const lowerProduk = (produk || '').toLowerCase().trim()
    if (
      lowerProduk === 'jumlah' ||
      lowerProduk === 'total' ||
      lowerProduk === 'jumlah keseluruhan' ||
      lowerProduk === 'grand total' ||
      lowerProduk === 'subtotal' ||
      lowerProduk === 'sub-total' ||
      lowerProduk === 'ringkasan'
    ) {
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
      kategori: kategoriStr || null,
      kaedahBayaran: kaedahBayaranStr || null,
      lokasi: lokasiStr || null,
      idTransaksi: idTransaksiStr || null,
      masa: masaStr || null,
      nota: notaStr || null,
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

export function findHeaderRowIndex(rows: any[][]): number {
  const allAliases = [
    ...PRODUK_ALIASES,
    ...KUANTITI_ALIASES,
    ...HARGA_ALIASES,
    ...KOS_ALIASES,
    ...TARIKH_ALIASES,
    ...SALURAN_ALIASES,
  ]

  let bestIdx = 0
  let maxScore = -1

  const scanLimit = Math.min(rows.length, 12)
  for (let i = 0; i < scanLimit; i++) {
    const row = rows[i]
    if (!row || !Array.isArray(row)) continue

    const cells = row
      .map((c: unknown) => (c !== undefined && c !== null ? String(c).trim() : ''))
      .filter((c: string) => c !== '')

    if (cells.length < 2) continue

    let matchCount = 0
    for (const cell of cells) {
      const lower = cell.toLowerCase()
      if (allAliases.some((alias) => lower.includes(alias) || alias.includes(lower))) {
        matchCount++
      }
    }

    const score = cells.length + matchCount * 8
    if (score > maxScore) {
      maxScore = score
      bestIdx = i
    }
  }

  return bestIdx
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

        // Smart Header Row Detection (scans first 12 rows for best header row)
        const headerRowIdx = findHeaderRowIndex(rows)
        const rawHeaderRow = rows[headerRowIdx] || []
        const headers: string[] = rawHeaderRow
          .map((h: unknown) => (h !== undefined && h !== null ? String(h).trim() : ''))
          .filter((h: string) => h !== '')

        if (headers.length === 0) {
          resolve({
            records: [],
            rawRows: [],
            headers: [],
            mapping: emptyMapping(),
            errors: ['Tajuk kolum (header) tidak dijumpai dalam helaian fail.'],
          })
          return
        }

        // Convert data rows to object records (starts right after the detected header row)
        const rawRows: Record<string, unknown>[] = []
        for (let i = headerRowIdx + 1; i < rows.length; i++) {
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
