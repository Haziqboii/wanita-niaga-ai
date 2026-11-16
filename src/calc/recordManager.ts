import type { RawSale } from '../types'
import { normalizeDate } from '../data/validate'

export interface ManagedRecord extends RawSale {
  id: string
}

const MONTH_NAMES_SHORT = [
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

export interface MonthFilterOption {
  key: string
  label: string
}

/**
 * Initializes RawSale[] with guaranteed unique, stable IDs so individual records
 * can be edited, deleted, and tracked without depending on product name or array index.
 */
export function initializeManagedRecords(sales: RawSale[]): ManagedRecord[] {
  return sales.map((s, idx) => {
    const existingId = (s as any).id
    const txId =
      s.idTransaksi !== undefined && s.idTransaksi !== null
        ? String(s.idTransaksi)
        : null
    const id = existingId
      ? String(existingId)
      : txId
        ? `tx_${txId}_${idx}`
        : `rec_${idx}_${Math.random().toString(36).slice(2, 7)}`
    return {
      ...s,
      id,
    }
  })
}

/**
 * Extracts unique months from record dates and sorts them descending (newest first).
 */
export function extractRecordMonths(records: ManagedRecord[]): MonthFilterOption[] {
  const map = new Map<string, MonthFilterOption>()

  for (const r of records) {
    if (!r.tarikh) continue
    const norm = normalizeDate(r.tarikh) || r.tarikh
    const match = String(norm).match(/^(\d{4})-(\d{2})/)
    if (match) {
      const year = match[1]
      const mNum = parseInt(match[2], 10)
      const key = `${year}-${match[2]}`
      if (!map.has(key) && mNum >= 1 && mNum <= 12) {
        map.set(key, {
          key,
          label: `${MONTH_NAMES_SHORT[mNum - 1]} ${year}`,
        })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key))
}

/**
 * Extracts unique sales channels from actual saved records.
 */
export function extractRecordChannels(records: ManagedRecord[]): string[] {
  const set = new Set<string>()
  for (const r of records) {
    if (r.saluran && String(r.saluran).trim() !== '') {
      set.add(String(r.saluran).trim())
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

export interface FilterSortOptions {
  searchQuery?: string
  monthFilter?: string
  channelFilter?: string
  sortOrder?: 'newest' | 'oldest'
}

/**
 * Filters and sorts records according to search query, month, channel, and sort order.
 * Never modifies the underlying dataset.
 */
export function filterAndSortRecords(
  records: ManagedRecord[],
  options: FilterSortOptions
): ManagedRecord[] {
  const {
    searchQuery = '',
    monthFilter = 'ALL',
    channelFilter = 'ALL',
    sortOrder = 'newest',
  } = options

  let result = [...records]

  // 1. Search by product name (case-insensitive partial match, trimmed)
  const q = searchQuery.trim().toLowerCase()
  if (q) {
    result = result.filter((r) =>
      String(r.produk || '').toLowerCase().includes(q)
    )
  }

  // 2. Filter by month (YYYY-MM)
  if (monthFilter && monthFilter !== 'ALL' && monthFilter !== 'semua') {
    result = result.filter((r) => {
      if (!r.tarikh) return false
      const norm = normalizeDate(r.tarikh) || r.tarikh
      return String(norm).startsWith(monthFilter)
    })
  }

  // 3. Filter by sales channel
  if (channelFilter && channelFilter !== 'ALL' && channelFilter !== 'semua') {
    result = result.filter((r) => {
      const ch = r.saluran ? String(r.saluran).trim() : ''
      return ch === channelFilter
    })
  }

  // 4. Sort by transaction date with deterministic secondary ordering
  result.sort((a, b) => {
    const dateA = a.tarikh ? normalizeDate(a.tarikh) || a.tarikh : ''
    const dateB = b.tarikh ? normalizeDate(b.tarikh) || b.tarikh : ''

    if (dateA && dateB) {
      const cmp = dateA.localeCompare(dateB)
      if (cmp !== 0) {
        return sortOrder === 'newest' ? -cmp : cmp
      }
    } else if (dateA && !dateB) {
      return sortOrder === 'newest' ? -1 : 1
    } else if (!dateA && dateB) {
      return sortOrder === 'newest' ? 1 : -1
    }

    // Stable secondary ordering by record ID
    return a.id.localeCompare(b.id)
  })

  return result
}

export interface PaginationResult<T> {
  pageItems: T[]
  currentPage: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
}

/**
 * Paginates an array of items (default 20 records per page).
 */
export function paginateRecords<T>(
  items: T[],
  page: number,
  pageSize = 20
): PaginationResult<T> {
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const validPage = Math.min(Math.max(1, page), totalPages)

  const startIndex = totalItems === 0 ? 0 : (validPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const pageItems = totalItems === 0 ? [] : items.slice(startIndex, endIndex)

  return {
    pageItems,
    currentPage: validPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  }
}
