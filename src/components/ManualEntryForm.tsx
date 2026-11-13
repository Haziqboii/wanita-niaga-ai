import { useState } from 'react'
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
} from './ui/Icons'
import { formatRM, validateSale, parseCurrency, parseQuantity } from '../data/validate'
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

export function ManualEntryForm({
  initialRecords = [],
  onConfirm,
  onBack,
}: ManualEntryFormProps) {
  const [records, setRecords] = useState<RawSale[]>(initialRecords)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showOptional, setShowOptional] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

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

  const handleSaveRecord = () => {
    if (isSubmitting) return
    if (!validateCurrentForm()) return

    setIsSubmitting(true)

    const newRecord: RawSale = {
      produk: form.produk.trim(),
      kuantiti: parseQuantity(form.kuantiti) ?? Number(form.kuantiti),
      harga: parseCurrency(form.harga) ?? Number(form.harga),
      kos: form.kos.trim() !== '' ? parseCurrency(form.kos) : null,
      tarikh: form.tarikh.trim() !== '' ? form.tarikh : null,
      saluran: form.saluran !== '' ? form.saluran : null,
    }

    if (editingIndex !== null) {
      const updated = [...records]
      updated[editingIndex] = newRecord
      setRecords(updated)
      setEditingIndex(null)
      showToast('Perubahan berjaya disimpan.')
    } else {
      setRecords((prev) => [...prev, newRecord])
      showToast('Jualan berjaya ditambah ke senarai.')
    }

    setForm(EMPTY_FORM)
    setShowOptional(false)
    setErrors({})
    setIsSubmitting(false)
  }

  const handleEditRecord = (index: number) => {
    const r = records[index]
    setForm({
      produk: r.produk,
      kuantiti: String(r.kuantiti),
      harga: String(r.harga),
      kos: r.kos !== null && r.kos !== undefined ? String(r.kos) : '',
      tarikh: r.tarikh || '',
      saluran: (r.saluran as any) || '',
    })
    setEditingIndex(index)
    if (r.kos || r.tarikh || r.saluran) {
      setShowOptional(true)
    }
    setErrors({})
  }

  const handleRemoveRecord = (index: number) => {
    const target = records[index]
    const name = target?.produk || 'rekod ini'
    if (!window.confirm(`Adakah Puan pasti mahu memadam rekod "${name}"?`)) {
      return
    }

    setRecords((prev) => prev.filter((_, i) => i !== index))
    if (editingIndex === index) {
      setEditingIndex(null)
      setForm(EMPTY_FORM)
      setShowOptional(false)
    }
    showToast('Rekod telah dipadam.')
  }

  const handleConfirm = () => {
    if (records.length === 0) {
      alert('Sila tambah sekurang-kurangnya satu rekod jualan.')
      return
    }
    onConfirm(records)
  }

  const handleSafeBack = () => {
    if (form.produk.trim() || form.kuantiti || form.harga) {
      if (
        !window.confirm(
          'Terdapat maklumat yang sedang diisi dan belum ditambah ke senarai. Adakah Puan pasti mahu kembali?'
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
    <div className="space-y-4 sm:space-y-5 max-w-xl mx-auto animate-fadeIn">
      {/* 1. Page Heading & Subtitle */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#28152F] font-heading tracking-tight leading-tight">
          Tambah jualan Puan
        </h2>
        <p className="text-sm sm:text-base text-[#68586B] font-body leading-relaxed">
          Masukkan maklumat satu produk atau perkhidmatan pada satu masa.
        </p>
      </div>

      {/* 2. Toast Notification Feedback */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl flex items-center gap-2 shadow-2xs animate-fadeIn">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 3. Manual Entry Form Card (Matching Reference Mockup 2) */}
      <div className="bg-white border border-[#F1D3E3] rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
        {editingIndex !== null && (
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs sm:text-sm font-bold text-[#BE1E72]">
              Sedang Mengedit Rekod #{editingIndex + 1}
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingIndex(null)
                setForm(EMPTY_FORM)
                setErrors({})
                setShowOptional(false)
              }}
              className="text-xs font-semibold text-[#68586B] hover:text-[#28152F] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              Batal Edit
            </button>
          </div>
        )}

        {/* Field: Nama Produk */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#28152F] mb-1.5">
            Nama Produk / Perkhidmatan *
          </label>
          <input
            type="text"
            value={form.produk}
            onChange={(e) => {
              setForm((p) => ({ ...p, produk: e.target.value }))
              if (errors.produk) setErrors((p) => ({ ...p, produk: '' }))
            }}
            placeholder="Contoh: Karipap"
            className={`w-full rounded-2xl border px-3.5 py-2.5 sm:py-3 text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72] transition-all ${
              errors.produk ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#28152F] mb-1.5">
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
              className={`w-full rounded-2xl border px-3.5 py-2.5 sm:py-3 text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72] transition-all ${
                errors.kuantiti ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
              }`}
            />
            {errors.kuantiti && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.kuantiti}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#28152F] mb-1.5">
              Harga (RM) *
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
              className={`w-full rounded-2xl border px-3.5 py-2.5 sm:py-3 text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72] transition-all ${
                errors.harga ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
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
            className="w-full bg-[#FFF5FA] hover:bg-pink-100/60 border border-[#F1D3E3] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#BE1E72] flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span>{showOptional ? '−' : '+'}</span>
              <span>Maklumat tambahan (pilihan)</span>
              {!showOptional && hasOptionalData && (
                <span className="text-[10px] bg-pink-100 text-[#BE1E72] px-2 py-0.5 rounded-full font-bold ml-1">
                  Diisi
                </span>
              )}
            </div>
            {showOptional ? (
              <ChevronUpIcon className="w-4 h-4 text-[#BE1E72]" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-[#BE1E72]" />
            )}
          </button>

          {/* When expanded: Kos, Tarikh, Saluran */}
          {showOptional && (
            <div className="mt-3 p-3.5 bg-[#FFF5FA]/50 rounded-2xl border border-[#F1D3E3] space-y-3 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-[#28152F] mb-1">
                  Kos Seunit (RM) <span className="text-[#68586B] font-normal">(Pilihan)</span>
                </label>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  inputMode="decimal"
                  placeholder="cth. 0.80"
                  value={form.kos}
                  onChange={(e) => setForm((p) => ({ ...p, kos: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs sm:text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                />
                <p className="text-[11px] text-[#68586B] mt-0.5">
                  Diperlukan untuk mengira untung kasar & bersih perniagaan.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#28152F] mb-1">
                    Tarikh Jualan <span className="text-[#68586B] font-normal">(Pilihan)</span>
                  </label>
                  <input
                    type="date"
                    value={form.tarikh}
                    onChange={(e) => setForm((p) => ({ ...p, tarikh: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs sm:text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#28152F] mb-1">
                    Saluran Jualan <span className="text-[#68586B] font-normal">(Pilihan)</span>
                  </label>
                  <select
                    value={form.saluran}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, saluran: e.target.value as any }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs sm:text-sm text-[#28152F] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE1E72]/20 focus:border-[#BE1E72]"
                  >
                    <option value="">Tiada</option>
                    <option value="Booth">Booth / Gerai</option>
                    <option value="Online">Online</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Primary Submit Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleSaveRecord}
            disabled={isSubmitting}
            className="w-full min-h-[48px] sm:min-h-[50px] bg-[#BE1E72] hover:bg-[#A3165F] active:bg-[#8B0F4E] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-pink-300/40"
          >
            {editingIndex !== null ? (
              <span>Simpan Pembetulan</span>
            ) : (
              <>
                <span className="text-lg font-bold leading-none">+</span>
                <span>Tambah Jualan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Sales List Section ("Senarai Jualan") */}
      <div className="space-y-3 pt-1">
        {/* Header row: Senarai Jualan & Record count badge */}
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-[#28152F] font-heading">
            Senarai Jualan
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
            {records.length} rekod
          </span>
        </div>

        {/* Empty list hint */}
        {records.length === 0 && (
          <div className="bg-white border border-[#F1D3E3] rounded-2xl p-6 text-center text-xs sm:text-sm text-[#68586B] shadow-2xs">
            Belum ada jualan dalam senarai. Sila isi borang di atas dan tekan &ldquo;Tambah Jualan&rdquo;.
          </div>
        )}

        {/* List of Sales Cards (Matching Reference Mockup 2) */}
        {records.length > 0 && (
          <div className="space-y-2.5">
            {records.map((r, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#F1D3E3] rounded-2xl p-3.5 sm:p-4 space-y-1.5 shadow-2xs hover:border-pink-300 transition-colors"
              >
                {/* Row 1: Product name + Channel on left, Edit & Delete actions on right */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="font-bold text-sm sm:text-base text-[#28152F] truncate">
                      {r.produk}
                    </h4>
                    {r.saluran && (
                      <span className="text-[10px] sm:text-xs bg-[#E6F4F1] text-[#0D9488] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {r.saluran}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditRecord(idx)}
                      className="text-xs sm:text-sm font-semibold text-[#BE1E72] hover:text-[#A3165F] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecord(idx)}
                      className="text-xs sm:text-sm font-semibold text-rose-500 hover:text-rose-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
                      title={`Padam ${r.produk}`}
                      aria-label={`Padam ${r.produk}`}
                    >
                      Padam
                    </button>
                  </div>
                </div>

                {/* Row 2: Qty × Price on left, Total calculated amount on right */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="text-xs sm:text-sm text-[#68586B]">
                    <span>
                      {r.kuantiti} &times; {formatRM(Number(r.harga))}
                    </span>
                    {r.kos !== null && r.kos !== undefined && r.kos !== '' && (
                      <span className="ml-2 text-gray-400">
                        (Kos: {formatRM(Number(r.kos))})
                      </span>
                    )}
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-[#28152F] font-heading">
                    {formatRM(Number(r.kuantiti) * Number(r.harga))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Primary Bottom CTA Button: Jana Laporan Jualan */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={records.length === 0}
          className={`w-full min-h-[48px] sm:min-h-[52px] rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
            records.length === 0
              ? 'bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
              : 'bg-[#BE1E72] hover:bg-[#A3165F] active:bg-[#8B0F4E] active:scale-[0.99] text-white shadow-pink-300/50'
          }`}
        >
          <CheckCircleIcon className="w-5 h-5 text-white" />
          <span>Jana Laporan Jualan</span>
        </button>

        <button
          type="button"
          onClick={handleSafeBack}
          className="w-full min-h-[44px] text-xs sm:text-sm font-semibold text-[#68586B] hover:text-[#28152F] flex items-center justify-center transition-colors cursor-pointer"
        >
          &larr; Kembali ke Menu Utama
        </button>
      </div>
    </div>
  )
}
