import type {
  RawSale,
  ValidatedSale,
  SalesChannel,
  ValidationIssue,
  ValidationSummary,
} from '../types'

/**
 * Normalizes different date representations to ISO 'YYYY-MM-DD'.
 * Accepts YYYY-MM-DD, DD/MM/YYYY, D/M/YYYY, DD-MM-YYYY, and Excel serial numbers.
 */
export function normalizeDate(dateVal: unknown): string | null {
  if (dateVal === null || dateVal === undefined || dateVal === '') {
    return null
  }

  // If it's a numeric Excel serial date (e.g. 45300)
  if (typeof dateVal === 'number' && !isNaN(dateVal) && dateVal > 20000 && dateVal < 80000) {
    // Excel epoch begins Dec 30 1899 due to 1900 leap year bug
    const jsDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000))
    if (!isNaN(jsDate.getTime())) {
      const y = jsDate.getUTCFullYear()
      const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0')
      const d = String(jsDate.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  }

  const str = String(dateVal).trim()
  if (!str) return null

  // ISO Format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (isoMatch) {
    const y = isoMatch[1]
    const m = isoMatch[2].padStart(2, '0')
    const d = isoMatch[3].padStart(2, '0')
    const monthNum = parseInt(m, 10)
    const dayNum = parseInt(d, 10)
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${y}-${m}-${d}`
    }
  }

  // Malaysian / Commonwealth Format: DD/MM/YYYY or DD-MM-YYYY
  const myMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (myMatch) {
    const d = myMatch[1].padStart(2, '0')
    const m = myMatch[2].padStart(2, '0')
    const y = myMatch[3]
    const monthNum = parseInt(m, 10)
    const dayNum = parseInt(d, 10)
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${y}-${m}-${d}`
    }
  }

  return null
}

const CANONICAL_CHANNELS: Record<string, string> = {
  gerai: 'Gerai',
  booth: 'Booth',
  whatsapp: 'WhatsApp',
  online: 'Online',
  tempahan: 'Tempahan',
  'tiktok shop': 'TikTok Shop',
  tiktok: 'TikTok Shop',
  bazar: 'Bazar',
  kiosk: 'Kiosk',
  shopee: 'Shopee',
  lazada: 'Lazada',
  facebook: 'Facebook',
  instagram: 'Instagram',
  'lain-lain': 'Lain-lain',
  lain: 'Lain-lain',
  others: 'Lain-lain',
}

export function normalizeChannel(channelVal: unknown): SalesChannel | null {
  if (channelVal === null || channelVal === undefined || channelVal === '') {
    return null
  }
  const clean = String(channelVal).trim()
  if (!clean) return null
  if (clean.length > 50) return null

  const lower = clean.toLowerCase()
  if (CANONICAL_CHANNELS[lower]) {
    return CANONICAL_CHANNELS[lower]
  }

  // Preserve user-defined channel name as-is (non-empty, trimmed, <= 50 chars)
  return clean
}

/**
 * Flexible currency parser:
 * Detects numbers with or without RM, MYR, $, commas, non-breaking spaces,
 * and unit suffixes (e.g. "RM 15.00", "RM15", "15.00", "15 / unit", "80 sen").
 * Preserves explicit zero (0, "0", "RM 0.00") while treating "-", "--", "N/A" as missing (null).
 */
export function parseCurrency(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null
  }

  let str = String(val).trim()
  if (!str) return null

  // Explicit missing / not applicable markers are unknown, NOT zero
  if (str === '-' || str === '--' || /^(?:n\/?a|tiada)$/i.test(str)) {
    return null
  }

  // Excel accounting zero representation: "RM -" or "RM - " or "$ -"
  if (/^([rR][mM]|myr|\$)\s*-\s*$/i.test(str)) {
    return 0
  }

  // Handle "sen" notation, e.g. "80 sen", "50sen"
  const senMatch = str.match(/^(\d+(?:\.\d+)?)\s*sen$/i)
  if (senMatch) {
    const senVal = parseFloat(senMatch[1])
    return Number.isFinite(senVal) ? senVal / 100 : null
  }

  // Clean currency symbols, commas, non-breaking spaces, and suffixes
  str = str
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ') // replace Unicode spaces
    .replace(/^[(\s]*([rR][mM]|myr|\$)\s*/i, '') // leading RM / MYR / $
    .replace(/\s*([rR][mM]|myr|\$)[)\s]*$/i, '') // trailing RM / MYR / $
    .replace(/\s*(\/|seunit|unit|seorang|pax|set|pack|bekas|biji|pcs|keping|balang|botol).*$/i, '') // unit suffixes
    .replace(/[()]/g, '') // strip parentheses
    .replace(/,/g, '') // strip thousand commas
    .trim()

  const num = Number(str)
  return Number.isFinite(num) ? num : null
}

/**
 * Flexible quantity parser:
 * Detects positive integers with or without commas and unit suffixes (e.g. "12", "12 unit", "50 biji", "1,000").
 */
export function parseQuantity(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null
  if (typeof val === 'number') {
    return Number.isFinite(val) && val > 0 ? Math.round(val) : null
  }

  let str = String(val).trim()
  if (!str) return null

  str = str
    .replace(/\u00A0/g, ' ')
    .replace(/,/g, '') // remove commas
    .replace(/\s*(unit|biji|bungkus|keping|tempahan|pack|bekas|botol|pax|set|balang|pcs|items?).*$/i, '')
    .trim()

  const num = Number(str)
  return Number.isFinite(num) && num > 0 ? Math.round(num) : null
}

export function validateSale(
  sale: RawSale,
  row: number
): { valid: boolean; sale: ValidatedSale | null; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []

  // Produk (Required)
  const produk = (sale.produk || '').trim()
  if (!produk) {
    issues.push({ row, field: 'produk', message: 'Nama produk/perkhidmatan diperlukan.' })
  }

  // Kuantiti (Required: positive integer)
  const kuantiti = parseQuantity(sale.kuantiti)
  if (kuantiti === null) {
    issues.push({
      row,
      field: 'kuantiti',
      message: 'Kuantiti terjual mesti diisi dengan nombor bulat lebih daripada 0.',
    })
  }

  // Harga Seunit (Required: positive number >= 0, supporting RM, MYR, comma currency formatting)
  const harga = parseCurrency(sale.harga)
  if (harga === null) {
    issues.push({
      row,
      field: 'harga',
      message: 'Harga seunit mesti diisi dengan nilai wang (RM).',
    })
  } else if (harga < 0) {
    issues.push({
      row,
      field: 'harga',
      message: 'Harga seunit tidak boleh bernilai negatif.',
    })
  }

  // Kos Seunit (Optional: if provided, must be positive number >= 0, supporting RM and comma currency formatting)
  let kos: number | null = null
  if (sale.kos !== undefined && sale.kos !== null && String(sale.kos).trim() !== '') {
    const rawCost = String(sale.kos).trim()
    if (rawCost === '-' || rawCost === '--' || /^(?:n\/?a|tiada)$/i.test(rawCost)) {
      kos = null
    } else {
      const parsedCost = parseCurrency(sale.kos)
      if (parsedCost === null || parsedCost < 0) {
        issues.push({
          row,
          field: 'kos',
          message: 'Kos seunit tidak sah (mesti nombor positif jika diisi).',
        })
      } else {
        kos = parsedCost
      }
    }
  }

  // Tarikh (Optional)
  let tarikh: string | null = null
  if (sale.tarikh && String(sale.tarikh).trim() !== '') {
    tarikh = normalizeDate(sale.tarikh)
    if (!tarikh) {
      issues.push({
        row,
        field: 'tarikh',
        message: 'Format tarikh tidak dikenali (gunakan format DD/MM/YYYY atau YYYY-MM-DD).',
      })
    }
  }

  // Saluran (Optional)
  let saluran: SalesChannel | null = null
  if (sale.saluran && String(sale.saluran).trim() !== '') {
    saluran = normalizeChannel(sale.saluran)
    if (!saluran) {
      issues.push({
        row,
        field: 'saluran',
        message: 'Nama saluran jualan tidak sah (maksimum 50 aksara).',
      })
    }
  }

  // Optional SME fields (Task 6): Preserved as strings; missing optional fields never reject rows
  const kategori = sale.kategori && String(sale.kategori).trim() ? String(sale.kategori).trim() : null
  const kaedahBayaran =
    sale.kaedahBayaran && String(sale.kaedahBayaran).trim() ? String(sale.kaedahBayaran).trim() : null
  const lokasi = sale.lokasi && String(sale.lokasi).trim() ? String(sale.lokasi).trim() : null
  const idTransaksi =
    sale.idTransaksi !== undefined && sale.idTransaksi !== null && String(sale.idTransaksi).trim() !== ''
      ? String(sale.idTransaksi).trim() // Preserves leading zeros
      : null
  const masa = sale.masa && String(sale.masa).trim() ? String(sale.masa).trim() : null
  const nota = sale.nota && String(sale.nota).trim() ? String(sale.nota).trim() : null

  const valid = issues.length === 0
  return {
    valid,
    sale: valid
      ? {
          produk,
          kuantiti: kuantiti!,
          harga: harga!,
          kos,
          tarikh,
          saluran,
          kategori,
          kaedahBayaran,
          lokasi,
          idTransaksi,
          masa,
          nota,
        }
      : null,
    issues,
  }
}

export function validateRecords(records: RawSale[]): ValidationSummary {
  const valid: ValidatedSale[] = []
  const invalid: { row: number; sale: RawSale; issues: ValidationIssue[] }[] = []
  const allIssues: ValidationIssue[] = []

  records.forEach((sale, i) => {
    const result = validateSale(sale, i + 1)
    if (result.issues.length > 0) {
      allIssues.push(...result.issues)
    }
    if (result.valid && result.sale) {
      valid.push(result.sale)
    } else {
      invalid.push({ row: i + 1, sale, issues: result.issues })
    }
  })

  return { valid, invalid, allIssues }
}

/**
 * Formats a monetary number in Malaysian Ringgit (e.g. RM1,530.00).
 */
export function formatRM(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return '-'
  }
  return `RM${amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into Malaysian display date (e.g. "5 Jan 2026").
 */
export function formatDateMY(isoDate: string | null | undefined): string {
  if (!isoDate) return '-'
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return isoDate

  const monthsMY = [
    'Jan',
    'Feb',
    'Mac',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Ogo',
    'Sep',
    'Okt',
    'Nov',
    'Dis',
  ]
  const day = parseInt(match[3], 10)
  const monthIdx = parseInt(match[2], 10) - 1
  const year = match[1]
  const monthName = monthsMY[monthIdx] || match[2]

  return `${day} ${monthName} ${year}`
}
