import { useState, useEffect, useMemo, useRef } from 'react'
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from './ui/Icons'
import {
  formatRM,
  formatDateMY,
  normalizeDate,
  validateSale,
  parseCurrency,
  parseQuantity,
} from '../data/validate'
import {
  initializeManagedRecords,
  extractRecordMonths,
  extractRecordChannels,
  filterAndSortRecords,
  paginateRecords,
  type ManagedRecord,
} from '../calc/recordManager'
import type { RawSale, SalesChannel } from '../types'

export interface ManualEntryFormProps {
  initialRecords?: RawSale[]
  onConfirm: (records: RawSale[]) => void
  onBack: () => void
}

interface FormState {
  produk: string
  kuantiti: string
  harga: string
  kos: string
  tarikh: string
  saluran: SalesChannel | ''
}

const EMPTY_FORM: FormState = {
  produk: '',
  kuantiti: '',
  harga: '',
  kos: '',
  tarikh: '',
  saluran: '',
}

function FilterSlidersIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  )
}

export function ManualEntryForm({
  initialRecords = [],
  onConfirm,
  onBack,
}: ManualEntryFormProps) {
  // 1. Managed Records state with unique stable IDs
  const [records, setRecords] = useState<ManagedRecord[]>(() =>
    initializeManagedRecords(initialRecords)
  )

  // 2. Form state (Progressive Disclosure)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(initialRecords.length === 0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showOptional, setShowOptional] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const formRef = useRef<HTMLDivElement>(null)

  // 3. Search, Filter & Sort state
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL')
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('ALL')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false)

  // 4. Pagination state (20 records per page)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 20

  // 5. Delete confirmation modal state
  const [deletingRecord, setDeletingRecord] = useState<ManagedRecord | null>(null)

  // 6. Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Dynamic filter options derived from current records
  const availableMonths = useMemo(() => extractRecordMonths(records), [records])
  const availableChannels = useMemo(() => extractRecordChannels(records), [records])

  // Count active filters (month or channel)
  const activeFilterCount =
    (selectedMonthFilter !== 'ALL' ? 1 : 0) + (selectedChannelFilter !== 'ALL' ? 1 : 0)

  // Filtered and sorted record collection
  const filteredAndSortedRecords = useMemo(() => {
    return filterAndSortRecords(records, {
      searchQuery,
      monthFilter: selectedMonthFilter,
      channelFilter: selectedChannelFilter,
      sortOrder,
    })
  }, [records, searchQuery, selectedMonthFilter, selectedChannelFilter, sortOrder])

  // Paged record slice
  const pagination = useMemo(() => {
    return paginateRecords(filteredAndSortedRecords, currentPage, pageSize)
  }, [filteredAndSortedRecords, currentPage, pageSize])

  const { pageItems, totalPages, totalItems, startIndex, endIndex, currentPage: validPage } =
    pagination

  // Form Validation
  const validateCurrentForm = (): boolean => {
    const nextErrors: Record<string, string> = {}
    const rawCandidate: RawSale = {
      produk: form.produk.trim(),
      kuantiti: form.kuantiti,
      harga: form.harga,
      kos: form.kos.trim() !== '' ? form.kos : null,
      tarikh: form.tarikh.trim() !== '' ? form.tarikh : null,
      saluran: form.saluran !== '' ? form.saluran : null,
    }

    if (!rawCandidate.produk) {
      nextErrors.produk = 'Sila masukkan nama produk atau perkhidmatan.'
    }

    const { valid, issues } = validateSale(rawCandidate, 1)
    if (!valid) {
      issues.forEach((iss) => {
        nextErrors[iss.field] = iss.message
      })
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  // Open Add Form
  const handleOpenAddForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setShowOptional(false)
    setIsFormOpen(true)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
  }

  // Close Form
  const handleCloseForm = () => {
    if (form.produk.trim() || form.kuantiti || form.harga) {
      if (
        !window.confirm(
          'Terdapat maklumat yang belum disimpan. Adakah Puan pasti mahu menutup borang?'
        )
      ) {
        return
      }
    }
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setShowOptional(false)
    setIsFormOpen(false)
  }

  // Save Record (Add or Edit)
  const handleSaveRecord = () => {
    if (isSubmitting) return
    if (!validateCurrentForm()) return

    setIsSubmitting(true)

    const cleanedData = {
      produk: form.produk.trim(),
      kuantiti: parseQuantity(form.kuantiti) ?? Number(form.kuantiti),
      harga: parseCurrency(form.harga) ?? Number(form.harga),
      kos: form.kos.trim() !== '' ? parseCurrency(form.kos) : null,
      tarikh: form.tarikh.trim() !== '' ? form.tarikh : null,
      saluran: form.saluran !== '' ? form.saluran : null,
    }

    if (editingId !== null) {
      // Edit ONLY the targeted transaction
      const updated = records.map((r) =>
        r.id === editingId ? { ...r, ...cleanedData } : r
      )
      setRecords(updated)
      setEditingId(null)
      setIsFormOpen(false)

      // Check if updated record is hidden by active filter
      const q = searchQuery.trim().toLowerCase()
      const matchesQ = !q || cleanedData.produk.toLowerCase().includes(q)
      const normDate = cleanedData.tarikh
        ? normalizeDate(cleanedData.tarikh) || cleanedData.tarikh
        : ''
      const matchesMonth =
        selectedMonthFilter === 'ALL' ||
        (Boolean(normDate) && normDate.startsWith(selectedMonthFilter))
      const matchesChannel =
        selectedChannelFilter === 'ALL' || cleanedData.saluran === selectedChannelFilter

      if (!matchesQ || !matchesMonth || !matchesChannel) {
        showToast(
          'Jualan berjaya disimpan, tapi tak dipaparkan sebab filter masih aktif.'
        )
      } else {
        showToast('Perubahan berjaya disimpan.')
      }
    } else {
      // Add new record with unique stable ID
      const newRecord: ManagedRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...cleanedData,
      }
      setRecords((prev) => [newRecord, ...prev])
      setIsFormOpen(false)

      // Check if new record is hidden by active filter
      const q = searchQuery.trim().toLowerCase()
      const matchesQ = !q || newRecord.produk.toLowerCase().includes(q)
      const normDate = newRecord.tarikh
        ? normalizeDate(newRecord.tarikh) || newRecord.tarikh
        : ''
      const matchesMonth =
        selectedMonthFilter === 'ALL' ||
        (Boolean(normDate) && normDate.startsWith(selectedMonthFilter))
      const matchesChannel =
        selectedChannelFilter === 'ALL' || newRecord.saluran === selectedChannelFilter

      if (!matchesQ || !matchesMonth || !matchesChannel) {
        showToast(
          'Jualan berjaya disimpan, tapi tak dipaparkan sebab filter masih aktif.'
        )
      } else {
        showToast('Jualan berjaya ditambah ke senarai.')
      }
    }

    setForm(EMPTY_FORM)
    setShowOptional(false)
    setErrors({})
    setIsSubmitting(false)
  }

  // Edit action on card
  const handleEditRecord = (targetRecord: ManagedRecord) => {
    setForm({
      produk: targetRecord.produk,
      kuantiti: String(targetRecord.kuantiti),
      harga: String(targetRecord.harga),
      kos:
        targetRecord.kos !== null && targetRecord.kos !== undefined
          ? String(targetRecord.kos)
          : '',
      tarikh: targetRecord.tarikh || '',
      saluran: (targetRecord.saluran as any) || '',
    })
    setEditingId(targetRecord.id)
    if (targetRecord.kos || targetRecord.tarikh || targetRecord.saluran) {
      setShowOptional(true)
    }
    setErrors({})
    setIsFormOpen(true)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  // Delete action on card
  const handleDeleteClick = (record: ManagedRecord) => {
    setDeletingRecord(record)
  }

  const confirmDeleteRecord = () => {
    if (!deletingRecord) return
    const idToDelete = deletingRecord.id
    setRecords((prev) => prev.filter((r) => r.id !== idToDelete))
    if (editingId === idToDelete) {
      setEditingId(null)
      setForm(EMPTY_FORM)
      setIsFormOpen(false)
    }
    setDeletingRecord(null)
    showToast('Rekod telah dipadam.')
  }

  // Clear filters
  const handleClearFilters = () => {
    setSelectedMonthFilter('ALL')
    setSelectedChannelFilter('ALL')
    setCurrentPage(1)
  }

  // Clear all (search + filters)
  const handleClearAll = () => {
    setSearchQuery('')
    setSelectedMonthFilter('ALL')
    setSelectedChannelFilter('ALL')
    setCurrentPage(1)
  }

  // Bottom primary confirm
  const handleConfirm = () => {
    if (records.length === 0) {
      alert('Sila tambah sekurang-kurangnya satu rekod jualan.')
      return
    }
    // Return full dataset of RawSale records
    const cleanRawSales: RawSale[] = records.map(({ id: _id, ...rest }) => rest)
    onConfirm(cleanRawSales)
  }

  const handleSafeBack = () => {
    if (isFormOpen && (form.produk.trim() || form.kuantiti || form.harga)) {
      if (
        !window.confirm(
          'Terdapat maklumat yang sedang diisi dan belum disimpan. Adakah Puan pasti mahu kembali?'
        )
      ) {
        return
      }
    }
    onBack()
  }

  const hasOptionalData = Boolean(
    form.kos.trim() !== '' || form.tarikh.trim() !== '' || form.saluran !== ''
  )

  return (
    <div className="space-y-5 sm:space-y-6 max-w-xl mx-auto pb-8">
      {/* 1. Page Heading, Subtitle & Primary Add Action */}
      <div
        className="apple-reveal-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5"
        style={{ animationDelay: '0ms' }}
      >
        <div className="space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#171317] font-heading tracking-tight leading-tight">
            Urus Rekod Jualan
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6069] font-body leading-relaxed">
            Urus, cari, tapis dan sunting rekod jualan Puan dengan mudah.
          </p>
        </div>

        {/* Primary Action: + Tambah Jualan */}
        {!isFormOpen && (
          <button
            type="button"
            onClick={handleOpenAddForm}
            className="btn-primary-burgundy apple-hover-card self-start sm:self-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 text-white font-bold text-xs sm:text-sm rounded-full shadow-[0_4px_14px_rgba(128,0,32,0.25)] transition-all cursor-pointer min-h-[44px] shrink-0"
          >
            <PlusIcon className="w-4 h-4 text-white" />
            <span>Tambah Jualan</span>
          </button>
        )}
      </div>

      {/* 2. Toast Notification Feedback */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm px-4 py-2.5 rounded-full flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 3. Manual Entry / Edit Form (Progressive Disclosure) */}
      {isFormOpen && (
        <div
          ref={formRef}
          className="apple-reveal-card bg-[#FAF6F0] border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] p-4 sm:p-6 space-y-4 shadow-[0_4px_20px_rgba(23,19,23,0.03)] animate-fadeIn"
          style={{ animationDelay: '40ms' }}
        >
          {/* Form Header */}
          <div className="flex items-center justify-between border-b border-[#EBE1D7] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#F8EAE8] border border-[#EED7D5] flex items-center justify-center text-[#800020] text-sm shrink-0">
                {editingId !== null ? '✏️' : '📝'}
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#171317] font-heading">
                  {editingId !== null ? 'Edit Rekod Jualan' : 'Tambah Jualan Baharu'}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#7A6E77]">
                  {editingId !== null
                    ? 'Kemaskini maklumat bagi rekod ini sahaja.'
                    : 'Masukkan maklumat produk yang terjual.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseForm}
              className="text-xs font-semibold text-[#7A6E77] hover:text-[#171317] px-3 py-1.5 rounded-lg hover:bg-[#FAF4EA] transition-colors cursor-pointer min-h-[38px] flex items-center justify-center shrink-0"
            >
              ✕ Batal
            </button>
          </div>

          {/* Field: Nama Produk */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#171317] mb-1.5">
              Nama Produk / Perkhidmatan *
            </label>
            <input
              type="text"
              value={form.produk}
              onChange={(e) => {
                setForm((p) => ({ ...p, produk: e.target.value }))
                if (errors.produk) setErrors((p) => ({ ...p, produk: '' }))
              }}
              placeholder="Contoh: Karipap Daging"
              className={`w-full rounded-xl border px-3.5 py-2.5 sm:py-3 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020] transition-colors ${
                errors.produk ? 'border-rose-300 bg-rose-50/20' : 'border-[#EBE1D7]'
              }`}
            />
            {errors.produk && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.produk}</span>
              </p>
            )}
          </div>

          {/* 2-Column Grid: Kuantiti & Harga */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#171317] mb-1.5">
                Kuantiti *
              </label>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={form.kuantiti}
                onChange={(e) => {
                  setForm((p) => ({ ...p, kuantiti: e.target.value }))
                  if (errors.kuantiti) setErrors((p) => ({ ...p, kuantiti: '' }))
                }}
                placeholder="50"
                className={`w-full rounded-xl border px-3.5 py-2.5 sm:py-3 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020] transition-colors ${
                  errors.kuantiti ? 'border-rose-300 bg-rose-50/20' : 'border-[#EBE1D7]'
                }`}
              />
              {errors.kuantiti && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.kuantiti}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#171317] mb-1.5">
                Harga Seunit (RM) *
              </label>
              <input
                type="number"
                step="0.10"
                min="0"
                inputMode="decimal"
                value={form.harga}
                onChange={(e) => {
                  setForm((p) => ({ ...p, harga: e.target.value }))
                  if (errors.harga) setErrors((p) => ({ ...p, harga: '' }))
                }}
                placeholder="2.00"
                className={`w-full rounded-xl border px-3.5 py-2.5 sm:py-3 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020] transition-colors ${
                  errors.harga ? 'border-rose-300 bg-rose-50/20' : 'border-[#EBE1D7]'
                }`}
              />
              {errors.harga && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.harga}</p>
              )}
            </div>
          </div>

          {/* Collapsible: Maklumat tambahan (pilihan) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="w-full bg-[#FAF4EA] hover:bg-[#F4EDE5] border border-[#EBE1D7] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#800020] flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>{showOptional ? '−' : '+'}</span>
                <span>Maklumat tambahan (pilihan)</span>
                {!showOptional && hasOptionalData && (
                  <span className="text-[10px] bg-[#F8EAE8] text-[#800020] border border-[#EED7D5] px-2 py-0.5 rounded-full font-bold ml-1.5">
                    Diisi
                  </span>
                )}
              </div>
              {showOptional ? (
                <ChevronUpIcon className="w-4 h-4 text-[#800020]" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-[#800020]" />
              )}
            </button>

            {showOptional && (
              <div className="mt-3 p-3.5 sm:p-4 bg-[#FAF4EA]/60 rounded-xl border border-[#EBE1D7] space-y-3 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-[#171317] mb-1">
                    Kos Seunit (RM) <span className="text-[#7A6E77] font-normal">(Pilihan)</span>
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    inputMode="decimal"
                    placeholder="cth. 0.80"
                    value={form.kos}
                    onChange={(e) => setForm((p) => ({ ...p, kos: e.target.value }))}
                    className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020]"
                  />
                  <p className="text-[11px] text-[#7A6E77] mt-0.5">
                    Diperlukan untuk mengira untung kasar perniagaan.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#171317] mb-1">
                      Tarikh Jualan <span className="text-[#7A6E77] font-normal">(Pilihan)</span>
                    </label>
                    <input
                      type="date"
                      value={form.tarikh}
                      onChange={(e) => setForm((p) => ({ ...p, tarikh: e.target.value }))}
                      className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#171317] mb-1">
                      Saluran Jualan <span className="text-[#7A6E77] font-normal">(Pilihan)</span>
                    </label>
                    <select
                      value={form.saluran}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, saluran: e.target.value as any }))
                      }
                      className="w-full rounded-xl border border-[#EBE1D7] px-3.5 py-2 text-base sm:text-sm text-[#171317] bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020]"
                    >
                      <option value="">Tiada</option>
                      <option value="Gerai">Gerai</option>
                      <option value="Booth">Booth</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Online">Online</option>
                      <option value="Tempahan">Tempahan</option>
                      <option value="TikTok Shop">TikTok Shop</option>
                      <option value="Bazar">Bazar</option>
                      <option value="Kiosk">Kiosk</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Action Buttons: Simpan & Batal */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleCloseForm}
              className="btn-secondary-neutral flex-1 min-h-[46px] rounded-full text-xs sm:text-sm font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveRecord}
              disabled={isSubmitting}
              className="btn-primary-burgundy flex-2 min-h-[46px] text-white font-bold text-xs sm:text-sm rounded-full shadow-[0_4px_14px_rgba(128,0,32,0.28)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {editingId !== null ? (
                <span>Simpan Pembetulan</span>
              ) : (
                <>
                  <span className="text-base font-bold leading-none">+</span>
                  <span>Simpan ke Senarai</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. Record Management Controls (Search, Filters, Sort) */}
      <div
        className="apple-reveal-card bg-[#FAF6F0] border border-[#EBE1D7] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 space-y-3.5 shadow-[0_4px_20px_rgba(23,19,23,0.03)]"
        style={{ animationDelay: '80ms' }}
      >
        {/* Section Header: Senarai Jualan & Total Count Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[#171317] font-heading">
              Senarai Jualan
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#800020] border border-[#EED7D5]">
              {records.length} rekod
            </span>
          </div>

          {/* Top Pagination counter or mini indicator */}
          {records.length > 0 && (
            <span className="text-[11px] sm:text-xs text-[#7A6E77] font-medium">
              {filteredAndSortedRecords.length !== records.length ? (
                <span>
                  <strong className="text-[#800020]">
                    {filteredAndSortedRecords.length}
                  </strong>{' '}
                  sepadan
                </span>
              ) : (
                <span>Halaman {validPage} / {totalPages}</span>
              )}
            </span>
          )}
        </div>

        {/* Search Field */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A6E77]">
            <MagnifyingGlassIcon className="w-4 h-4 text-[#7A6E77]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Cari nama produk..."
            className="w-full pl-10 pr-9 py-2.5 text-base sm:text-sm text-[#171317] bg-white border border-[#EBE1D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020] transition-colors placeholder:text-[#A0939E]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#7A6E77] hover:text-[#171317] cursor-pointer"
              title="Padam carian"
              aria-label="Padam carian"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Toggle & Sorting Bar */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Filter button with badge */}
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`btn-secondary-neutral inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer min-h-[38px] transition-colors ${
              activeFilterCount > 0 || isFilterPanelOpen
                ? 'bg-[#FAF0E6] text-[#800020] border-[#EED7D5]'
                : ''
            }`}
          >
            <FilterSlidersIcon className="w-3.5 h-3.5 text-current" />
            <span>Tapis</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#800020] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <span className="text-[10px] ml-0.5">
              {isFilterPanelOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Sorting Control */}
          <div className="flex items-center gap-1.5 text-xs text-[#7A6E77]">
            <span className="hidden min-[380px]:inline font-medium">Susun:</span>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as 'newest' | 'oldest')
                setCurrentPage(1)
              }}
              className="bg-white border border-[#EBE1D7] rounded-full px-3 py-1.5 text-xs font-semibold text-[#171317] focus:outline-none focus:ring-2 focus:ring-[#800020]/15 focus:border-[#800020] cursor-pointer"
            >
              <option value="newest">Terbaharu</option>
              <option value="oldest">Terlama</option>
            </select>
          </div>
        </div>

        {/* Filter Disclosure Panel */}
        {isFilterPanelOpen && (
          <div className="bg-[#FAF4EA]/80 border border-[#EBE1D7] rounded-xl p-3.5 space-y-3 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Filter: Month */}
              <div>
                <label className="block text-[11px] font-bold text-[#171317] mb-1">
                  Bulan / Tarikh:
                </label>
                <select
                  value={selectedMonthFilter}
                  onChange={(e) => {
                    setSelectedMonthFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full bg-white border border-[#EBE1D7] rounded-lg px-2.5 py-1.5 text-xs text-[#171317] focus:outline-none focus:ring-1 focus:ring-[#800020]"
                >
                  <option value="ALL">Semua Bulan</option>
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter: Sales Channel */}
              <div>
                <label className="block text-[11px] font-bold text-[#171317] mb-1">
                  Saluran Jualan:
                </label>
                <select
                  value={selectedChannelFilter}
                  onChange={(e) => {
                    setSelectedChannelFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full bg-white border border-[#EBE1D7] rounded-lg px-2.5 py-1.5 text-xs text-[#171317] focus:outline-none focus:ring-1 focus:ring-[#800020]"
                >
                  <option value="ALL">Semua Saluran</option>
                  {availableChannels.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filter Clear button */}
            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-[#EBE1D7]/70 text-xs">
                <span className="text-[#7A6E77]">
                  {filteredAndSortedRecords.length} daripada {records.length} rekod
                </span>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-[#800020] hover:underline cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Senarai Kad Jualan (Paginated to 20 per page) */}
      <div className="space-y-3">
        {/* Pagination Slice Summary */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between text-xs text-[#7A6E77] px-1 font-body">
            <span>
              {activeFilterCount > 0 || searchQuery.trim() ? (
                <>
                  Menunjukkan <strong>{startIndex + 1}–{endIndex}</strong> daripada{' '}
                  <strong className="text-[#171317]">{totalItems}</strong> rekod sepadan{' '}
                  <span className="text-[#7A6E77]/80">({records.length} keseluruhan)</span>
                </>
              ) : (
                <>
                  Menunjukkan <strong>{startIndex + 1}–{endIndex}</strong> daripada{' '}
                  <strong className="text-[#171317]">{totalItems}</strong> rekod
                </>
              )}
            </span>
            <span className="font-semibold text-[#171317]">
              Halaman {validPage} / {totalPages}
            </span>
          </div>
        )}

        {/* Empty State A: No records at all */}
        {records.length === 0 && (
          <div className="bg-[#FAF6F0] border border-[#EBE1D7] rounded-[22px] p-8 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-[#F8EAE8] border border-[#EED7D5] flex items-center justify-center text-[#800020] mx-auto text-xl">
              📦
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-[#171317] font-heading">
                Belum ada rekod jualan.
              </h4>
              <p className="text-xs sm:text-sm text-[#7A6E77]">
                Tambah jualan pertama Puan untuk bermula.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="btn-primary-burgundy inline-flex items-center gap-2 px-6 py-2.5 text-white font-bold text-xs sm:text-sm rounded-full shadow-sm cursor-pointer"
              >
                <PlusIcon className="w-4 h-4 text-white" />
                <span>Tambah Jualan</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State B: Filter / Search found 0 matches */}
        {records.length > 0 && totalItems === 0 && (
          <div className="bg-[#FAF6F0] border border-[#EBE1D7] rounded-[22px] p-7 text-center space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto text-lg">
              🔍
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm sm:text-base text-[#171317] font-heading">
                Tiada jualan dijumpai.
              </h4>
              <p className="text-xs text-[#7A6E77]">
                Cuba ubah carian atau filter.
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleClearAll}
                className="btn-secondary-neutral inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full cursor-pointer"
              >
                <span>Reset Carian & Filter</span>
              </button>
            </div>
          </div>
        )}

        {/* Render 20 Cards for Current Page */}
        {pageItems.length > 0 && (
          <div className="space-y-2.5">
            {pageItems.map((r) => {
              const totalAmount = Number(r.kuantiti) * Number(r.harga)
              const formattedDate = r.tarikh
                ? formatDateMY(normalizeDate(r.tarikh) || r.tarikh)
                : null

              return (
                <div
                  key={r.id}
                  className="apple-reveal-card bg-white border border-[#EBE1D7] rounded-[18px] sm:rounded-[20px] p-3.5 sm:p-4 space-y-2 hover:border-[#800020]/30 hover:shadow-[0_4px_16px_rgba(23,19,23,0.04)] transition-all shadow-2xs"
                >
                  {/* Row 1: Product name + Channel on left, Edit & Delete actions on right */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-[#171317] truncate">
                        {r.produk}
                      </h4>
                      {r.saluran && (
                        <span className="text-[10px] sm:text-xs bg-[#F8EAE8] text-[#800020] border border-[#EED7D5] font-semibold px-2 py-0.5 rounded-full shrink-0">
                          {r.saluran}
                        </span>
                      )}
                    </div>

                    {/* Actions: Edit & Padam */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditRecord(r)}
                        className="text-xs sm:text-sm font-semibold text-[#800020] hover:text-[#70193D] hover:bg-[#FAF4EA] min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                        title={`Edit ${r.produk}`}
                        aria-label={`Edit ${r.produk}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(r)}
                        className="text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                        title={`Padam ${r.produk}`}
                        aria-label={`Padam ${r.produk}`}
                      >
                        Padam
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Date + Qty x Price on left, Total Amount on right */}
                  <div className="flex items-end justify-between gap-2 pt-0.5 border-t border-[#F5ECE0]">
                    <div className="text-xs text-[#7A6E77] space-y-0.5">
                      {formattedDate && (
                        <p className="font-medium text-[#171317]/85">
                          {formattedDate}
                        </p>
                      )}
                      <p>
                        <span>
                          {r.kuantiti} &times; {formatRM(Number(r.harga))}
                        </span>
                        {r.kos !== null && r.kos !== undefined && r.kos !== '' && (
                          <span className="ml-1.5 text-[#7A6E77]/80">
                            (Kos: {formatRM(Number(r.kos))})
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="text-base sm:text-lg font-extrabold text-[#171317] font-heading tabular-nums shrink-0">
                      {formatRM(totalAmount)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validPage <= 1}
              className={`btn-secondary-neutral px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-full min-h-[44px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                validPage <= 1
                  ? 'opacity-40 cursor-not-allowed hover:bg-transparent'
                  : ''
              }`}
            >
              <span>&larr;</span>
              <span>Sebelum</span>
            </button>

            <span className="text-xs sm:text-sm font-bold text-[#171317] font-body">
              Halaman {validPage} daripada {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validPage >= totalPages}
              className={`btn-secondary-neutral px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-full min-h-[44px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                validPage >= totalPages
                  ? 'opacity-40 cursor-not-allowed hover:bg-transparent'
                  : ''
              }`}
            >
              <span>Seterusnya</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. Primary Bottom CTA Buttons */}
      <div
        className="apple-reveal-card space-y-2.5 pt-3"
        style={{ animationDelay: '160ms' }}
      >
        <button
          type="button"
          onClick={handleConfirm}
          disabled={records.length === 0}
          className={`apple-hover-card w-full min-h-[48px] sm:min-h-[52px] rounded-full font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_14px_rgba(128,0,32,0.28)] ${
            records.length === 0
              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
              : 'btn-primary-burgundy text-white'
          }`}
        >
          <CheckCircleIcon className="w-5 h-5 text-white" />
          <span>Jana Laporan Jualan ({records.length} Rekod)</span>
        </button>

        <button
          type="button"
          onClick={handleSafeBack}
          className="btn-secondary-neutral w-full min-h-[44px] text-xs sm:text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer rounded-full"
        >
          &larr; Kembali ke {records.length > 0 ? 'Papan Pemuka' : 'Menu Utama'}
        </button>
      </div>

      {/* 7. Delete Confirmation Dialog Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] border border-[#EBE1D7] rounded-[24px] max-w-sm w-full p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <TrashIcon className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#171317] font-heading">
                  Padam rekod jualan?
                </h3>
                <p className="text-xs sm:text-sm text-[#6B6069] mt-1 leading-relaxed">
                  Puan pasti mahu padam jualan ini? Jualan yang dipadam tidak boleh dikembalikan.
                </p>
              </div>
            </div>

            {/* Inset record info */}
            <div className="bg-white border border-[#EBE1D7] rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-[#171317]">
                <span className="truncate max-w-[180px]">
                  {deletingRecord.produk}
                </span>
                {deletingRecord.saluran && (
                  <span className="bg-[#F8EAE8] text-[#800020] border border-[#EED7D5] px-2 py-0.5 rounded-full text-[10px] shrink-0">
                    {deletingRecord.saluran}
                  </span>
                )}
              </div>
              <div className="text-[#7A6E77] flex items-center justify-between pt-0.5">
                <span>
                  {deletingRecord.kuantiti} &times; {formatRM(Number(deletingRecord.harga))}
                  {deletingRecord.tarikh &&
                    ` • ${formatDateMY(normalizeDate(deletingRecord.tarikh) || deletingRecord.tarikh)}`}
                </span>
                <span className="font-bold text-[#171317]">
                  {formatRM(
                    Number(deletingRecord.kuantiti) * Number(deletingRecord.harga)
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="btn-secondary-neutral flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-full min-h-[44px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteRecord}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-full min-h-[44px] shadow-sm transition-all cursor-pointer"
              >
                Ya, Padam Jualan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
